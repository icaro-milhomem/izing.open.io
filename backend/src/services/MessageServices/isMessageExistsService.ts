import { Message as WbotMessage } from "whatsapp-web.js";
import Message from "../../models/Message";

const isMessageExistsService = async (msg: WbotMessage): Promise<boolean> => {
  const messageId = msg?.id?.id;
  if (!messageId) return false;

  const message = await Message.findOne({
    where: { messageId }
  });

  return Boolean(message);
};

export default isMessageExistsService;
