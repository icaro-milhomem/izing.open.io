import { logger } from "../../../utils/logger";
import VerifyMessage from "./VerifyMessage";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import Contact from "../../../models/Contact";

interface WuzapiMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  pushName?: string;
}

const VerifyMessageWuzapi = async (
  wuzapiMsg: WuzapiMessage,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  try {
    // Adaptar mensagem para formato esperado por VerifyMessage
    const adaptedMsg = {
      id: {
        id: wuzapiMsg.key.id,
        _serialized: `${wuzapiMsg.key.fromMe}_${wuzapiMsg.key.remoteJid}_${wuzapiMsg.key.id}`
      },
      from: wuzapiMsg.key.remoteJid,
      fromMe: wuzapiMsg.key.fromMe,
      body: extractBodyFromWuzapiMessage(wuzapiMsg),
      timestamp: wuzapiMsg.messageTimestamp,
      hasMedia: false,
      type: "chat",
      message: wuzapiMsg.message
    };

    // Usar o VerifyMessage existente que já tem toda a lógica
    await VerifyMessage(adaptedMsg as any, ticket, contact);
  } catch (error) {
    logger.error(`VerifyMessageWuzapi error: ${error}`);
  }
};

const extractBodyFromWuzapiMessage = (wuzapiMsg: WuzapiMessage): string => {
  const message = wuzapiMsg.message;
  let body = "";

  if (message?.conversation) {
    body = message.conversation;
  } else if (message?.extendedTextMessage?.text) {
    body = message.extendedTextMessage.text;
  } else if (message?.buttonsResponseMessage) {
    body = message.buttonsResponseMessage.selectedButtonId || "";
  } else if (message?.listResponseMessage) {
    body = message.listResponseMessage.singleSelectReply?.selectedRowId || "";
  } else if (wuzapiMsg.key.fromMe) {
    // Mensagens fromMe sem corpo
    body = "📷 Mídia";
  }

  return body;
};

export default VerifyMessageWuzapi;

