import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

/** Garante que o chat existe na tabela interna do WA Web (evita "Lid is missing in chat table"). */
export const ensureWbotChatPrepared = async (
  wbot: WbotClient,
  chatId: string
): Promise<void> => {
  if (!wbot.pupPage || !chatId) return;

  try {
    await wbot.pupPage.evaluate((jid: string) => {
      const w = window as any;
      const chatWid = w.require("WAWebWidFactory").createWid(jid);
      const findChat = w.require("WAWebFindChatAction");
      const chain = findChat?.findOrCreateLatestChat
        ? findChat.findOrCreateLatestChat(chatWid)
        : Promise.resolve();

      return chain.then(() => {
        if (jid.endsWith("@c.us") && w.WWebJS?.enforceLidAndPnRetrieval) {
          return w.WWebJS.enforceLidAndPnRetrieval(jid);
        }
        return undefined;
      });
    }, chatId);
  } catch (error) {
    logger.warn(`ensureWbotChatPrepared failed chatId=${chatId}: ${error}`);
  }
};

export default ensureWbotChatPrepared;
