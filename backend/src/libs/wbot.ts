/* eslint-disable camelcase */
import { Client, LocalAuth, DefaultOptions } from "whatsapp-web.js";
import path from "path";
import { rm } from "fs/promises";
import { getIO } from "./socket";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import SyncUnreadMessagesWbot from "../services/WbotServices/SyncUnreadMessagesWbot";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
import wbotMonitor from "../services/WbotServices/wbotMonitor";
import Queue from "./Queue";
import AppError from "../errors/AppError";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import ensureWbotClientInfo from "../helpers/ensureWbotClientInfo";
import ensureWbotPatches from "../helpers/ensureWbotPatches";
const minimalArgs = require('./minimalArgs');

interface Session extends Client {
  id: number;
  checkMessages: any;
  handlersAttached?: boolean;
  wwebEventsAttached?: boolean;
  izingPatchesApplied?: boolean;
}

const ensureWwebEventBridge = async (wbot: Session): Promise<void> => {
  if (wbot.wwebEventsAttached) return;

  const client = wbot as Client & {
    attachEventListeners?: () => Promise<void>;
  };
  if (typeof client.attachEventListeners !== "function" || !wbot.pupPage) return;

  try {
    let hasWweb = await wbot.pupPage.evaluate(
      () =>
        typeof (window as unknown as { WWebJS?: unknown }).WWebJS !==
        "undefined"
    );
    if (!hasWweb) {
      const { LoadUtils } = require("whatsapp-web.js/src/util/Injected/Utils");
      await wbot.pupPage.evaluate(LoadUtils);
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline && !hasWweb) {
        hasWweb = await wbot.pupPage.evaluate(
          () =>
            typeof (window as unknown as { WWebJS?: unknown }).WWebJS !==
            "undefined"
        );
        if (!hasWweb) {
          await new Promise<void>(r => {
            setTimeout(r, 500);
          });
        }
      }
    }

    await client.attachEventListeners();
    wbot.wwebEventsAttached = true;
    logger.info(`Session ${wbot.id}: attachEventListeners OK`);
  } catch (err) {
    logger.error(`Session ${wbot.id}: attachEventListeners failed: ${err}`);
  }
};

export const ensureWbotHandlers = (
  wbot: Session,
  whatsapp: Whatsapp
): void => {
  if (handlerSessionsAttached.has(wbot.id)) return;

  wbot.removeAllListeners("message_create");
  wbot.removeAllListeners("media_uploaded");
  wbot.removeAllListeners("message_ack");
  wbot.removeAllListeners("message_edit");
  wbot.removeAllListeners("message_revoke_everyone");
  wbot.removeAllListeners("call");

  wbotMessageListener(wbot);
  wbotMonitor(wbot, whatsapp);
  handlerSessionsAttached.add(wbot.id);
  wbot.handlersAttached = true;
  logger.info(`Session ${wbot.id}: message handlers attached`);
};

export const bootstrapConnectedWbot = async (
  wbot: Session,
  whatsapp: Whatsapp
): Promise<void> => {
  await ensureWwebEventBridge(wbot);
  await ensureWbotPatches(wbot);
  ensureWbotHandlers(wbot, whatsapp);
};

const sessions: Session[] = [];
const initializingSessions: Map<number, Promise<Session>> = new Map();
const handlerSessionsAttached = new Set<number>();

const checking: any = {};
const recoveringSessions: Set<number> = new Set();

const isBrokenWbotSessionError = (error: unknown): boolean => {
  const strError = String(error);
  return (
    strError.includes("Session closed.") ||
    strError.includes("detached Frame") ||
    strError.includes("Execution context was destroyed")
  );
};

const recoverBrokenWbotSession = async (
  wbot: Session,
  tenantId: number | string,
  reason: string
): Promise<void> => {
  if (recoveringSessions.has(wbot.id)) return;
  recoveringSessions.add(wbot.id);

  logger.error(
    `BOT Whatsapp sessão inválida (${reason}). Tenant: ${tenantId}:: BOT ID: ${wbot.id}`
  );

  if (wbot.checkMessages) {
    clearInterval(wbot.checkMessages);
    wbot.checkMessages = null;
  }

  const whatsappId = wbot.id;

  try {
    const current = await Whatsapp.findByPk(whatsappId);
    if (!current || ["OPENING", "qrcode"].includes(current.status)) {
      recoveringSessions.delete(whatsappId);
      return;
    }
  } catch (err) {
    logger.error(`recoverBrokenWbotSession | Error: ${err}`);
    recoveringSessions.delete(whatsappId);
    return;
  }

  removeWbot(whatsappId);

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    if (whatsapp) {
      await whatsapp.update({ status: "OPENING" });
      setTimeout(() => {
        if (isWbotInitializing(whatsappId)) {
          recoveringSessions.delete(whatsappId);
          return;
        }
        StartWhatsAppSession(whatsapp)
          .catch(err => logger.error(`recoverBrokenWbotSession: ${err}`))
          .finally(() => recoveringSessions.delete(whatsappId));
      }, 2000);
      return;
    }
  } catch (err) {
    logger.error(`recoverBrokenWbotSession | Error: ${err}`);
  }

  recoveringSessions.delete(whatsappId);
};

/** Versão default do wwebjs (2.3000.1017054665) retorna 404 no wppconnect — trava após AUTHENTICATED */
const DEFAULT_WEB_VERSION =
  process.env.WWEB_VERSION || "2.3000.1042131934-alpha";
const WEB_VERSION_REMOTE_PATH =
  process.env.WWEB_VERSION_REMOTE_PATH ||
  "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html";
const READY_FALLBACK_MS = Number(process.env.WWEB_READY_FALLBACK_MS || 90000);

export const apagarPastaSessao = async (id: number | string): Promise<void> => {
  const pathRoot = path.resolve(__dirname, "..", "..", ".wwebjs_auth");
  const pathSession = `${pathRoot}/session-wbot-${id}`;
  const pathCache = path.resolve(__dirname, "..", "..", ".wwebjs_cache");
  try {
    await rm(pathSession, { recursive: true, force: true });
    await rm(pathCache, { recursive: true, force: true });
  } catch (error) {
    logger.info(`apagarPastaSessao:: ${pathSession}`);
    logger.error(error);
  }
};

export const removeWbot = (whatsappId: number): void => {
  handlerSessionsAttached.delete(whatsappId);
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].destroy();
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(`removeWbot | Error: ${err}`);
  }
};

const args: string[] = process.env.CHROME_ARGS
  ? process.env.CHROME_ARGS.split(",")
  : minimalArgs;

args.unshift(`--user-agent=${DefaultOptions.userAgent}`);
const checkMessages = async (wbot: Session, tenantId: number | string) => {
  try {
    const isConnectStatus = wbot && (await wbot.getState()) === "CONNECTED"; // getValue(`wbotStatus-${tenantId}`);
   // logger.info(
   //   "wbot:checkMessages:status",
    //  wbot.id,
    //  tenantId,
     // isConnectStatus
   // );

    if (isConnectStatus) {
   //   logger.info("wbot:connected:checkMessages", wbot, tenantId);
      Queue.add("SendMessages", { sessionId: wbot.id, tenantId });
    }
  } catch (error) {
    if (isBrokenWbotSessionError(error)) {
      await recoverBrokenWbotSession(wbot, tenantId, String(error));
      return;
    }
    logger.error(`ERROR: checkMessages Tenant: ${tenantId}::`, error);
  }
};

export const initWbot = async (whatsapp: Whatsapp): Promise<Session> => {
  const pending = initializingSessions.get(whatsapp.id);
  if (pending) {
    logger.info(`initWbot: session ${whatsapp.id} already initializing, waiting...`);
    return pending;
  }

  const existing = sessions.find(s => s.id === whatsapp.id);
  if (existing) {
    try {
      const state = String(await existing.getState()).toUpperCase();
      if (state === "CONNECTED") {
        logger.info(`initWbot: session ${whatsapp.id} already CONNECTED in memory`);
        return existing;
      }
    } catch {
      /* ignore */
    }
    removeWbot(whatsapp.id);
  }

  logger.info(
    `initWbot: webVersion=${DEFAULT_WEB_VERSION} session=${whatsapp.name} (id=${whatsapp.id})`
  );

  const initPromise = new Promise<Session>((resolve, reject) => {
    let readyFired = false;
    let settled = false;
    let authLogged = false;
    let readyFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let connectPollTimer: ReturnType<typeof setInterval> | null = null;
    let syncReached100 = false;
    let syncTriggered = false;

    const stopConnectPoll = (): void => {
      if (connectPollTimer) {
        clearInterval(connectPollTimer);
        connectPollTimer = null;
      }
    };

    try {
      const io = getIO();
      const sessionName = whatsapp.name;
      const { tenantId } = whatsapp;

      const phoneDigits = String(whatsapp.number || "").replace(/\D/g, "");
      const usePairingCode =
        process.env.USE_PAIRING_CODE === "true" && phoneDigits.length >= 10;

      const clientOptions: Record<string, unknown> = {
        authStrategy: new LocalAuth({ clientId: `wbot-${whatsapp.id}` }),
        takeoverOnConflict: false,
        webVersion: DEFAULT_WEB_VERSION,
        webVersionCache: {
          type: "remote",
          remotePath: WEB_VERSION_REMOTE_PATH
        },
        puppeteer: {
          executablePath:
            process.env.CHROME_BIN || "/usr/bin/google-chrome",
          args
        },
        qrMaxRetries: 0
      };

      if (usePairingCode) {
        logger.info(
          `initWbot: pairing code mode for ${sessionName} (${phoneDigits})`
        );
        clientOptions.pairWithPhoneNumber = {
          phoneNumber: phoneDigits,
          showNotification: true,
          intervalMs: 120000
        };
      }

      const wbot = new Client(clientOptions) as Session;

      wbot.id = whatsapp.id;

      const failInit = async (reason: string, error?: unknown): Promise<void> => {
        if (settled) return;
        settled = true;
        stopConnectPoll();
        if (readyFallbackTimer) {
          clearTimeout(readyFallbackTimer);
          readyFallbackTimer = null;
        }

        logger.error(`Session: ${sessionName} init failed (${reason})`, error);

        try {
          removeWbot(whatsapp.id);
          if (String(reason).includes("LOGOUT")) {
            await apagarPastaSessao(whatsapp.id);
          }
          const fresh = await Whatsapp.findByPk(whatsapp.id);
          if (fresh && fresh.status !== "CONNECTED") {
            await fresh.update({
              status: "OPENING",
              ...(String(reason).includes("LOGOUT") ? { qrcode: null } : {})
            });
            io.emit(`${tenantId}:whatsappSession`, {
              action: "update",
              session: fresh
            });
          }
        } catch (cleanupError) {
          logger.error(cleanupError);
        }

        reject(error || new Error(reason));
      };

      const attemptCompleteReady = async (source: string): Promise<void> => {
        if (readyFired || settled) return;
        try {
          const state = String(await wbot.getState()).toUpperCase();
          if (state !== "CONNECTED") return;
          if (syncReached100 || authLogged) {
            await triggerAppStateSync(source);
          }
        } catch (err) {
          logger.warn(`Session: ${sessionName} attemptCompleteReady (${source}): ${err}`);
        }
      };

      const forceReadyFallback = async (source: string): Promise<void> => {
        if (readyFired || settled) return;
        try {
          const state = String(await wbot.getState()).toUpperCase();
          if (state !== "CONNECTED") return;

          logger.warn(`Session: ${sessionName} forceReadyFallback (${source})`);

          const { LoadUtils } = require("whatsapp-web.js/src/util/Injected/Utils");
          await wbot.pupPage?.evaluate(LoadUtils);

          let wwebReady = false;
          const deadline = Date.now() + 30000;
          while (Date.now() < deadline && !wwebReady) {
            wwebReady = Boolean(
              await wbot.pupPage?.evaluate(
                () =>
                  typeof (window as unknown as { WWebJS?: unknown }).WWebJS !==
                  "undefined"
              )
            );
            if (!wwebReady) {
              await new Promise<void>(r => {
                setTimeout(r, 500);
              });
            }
          }

          if (!wbot.info) {
            const ClientInfo = require("whatsapp-web.js/src/structures/ClientInfo");
            const serialized = await wbot.pupPage?.evaluate(() => {
              const w = window as unknown as { require: (m: string) => any };
              return {
                ...w.require("WAWebConnModel").Conn.serialize(),
                wid:
                  w.require("WAWebUserPrefsMeUser").getMaybeMePnUser() ||
                  w.require("WAWebUserPrefsMeUser").getMaybeMeLidUser()
              };
            });
            if (serialized) {
              (wbot as Client & { info?: unknown }).info = new ClientInfo(
                wbot,
                serialized
              );
            }
          }

          const client = wbot as Client & {
            attachEventListeners?: () => Promise<void>;
          };
          if (typeof client.attachEventListeners === "function") {
            await client.attachEventListeners();
          }

          if (!authLogged) {
            authLogged = true;
            logger.info(`Session: ${sessionName} AUTHENTICATED (fallback)`);
          }

          await completeReady(`fallback-${source}`);
        } catch (err) {
          logger.error(`Session: ${sessionName} forceReadyFallback (${source}): ${err}`);
        }
      };

      const triggerAppStateSync = async (source: string): Promise<void> => {
        if (readyFired || settled) return;
        try {
          const state = String(await wbot.getState()).toUpperCase();
          if (state !== "CONNECTED") return;

          const hasHandler = await wbot.pupPage?.evaluate(() => {
            return (
              typeof (
                window as unknown as {
                  onAppStateHasSyncedEvent?: () => Promise<unknown>;
                }
              ).onAppStateHasSyncedEvent === "function"
            );
          });

          if (!hasHandler) {
            logger.warn(`Session: ${sessionName} sync handler ausente (${source})`);
            return;
          }

          if (syncTriggered) return;
          syncTriggered = true;

          logger.info(
            `Session: ${sessionName} disparando onAppStateHasSyncedEvent (${source})`
          );

          if (!wbot.pupPage) {
            syncTriggered = false;
            return;
          }

          await wbot.pupPage.evaluate(() => {
            return (
              window as unknown as {
                onAppStateHasSyncedEvent: () => Promise<unknown>;
              }
            ).onAppStateHasSyncedEvent();
          });

          setTimeout(() => {
            if (!readyFired && !settled) {
              syncTriggered = false;
              forceReadyFallback(`${source}+timeout`).catch(err =>
                logger.error(`Session: ${sessionName} sync timeout: ${err}`)
              );
            }
          }, 45000);
        } catch (err) {
          syncTriggered = false;
          logger.error(`Session: ${sessionName} triggerAppStateSync (${source}): ${err}`);
          await forceReadyFallback(source);
        }
      };

      const tryCompleteReady = (delayMs: number, source: string): void => {
        setTimeout(() => {
          attemptCompleteReady(source).catch(err =>
            logger.warn(`Session: ${sessionName} tryCompleteReady (${source}): ${err}`)
          );
        }, delayMs);
      };

      const startConnectPoll = (): void => {
        if (connectPollTimer) return;
        connectPollTimer = setInterval(() => {
          attemptCompleteReady("poll").catch(err =>
            logger.warn(`Session: ${sessionName} connect poll: ${err}`)
          );
        }, 3000);
      };

      const completeReady = async (source: string): Promise<void> => {
        if (readyFired) return;
        readyFired = true;
        stopConnectPoll();
        if (readyFallbackTimer) {
          clearTimeout(readyFallbackTimer);
          readyFallbackTimer = null;
        }

        logger.info(`Session: ${sessionName}-READY (${source})`);

        try {
          const info: any = wbot?.info;
          let version = "unknown";
          try {
            version = await wbot.getWWebVersion();
            console.log(`WWeb v${version}`);
          } catch (versionError) {
            logger.warn(
              `getWWebVersion failed for ${sessionName}: ${versionError}`
            );
          }

          const wbotBrowser = await wbot.pupBrowser?.version();
          let phoneNumber = wbot?.info?.wid?.user;
          if (!phoneNumber && wbot.pupPage) {
            try {
              phoneNumber = await wbot.pupPage.evaluate(() => {
                const w = window as unknown as { require: (m: string) => any };
                const wid =
                  w.require("WAWebUserPrefsMeUser").getMaybeMePnUser() ||
                  w.require("WAWebUserPrefsMeUser").getMaybeMeLidUser();
                return wid?.user || null;
              });
            } catch {
              /* ignore */
            }
          }

          await whatsapp.update({
            status: "CONNECTED",
            qrcode: "",
            retries: 0,
            number: phoneNumber || whatsapp.number,
            phone: {
              ...(info || {}),
              wbotBrowser
            }
          });

          const updated = await Whatsapp.findByPk(whatsapp.id);
          io.emit(`${tenantId}:whatsappSession`, {
            action: "update",
            session: updated || whatsapp
          });

          io.emit(`${tenantId}:whatsappSession`, {
            action: "readySession",
            session: updated || whatsapp
          });

          const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
          if (sessionIndex === -1) {
            sessions.push(wbot);
          } else {
            sessions[sessionIndex] = wbot;
          }

          wbot.sendPresenceAvailable();
          await ensureWbotPatches(wbot);
          await ensureWwebEventBridge(wbot);
          ensureWbotHandlers(wbot, whatsapp);
          SyncUnreadMessagesWbot(wbot, tenantId);
          if (!wbot.checkMessages) {
            wbot.checkMessages = setInterval(
              checkMessages,
              +(process.env.CHECK_INTERVAL || 5000),
              wbot,
              tenantId
            );
          }

          if (!settled) {
            settled = true;
            resolve(wbot);
          }
        } catch (error) {
          logger.error(`Error in ready event: ${error}`);
          if (!settled) {
            settled = true;
            reject(error);
          }
        }
      };

      wbot.on("qr", async qr => {
        if (readyFired || usePairingCode) return;

        const fresh = await Whatsapp.findByPk(whatsapp.id);
        if (fresh?.status === "CONNECTED") return;

        logger.info(
          `Session QR CODE: ${sessionName}-ID: ${whatsapp.id}-${fresh?.status || whatsapp.status}`
        );

        await Whatsapp.update(
          { qrcode: qr, status: "qrcode", retries: 0 },
          { where: { id: whatsapp.id } }
        );

        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          sessions.push(wbot);
        }

        const updated = await Whatsapp.findByPk(whatsapp.id);
        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: updated || whatsapp
        });

        startConnectPoll();
      });

      wbot.on("code", async (code: string) => {
        if (readyFired) return;

        logger.info(`Session: ${sessionName} PAIRING CODE gerado`);

        await Whatsapp.update(
          { qrcode: code, status: "qrcode", retries: 0 },
          { where: { id: whatsapp.id } }
        );

        const updated = await Whatsapp.findByPk(whatsapp.id);
        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: updated || whatsapp
        });

        startConnectPoll();
      });

      wbot.on("change_state", state => {
        logger.info(`Session: ${sessionName} change_state: ${state}`);
        if (state === "CONNECTED") {
          tryCompleteReady(2000, `state-${state}`);
          tryCompleteReady(8000, `state-${state}+8s`);
        }
      });

      wbot.on("loading_screen", (percent: number) => {
        logger.info(`Session: ${sessionName} syncing ${percent}%`);
        if (percent >= 100) {
          syncReached100 = true;
          triggerAppStateSync(`sync-${percent}`).catch(err =>
            logger.error(`Session: ${sessionName} sync trigger: ${err}`)
          );
          tryCompleteReady(5000, `sync-${percent}+5s`);
        }
      });

      wbot.on("authenticated", async () => {
        if (!authLogged) {
          authLogged = true;
          logger.info(`Session: ${sessionName} AUTHENTICATED`);
        }

        tryCompleteReady(2000, "auth+2s");
        tryCompleteReady(5000, "auth+5s");
        tryCompleteReady(15000, "auth+15s");

        if (readyFallbackTimer) {
          clearTimeout(readyFallbackTimer);
        }
        readyFallbackTimer = setTimeout(async () => {
          if (readyFired || settled) return;
          try {
            const state = String(await wbot.getState()).toUpperCase();
            if (state !== "CONNECTED") {
              logger.warn(
                `Session: ${sessionName} not READY after ${READY_FALLBACK_MS}ms (state=${state})`
              );
              return;
            }
            logger.warn(
              `Session: ${sessionName} AUTHENTICATED but READY missing — forcing connect`
            );
            await attemptCompleteReady("fallback");
          } catch (fallbackError) {
            logger.error(
              `Session: ${sessionName} ready fallback failed: ${fallbackError}`
            );
          }
        }, READY_FALLBACK_MS);
      });

      wbot.on("auth_failure", async msg => {
        if (settled) return;
        settled = true;
        logger.error(
          `Session: ${sessionName}-AUTHENTICATION FAILURE :: ${msg}`
        );
        if (whatsapp.retries > 1) {
          await whatsapp.update({
            retries: 0,
            session: ""
          });
        }

        const retry = whatsapp.retries;
        await whatsapp.update({
          status: "DISCONNECTED",
          retries: retry + 1
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
        removeWbot(whatsapp.id);
        reject(new Error("Error starting whatsapp session."));
      });

      wbot.on("ready", async () => {
        await completeReady("event");
      });

      wbot.on("disconnected", async reason => {
        if (readyFired) return;
        await failInit(`disconnected during init: ${reason}`);
      });

      wbot.initialize().catch(err => failInit("initialize failed", err));
    } catch (err) {
      logger.error(`initWbot error | Error: ${err}`);
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });

  initializingSessions.set(whatsapp.id, initPromise);
  try {
    return await initPromise;
  } finally {
    initializingSessions.delete(whatsapp.id);
  }
};

export const isWbotInitializing = (whatsappId: number): boolean =>
  initializingSessions.has(whatsappId);

export const clearWbotInitialization = (whatsappId: number): void => {
  initializingSessions.delete(whatsappId);
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  return sessions[sessionIndex];
};
