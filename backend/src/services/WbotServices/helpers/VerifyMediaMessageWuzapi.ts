import { logger } from "../../../utils/logger";
import VerifyMediaMessage from "./VerifyMediaMessage";
import Ticket from "../../../models/Ticket";
import Contact from "../../../models/Contact";
import getWuzapiClient from "../../../libs/wuzapi";

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

const VerifyMediaMessageWuzapi = async (
  wuzapiMsg: WuzapiMessage,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  try {
    const message = wuzapiMsg.message;
    let mediaType = "chat";
    let mediaUrl = "";
    let mediaName = "";

    // Extrair informações da mídia
    if (message?.imageMessage) {
      mediaType = "image";
      mediaUrl = message.imageMessage.url || "";
      mediaName = message.imageMessage.mimetype || "image/jpeg";
    } else if (message?.videoMessage) {
      mediaType = "video";
      mediaUrl = message.videoMessage.url || "";
      mediaName = message.videoMessage.mimetype || "video/mp4";
    } else if (message?.audioMessage) {
      mediaType = "audio";
      mediaUrl = message.audioMessage.url || "";
      mediaName = message.audioMessage.mimetype || "audio/ogg";
    } else if (message?.documentMessage) {
      mediaType = "document";
      mediaUrl = message.documentMessage.url || "";
      mediaName = message.documentMessage.fileName || "document";
    } else if (message?.stickerMessage) {
      mediaType = "sticker";
      mediaUrl = message.stickerMessage.url || "";
      mediaName = "sticker.webp";
    }

    // Baixar mídia se necessário
    if (mediaUrl && !wuzapiMsg.key.fromMe) {
      // WUZAPI pode fornecer URL direta ou precisar baixar
      // Por enquanto, adaptar para usar o VerifyMediaMessage existente
      // que já tem lógica de download
    }

    // Adaptar mensagem para formato esperado por VerifyMediaMessage
    const adaptedMsg = {
      id: {
        id: wuzapiMsg.key.id,
        _serialized: `${wuzapiMsg.key.fromMe}_${wuzapiMsg.key.remoteJid}_${wuzapiMsg.key.id}`
      },
      from: wuzapiMsg.key.remoteJid,
      fromMe: wuzapiMsg.key.fromMe,
      body: extractCaptionFromWuzapiMessage(wuzapiMsg),
      timestamp: wuzapiMsg.messageTimestamp,
      hasMedia: true,
      type: mediaType,
      message: message
    };

    // Usar o VerifyMediaMessage existente
    // Nota: Pode precisar adaptar para baixar mídia do WUZAPI
    await VerifyMediaMessage(adaptedMsg as any, ticket, contact);
  } catch (error) {
    logger.error(`VerifyMediaMessageWuzapi error: ${error}`);
  }
};

const extractCaptionFromWuzapiMessage = (wuzapiMsg: WuzapiMessage): string => {
  const message = wuzapiMsg.message;
  let caption = "";

  if (message?.imageMessage?.caption) {
    caption = message.imageMessage.caption;
  } else if (message?.videoMessage?.caption) {
    caption = message.videoMessage.caption;
  } else if (message?.documentMessage?.caption) {
    caption = message.documentMessage.caption;
  } else if (wuzapiMsg.key.fromMe) {
    caption = "📷 Mídia";
  }

  return caption;
};

export default VerifyMediaMessageWuzapi;

