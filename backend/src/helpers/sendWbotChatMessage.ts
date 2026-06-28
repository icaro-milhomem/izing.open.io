import {
  Client as WbotClient,
  Message as WbotMessage,
  MessageMedia
} from "whatsapp-web.js";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import ensureWbotChatPrepared from "./ensureWbotChatPrepared";
import ensureWbotPatches from "./ensureWbotPatches";
import { buildOutboundChatCandidates } from "./resolveWbotChatId";
import withWbotSendLock from "./wbotSendLock";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Message: MessageClass } = require("whatsapp-web.js");

type SendOptions = Record<string, unknown>;

const SEND_TIMEOUT_MS = Number(process.env.WBOT_SEND_TIMEOUT_MS || 25000);
const ACK_WAIT_MS = Number(process.env.WBOT_ACK_WAIT_MS || 12000);

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`TIMEOUT ${label} after ${ms}ms`)),
          ms
        );
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const extractBodyPreview = (
  content: string | MessageMedia | Parameters<WbotClient["sendMessage"]>[1]
): string => {
  if (typeof content === "string") {
    return content.replace(/\*/g, "").trim();
  }
  if (content instanceof MessageMedia) {
    return String(content.filename || "").trim();
  }
  return "";
};

const buildInternalSendOptions = (options: SendOptions): SendOptions => ({
  linkPreview: options.linkPreview === false ? undefined : true,
  quotedMessageId: options.quotedMessageId,
  sendSeen: false,
  waitUntilMsgSent: true,
  ignoreQuoteErrors: true,
  sendAudioAsVoice: options.sendAudioAsVoice,
  sendVideoAsGif: options.sendVideoAsGif,
  sendMediaAsSticker: options.sendMediaAsSticker,
  sendMediaAsDocument: options.sendMediaAsDocument,
  caption: options.caption
});

const pollMessageAck = async (
  wbot: WbotClient,
  serializedId: string
): Promise<number> => {
  if (!wbot.pupPage || !serializedId) return 0;

  const deadline = Date.now() + ACK_WAIT_MS;
  while (Date.now() < deadline) {
    const ack = await wbot.pupPage.evaluate((msgId: string) => {
      const msg = (window as any).require("WAWebCollections").Msg.get(msgId);
      return typeof msg?.ack === "number" ? msg.ack : 0;
    }, serializedId);

    if (ack >= 1) return ack;
    await sleep(400);
  }

  return wbot.pupPage.evaluate((msgId: string) => {
    const msg = (window as any).require("WAWebCollections").Msg.get(msgId);
    return typeof msg?.ack === "number" ? msg.ack : 0;
  }, serializedId);
};

const sendViaEvaluate = async (
  wbot: WbotClient,
  chatId: string,
  content: string,
  options: SendOptions
): Promise<WbotMessage | null> => {
  if (!wbot.pupPage) return null;

  const internalOptions = buildInternalSendOptions(options);

  const model = await withTimeout(
    wbot.pupPage.evaluate(
      (jid: string, body: string, opts: SendOptions) => {
        const w = window as any;
        return w.WWebJS.getChat(jid, { getAsModel: false })
          .then((chat: unknown) => {
            if (!chat) {
              throw new Error("CHAT_NOT_FOUND");
            }
            return w.WWebJS.sendMessage(chat, body, opts);
          })
          .then((msg: { id?: { _serialized?: string } } | null) => {
            if (!msg?.id?._serialized) return null;
            return w.WWebJS.getMessageModel(msg);
          });
      },
      chatId,
      content,
      internalOptions
    ),
    SEND_TIMEOUT_MS,
    `evaluate:${chatId}`
  );

  if (!model?.id?.id) return null;

  const message = new MessageClass(wbot, model) as WbotMessage;
  const ack = await pollMessageAck(
    wbot,
    model.id._serialized || `${model.id.id}`
  );
  (message as WbotMessage & { ack?: number }).ack = ack;

  if (ack >= 1) {
    logger.info(
      `sendViaEvaluate OK chatId=${chatId} messageId=${model.id.id} ack=${ack}`
    );
    return message;
  }

  logger.warn(
    `sendViaEvaluate ack=0 chatId=${chatId} messageId=${model.id.id}`
  );
  return null;
};

const attemptSend = async (
  wbot: WbotClient,
  chatId: string,
  content: string | Parameters<WbotClient["sendMessage"]>[1],
  options: SendOptions
): Promise<WbotMessage | null> => {
  const sendOptions = buildInternalSendOptions(options);

  if (typeof content === "string") {
    const evaluated = await sendViaEvaluate(wbot, chatId, content, options);
    if (evaluated) return evaluated;
  }

  try {
    const chat = await withTimeout(
      wbot.getChatById(chatId),
      SEND_TIMEOUT_MS,
      `getChatById:${chatId}`
    );
    const message = (await withTimeout(
      chat.sendMessage(content as any, sendOptions as any),
      SEND_TIMEOUT_MS,
      `chat.sendMessage:${chatId}`
    )) as WbotMessage;

    if (message?.id?._serialized) {
      const ack = await pollMessageAck(wbot, message.id._serialized);
      (message as WbotMessage & { ack?: number }).ack = ack;
      if (ack >= 1) {
        logger.info(
          `chat.sendMessage OK chatId=${chatId} messageId=${message.id.id} ack=${ack}`
        );
        return message;
      }
      logger.warn(
        `chat.sendMessage ack=0 chatId=${chatId} messageId=${message.id.id}`
      );
    }
  } catch (chatError) {
    logger.warn(`chat.sendMessage failed chatId=${chatId}: ${chatError}`);
  }

  try {
    const message = (await withTimeout(
      wbot.sendMessage(chatId, content as any, sendOptions),
      SEND_TIMEOUT_MS,
      `wbot.sendMessage:${chatId}`
    )) as WbotMessage;

    if (message?.id?._serialized) {
      const ack = await pollMessageAck(wbot, message.id._serialized);
      (message as WbotMessage & { ack?: number }).ack = ack;
      if (ack >= 1) {
        logger.info(
          `wbot.sendMessage OK chatId=${chatId} messageId=${message.id.id} ack=${ack}`
        );
        return message;
      }
      logger.warn(
        `wbot.sendMessage ack=0 chatId=${chatId} messageId=${message.id.id}`
      );
    }
  } catch (wbotError) {
    throw wbotError;
  }

  return null;
};

const sendWbotChatMessageInternal = async (
  wbot: WbotClient,
  ticket: Ticket,
  contact: Contact,
  content: string | Parameters<WbotClient["sendMessage"]>[1],
  options: SendOptions = {}
): Promise<{ message: WbotMessage; chatId: string }> => {
  await ensureWbotPatches(wbot as any);

  const candidates = await buildOutboundChatCandidates(wbot, ticket, contact);
  logger.info(
    `sendWbotChatMessage candidates contact=${contact.number || ""} -> [${candidates.join(", ")}]`
  );

  let lastError: unknown;

  for (let index = 0; index < candidates.length; index += 1) {
    const chatId = candidates[index];
    await ensureWbotChatPrepared(wbot, chatId);

    try {
      const message = await attemptSend(wbot, chatId, content, options);
      if (message?.id?.id) {
        return { message, chatId };
      }
    } catch (error) {
      lastError = error;
      logger.warn(
        `sendWbotChatMessage failed chatId=${chatId} attempt=${index + 1}/${candidates.length}: ${error}`
      );
      if (index < candidates.length - 1) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("sendWbotChatMessage: delivery failed (ack=0)");
};

export const sendWbotChatMessage = async (
  wbot: WbotClient,
  ticket: Ticket,
  contact: Contact,
  content: string | Parameters<WbotClient["sendMessage"]>[1],
  options: SendOptions = {}
): Promise<{ message: WbotMessage; chatId: string }> => {
  const whatsappId = ticket.whatsappId;
  if (!whatsappId) {
    return sendWbotChatMessageInternal(wbot, ticket, contact, content, options);
  }

  return withWbotSendLock(whatsappId, () =>
    sendWbotChatMessageInternal(wbot, ticket, contact, content, options)
  );
};

export default sendWbotChatMessage;
