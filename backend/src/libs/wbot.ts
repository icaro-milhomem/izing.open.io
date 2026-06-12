/* eslint-disable camelcase */
import { Client, LocalAuth, DefaultOptions } from "whatsapp-web.js";
import path from "path";
import { rm } from "fs/promises";
import { getIO } from "./socket";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import SyncUnreadMessagesWbot from "../services/WbotServices/SyncUnreadMessagesWbot";
import Queue from "./Queue";
import AppError from "../errors/AppError";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
const minimalArgs = require('./minimalArgs');

interface Session extends Client {
  id: number;
  checkMessages: any;
}

const sessions: Session[] = [];
const initializingSessions: Map<number, Promise<Session>> = new Map();

const checking: any = {};

/** Versão default do wwebjs (2.3000.1017054665) retorna 404 no wppconnect — trava após AUTHENTICATED */
const DEFAULT_WEB_VERSION =
  process.env.WWEB_VERSION || "2.3000.1041274891-alpha";
const WEB_VERSION_REMOTE_PATH =
  process.env.WWEB_VERSION_REMOTE_PATH ||
  "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html";
const READY_FALLBACK_MS = Number(process.env.WWEB_READY_FALLBACK_MS || 90000);

export const apagarPastaSessao = async (id: number | string): Promise<void> => {
  const pathRoot = path.resolve(__dirname, "..", "..", ".wwebjs_auth");
  const pathSession = `${pathRoot}/session-wbot-${id}`;
  try {
    await rm(pathSession, { recursive: true, force: true });
  } catch (error) {
    logger.info(`apagarPastaSessao:: ${pathSession}`);
    logger.error(error);
  }
};

export const removeWbot = (whatsappId: number): void => {
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
    const strError = String(error);
    // se a sess�o tiver sido fechada, limpar a checagem de mensagens e bot
    if (strError.indexOf("Session closed.") !== -1) {
      logger.error(
        `BOT Whatsapp desconectado. Tenant: ${tenantId}:: BOT ID: ${wbot.id}`
      );
      clearInterval(wbot.checkMessages);
      removeWbot(wbot.id);
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

    try {
      const io = getIO();
      const sessionName = whatsapp.name;
      const { tenantId } = whatsapp;

      const wbot = new Client({
        authStrategy: new LocalAuth({ clientId: `wbot-${whatsapp.id}` }),
        takeoverOnConflict: true,
        webVersion: DEFAULT_WEB_VERSION,
        webVersionCache: {
          type: "remote",
          remotePath: WEB_VERSION_REMOTE_PATH
        },
        puppeteer: {
          executablePath:
            process.env.CHROME_BIN || "/usr/bin/google-chrome",
          args
        } as Record<string, unknown>,
        qrMaxRetries: 5
      }) as Session;

      wbot.id = whatsapp.id;

      const completeReady = async (source: string): Promise<void> => {
        if (readyFired) return;
        readyFired = true;
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
          await whatsapp.update({
            status: "CONNECTED",
            qrcode: "",
            retries: 0,
            number: wbot?.info?.wid?.user,
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
        if (readyFired) return;

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
      });

      wbot.on("authenticated", async () => {
        if (!authLogged) {
          authLogged = true;
          logger.info(`Session: ${sessionName} AUTHENTICATED`);
        }

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
            await completeReady("fallback");
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

      wbot.initialize();
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

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  return sessions[sessionIndex];
};
