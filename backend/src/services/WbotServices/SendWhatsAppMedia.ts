import fs from "fs";
import { MessageMedia, Message as WbotMessage } from "whatsapp-web.js";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import UserMessagesLog from "../../models/UserMessagesLog";
import { logger } from "../../utils/logger";
import getWuzapiClient from "../../libs/wuzapi";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  userId: number | string | undefined;
}

const SendWhatsAppMedia = async ({
  media,
  ticket,
  userId
}: Request): Promise<WbotMessage | any> => {
  // Verificar se deve usar WUZAPI
  const useWuzapi = process.env.USE_WUZAPI === "true";

  if (useWuzapi) {
    return sendMediaViaWuzapi({ media, ticket, userId });
  }

  // Código original WWebJS
  try {
    const wbot = await GetTicketWbot(ticket);

    const newMedia = MessageMedia.fromFilePath(media.path);

    const sendMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`,
      newMedia,
      { sendAudioAsVoice: true }
    );

    await ticket.update({
      lastMessage: media.filename,
      lastMessageAt: new Date().getTime()
    });
    try {
      if (userId) {
        await UserMessagesLog.create({
          messageId: sendMessage.id.id,
          userId,
          ticketId: ticket.id
        });
      }
    } catch (error) {
      logger.error(`Error criar log mensagem ${error}`);
    }
 //   fs.unlinkSync(media.path);

    return sendMessage;
  } catch (err) {
    logger.error(`SendWhatsAppMedia | Error: ${err}`);
    // StartWhatsAppSessionVerify(ticket.whatsappId, err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

const sendMediaViaWuzapi = async ({
  media,
  ticket,
  userId
}: Request): Promise<any> => {
  try {
    const wuzapi = getWuzapiClient();
    const instanceId = `wbot-${ticket.whatsappId}`;
    const number = ticket.contact.number;

    const sendMessage = await wuzapi.sendMedia(
      instanceId,
      number,
      media.path,
      media.filename
    );

    await ticket.update({
      lastMessage: media.filename,
      lastMessageAt: new Date().getTime()
    });

    try {
      if (userId) {
        const messageId = (sendMessage as any).key?.id || (sendMessage as any).id?.id || (sendMessage as any).messageId || (sendMessage as any).id;
        await UserMessagesLog.create({
          messageId: messageId,
          userId,
          ticketId: ticket.id
        });
      }
    } catch (error) {
      logger.error(`Error criar log mensagem ${error}`);
    }

    return sendMessage;
  } catch (err) {
    logger.error(`SendWhatsAppMedia WUZAPI | Error: ${err}`);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
