import { join } from "path";
import { MessageMedia } from "whatsapp-web.js";
import Message from "../../models/Message";
import { logger } from "../../utils/logger";
import { getWbot } from "../../libs/wbot";
import sendWbotChatMessage from "../../helpers/sendWbotChatMessage";

const SendMessage = async (message: Message): Promise<void> => {
  logger.info(`SendMessage: ${message.id}`);
  const wbot = getWbot(message.ticket.whatsappId);
  let sendedMessage;

  let quotedMsgSerializedId: string | undefined;
  const { ticket } = message;

  if (message.quotedMsg) {
    const typeGroup = ticket?.isGroup ? "g" : "c";
    const contactNumber = message.contact.number;
    quotedMsgSerializedId = `${message.quotedMsg.fromMe}_${contactNumber}@${typeGroup}.us_${message.quotedMsg.messageId}`;
  }

  if (message.mediaType !== "chat" && message.mediaName) {
    const customPath = join(__dirname, "..", "..", "..", "public");
    const mediaPath = join(customPath, message.mediaName);
    const newMedia = MessageMedia.fromFilePath(mediaPath);
    const result = await sendWbotChatMessage(
      wbot,
      ticket,
      message.contact,
      newMedia,
      {
        quotedMessageId: quotedMsgSerializedId,
        linkPreview: false,
        sendAudioAsVoice: true
      }
    );
    sendedMessage = result.message;
  } else {
    const result = await sendWbotChatMessage(
      wbot,
      ticket,
      message.contact,
      message.body,
      {
        quotedMessageId: quotedMsgSerializedId,
        linkPreview: false
      }
    );
    sendedMessage = result.message;
  }

  // enviar old_id para substituir no front a mensagem corretamente
  const messageToUpdate = {
    ...message,
    ...sendedMessage,
    id: message.id,
    messageId: sendedMessage.id.id,
    status: "sended"
  };

  await Message.update({ ...messageToUpdate }, { where: { id: message.id } });

  logger.info("rabbit::sendedMessage", sendedMessage.id.id);
};

export default SendMessage;
