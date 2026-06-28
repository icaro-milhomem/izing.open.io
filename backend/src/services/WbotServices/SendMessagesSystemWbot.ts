/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { join } from "path";
import {
  Message as WbotMessage,
  Buttons,
  Client,
  List,
  MessageMedia
} from "whatsapp-web.js";
import { Op } from "sequelize";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import { sleepRandomTime } from "../../utils/sleepRandomTime";
import Contact from "../../models/Contact";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import sendWbotChatMessage from "../../helpers/sendWbotChatMessage";
// import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";

interface Session extends Client {
  id: number;
}

const SendMessagesSystemWbot = async (
  wbot: Session,
  tenantId: number | string
): Promise<void> => {
  const where = {
    fromMe: true,
    messageId: { [Op.is]: null },
    status: "pending",
    [Op.or]: [
      {
        scheduleDate: {
          [Op.lte]: new Date()
        }
      },
      {
        scheduleDate: { [Op.is]: null }
      }
    ]
  };
  const messages = await Message.findAll({
    where,
    include: [
      {
        model: Contact,
        as: "contact",
        where: {
          tenantId,
          number: {
            [Op.notIn]: ["", "null"]
          }
        }
      },
      {
        model: Ticket,
        as: "ticket",
        where: {
          tenantId,
          [Op.or]: {
            status: { [Op.ne]: "closed" },
            isFarewellMessage: true
          },
          channel: "whatsapp",
          whatsappId: wbot.id
        },
        include: ["contact"]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ],
    order: [["createdAt", "ASC"]]
  });
  let sendedMessage;

  // logger.info(
  //   `SystemWbot SendMessages | Count: ${messages.length} | Tenant: ${tenantId} `
  // );

  for (const message of messages) {
    let quotedMsgSerializedId: string | undefined;
    const { ticket } = message;

    if (message.quotedMsg) {
      const inCache: WbotMessage | undefined = await GetWbotMessage(
        ticket,
        message.quotedMsg.messageId,
        200
      );
      if (inCache) {
        quotedMsgSerializedId = inCache?.id?._serialized || undefined;
      } else {
        quotedMsgSerializedId = undefined;
      }
      // eslint-disable-next-line no-underscore-dangle
    }

    try {
      if (message.mediaType !== "chat" && message.mediaName) {
        const customPath = join(__dirname, "..", "..", "..", "public");
        const mediaPath = join(customPath, message.mediaName);
        const newMedia = MessageMedia.fromFilePath(mediaPath);
        const result = await sendWbotChatMessage(
          wbot,
          ticket,
          ticket.contact,
          newMedia,
          {
            quotedMessageId: quotedMsgSerializedId,
            linkPreview: false,
            sendAudioAsVoice: true
          }
        );
        sendedMessage = result.message;
        logger.info("sendMessage media");
      } else {
        const result = await sendWbotChatMessage(
          wbot,
          ticket,
          ticket.contact,
          message.body,
          {
            quotedMessageId: quotedMsgSerializedId,
            linkPreview: false
          }
        );
        sendedMessage = result.message;
        logger.info("sendMessage text");
      }

      // enviar old_id para substituir no front a mensagem corretamente
      const messageToUpdate = {
        ...message,
        ...sendedMessage,
        id: message.id,
        messageId: sendedMessage.id.id,
        status: "sended"
      };

      await Message.update(
        { ...messageToUpdate },
        { where: { id: message.id } }
      );

      logger.info("Message Update");
      // await SetTicketMessagesAsRead(ticket);

      // delay para processamento da mensagem
      await sleepRandomTime({
        minMilliseconds: Number(process.env.MIN_SLEEP_INTERVAL || 500),
        maxMilliseconds: Number(process.env.MAX_SLEEP_INTERVAL || 2000)
      });

      logger.info("sendMessage", sendedMessage.id.id);
    } catch (error) {
      const idMessage = message.id;
      const ticketId = message.ticket.id;

      if (error.code === "ENOENT") {
        await Message.destroy({
          where: { id: message.id }
        });
      }

      logger.error(
        `Error message is (tenant: ${tenantId} | Ticket: ${ticketId})`
      );
      logger.error(`Error send message (id: ${idMessage})::${error}`);
    }
  }
};

export default SendMessagesSystemWbot;
