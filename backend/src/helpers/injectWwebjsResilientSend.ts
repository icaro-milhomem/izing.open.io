import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

/**
 * msgPromise do WA Web pode rejeitar com "r: r" mesmo com a mensagem criada localmente (ack=0).
 * Recupera o Msg do store quando existir, em vez de falhar o envio no painel.
 */
export const injectWwebjsResilientSend = async (
  wbot: WbotClient
): Promise<void> => {
  if (!wbot.pupPage) return;

  const applied = await wbot.pupPage.evaluate(() => {
    const w = window as any;
    if (w.__izingResilientSend) return false;

    const action = w.require("WAWebSendMsgChatAction");
    const origAdd = action.addAndSendMsgToChat;
    if (!origAdd || origAdd.__izingResilientPatched) {
      w.__izingResilientSend = true;
      return false;
    }

    action.addAndSendMsgToChat = function addAndSendMsgToChatResilient(
      chat: { id?: { _serialized?: string } },
      message: { id?: { _serialized?: string } }
    ) {
      const [msgPromise, sendMsgResultPromise] = origAdd.call(
        action,
        chat,
        message
      );

      const resilientMsgPromise = Promise.resolve(msgPromise).catch(
        (error: unknown) => {
          const msgKey = message?.id?._serialized;
          if (msgKey) {
            const stored = w.require("WAWebCollections").Msg.get(msgKey);
            if (stored) {
              return stored;
            }
          }
          throw error;
        }
      );

      return [resilientMsgPromise, sendMsgResultPromise];
    };

    action.addAndSendMsgToChat.__izingResilientPatched = true;
    w.__izingResilientSend = true;
    return true;
  });

  if (applied) {
    logger.info("injectWwebjsResilientSend: addAndSendMsgToChat patched");
  }
};

export default injectWwebjsResilientSend;
