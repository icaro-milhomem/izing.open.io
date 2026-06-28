import { Client } from "whatsapp-web.js";
import Queue from "../../libs/Queue";
import { logger } from "../../utils/logger";
import isMessageExistsService from "../MessageServices/isMessageExistsService";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyContact from "./helpers/VerifyContact";
import VerifyMediaMessage from "./helpers/VerifyMediaMessage";
import VerifyMessage from "./helpers/VerifyMessage";

interface Session extends Client {
  id?: number;
  syncUnreadDone?: boolean;
}

const SyncUnreadMessagesWbot = async (
  wbot: Session,
  tenantId: number | string
): Promise<void> => {
  if (wbot.syncUnreadDone) {
    return;
  }
  wbot.syncUnreadDone = true;

  try {
    const chats = await wbot.getChats();
    for (const chat of chats) {
      if (chat.unreadCount <= 0 || chat.isGroup) {
        continue;
      }

      const unreadMessages = await chat.fetchMessages({
        limit: chat.unreadCount
      });
      logger.info(`SyncUnread CHAT: ${chat.id?._serialized || chat}`);

      const chatContact = await chat.getContact();
      const contact = await VerifyContact(
        chatContact,
        tenantId,
        wbot.id,
        chat.id?._serialized
      );
      const ticket = await FindOrCreateTicketService({
        contact,
        whatsappId: wbot.id!,
        unreadMessages: chat.unreadCount,
        tenantId,
        isSync: true,
        channel: "whatsapp"
      });

      if (ticket?.isCampaignMessage || ticket?.isFarewellMessage) {
        continue;
      }

      for (let idx = 0; idx < unreadMessages.length; idx += 1) {
        const msg = unreadMessages[idx];
        if (await isMessageExistsService(msg)) {
          continue;
        }

        logger.info(`SyncUnread MSG: ${msg.id?.id}`);
        if (msg.hasMedia) {
          await VerifyMediaMessage(msg, ticket, contact);
        } else {
          await VerifyMessage(msg, ticket, contact);
        }

        if (idx === unreadMessages.length - 1) {
          await VerifyStepsChatFlowTicket(msg, ticket);

          const apiConfig: any = ticket.apiConfig || {};
          if (
            !msg.fromMe &&
            !ticket.isGroup &&
            !ticket.answered &&
            apiConfig?.externalKey &&
            apiConfig?.urlMessageStatus
          ) {
            const payload = {
              timestamp: Date.now(),
              msg,
              messageId: msg.id.id,
              ticketId: ticket.id,
              externalKey: apiConfig?.externalKey,
              authToken: apiConfig?.authToken,
              type: "hookMessage"
            };
            Queue.add("WebHooksAPI", {
              url: apiConfig.urlMessageStatus,
              type: payload.type,
              payload
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error("Erro ao syncronizar mensagens", error);
  }
};

export default SyncUnreadMessagesWbot;
