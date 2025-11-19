import { logger } from "../../../utils/logger";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import VerifyContactWuzapi from "./VerifyContactWuzapi";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessageWuzapi from "./VerifyMessageWuzapi";
import VerifyMediaMessageWuzapi from "./VerifyMediaMessageWuzapi";
import verifyBusinessHours from "./VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";
import Setting from "../../../models/Setting";
import Queue from "../../../libs/Queue";

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

const HandleWuzapiMessage = async (
  wuzapiMsg: WuzapiMessage | WuzapiMessage[],
  instanceId: string
): Promise<void> => {
  try {
    // WUZAPI pode enviar array de mensagens ou mensagem única
    const messages = Array.isArray(wuzapiMsg) ? wuzapiMsg : [wuzapiMsg];

    for (const msg of messages) {
      await processMessage(msg, instanceId);
    }
  } catch (error) {
    logger.error(`HandleWuzapiMessage error: ${error}`);
  }
};

const processMessage = async (
  wuzapiMsg: WuzapiMessage,
  instanceId: string
): Promise<void> => {
  try {
    // Extrair ID do WhatsApp da instância
    const whatsappId = parseInt(instanceId.replace("wbot-", ""));
    const whatsapp = await ShowWhatsAppService({ id: whatsappId });

    if (!whatsapp) {
      logger.error(`WhatsApp instance not found: ${whatsappId}`);
      return;
    }

    const { tenantId } = whatsapp;
    const remoteJid = wuzapiMsg.key.remoteJid;
    const fromMe = wuzapiMsg.key.fromMe;

    // Ignorar status broadcasts
    if (remoteJid === "status@broadcast" || remoteJid.includes("status@broadcast")) {
      return;
    }

    // Extrair número do contato
    const number = remoteJid.split("@")[0];
    const isGroup = remoteJid.includes("@g.us");

    // Ignorar grupos se configurado
    const Settingdb = await Setting.findOne({
      where: { key: "ignoreGroupMsg", tenantId }
    });

    if (Settingdb?.value === "enabled" && isGroup) {
      return;
    }

    // Adaptar mensagem para formato interno
    const adaptedMsg = adaptWuzapiMessage(wuzapiMsg);

    // Verificar/Criar contato
    const contact = await VerifyContactWuzapi(
      number,
      wuzapiMsg.pushName || number,
      tenantId,
      isGroup
    );

    // Verificar/Criar ticket
    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId: whatsapp.id,
      unreadMessages: fromMe ? 0 : 1,
      tenantId,
      msg: adaptedMsg,
      channel: "whatsapp"
    });

    if (ticket?.isCampaignMessage || ticket?.isFarewellMessage) {
      return;
    }

    // Processar mensagem
    const hasMedia = !!(
      wuzapiMsg.message?.imageMessage ||
      wuzapiMsg.message?.videoMessage ||
      wuzapiMsg.message?.audioMessage ||
      wuzapiMsg.message?.documentMessage ||
      wuzapiMsg.message?.stickerMessage
    );

    if (hasMedia) {
      await VerifyMediaMessageWuzapi(wuzapiMsg, ticket, contact);
    } else {
      await VerifyMessageWuzapi(wuzapiMsg, ticket, contact);
    }

    // Verificar horário comercial e chat flow
    const isBusinessHours = await verifyBusinessHours(adaptedMsg, ticket);
    if (isBusinessHours) {
      await VerifyStepsChatFlowTicket(adaptedMsg, ticket);
    }

    // Webhook externo se configurado
    const apiConfig: any = ticket.apiConfig || {};
    if (
      !fromMe &&
      !ticket.isGroup &&
      !ticket.answered &&
      apiConfig?.externalKey &&
      apiConfig?.urlMessageStatus
    ) {
      const payload = {
        timestamp: Date.now(),
        msg: adaptedMsg,
        messageId: wuzapiMsg.key.id,
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
  } catch (error) {
    logger.error(`processMessage error: ${error}`);
  }
};

// Adaptar mensagem WUZAPI para formato interno (compatível com WWebJS)
const adaptWuzapiMessage = (wuzapiMsg: WuzapiMessage): any => {
  const message = wuzapiMsg.message;
  let body = "";
  let mediaType = "chat";

  // Extrair texto
  if (message?.conversation) {
    body = message.conversation;
  } else if (message?.extendedTextMessage?.text) {
    body = message.extendedTextMessage.text;
  } else if (message?.imageMessage?.caption) {
    body = message.imageMessage.caption;
    mediaType = "image";
  } else if (message?.videoMessage?.caption) {
    body = message.videoMessage.caption;
    mediaType = "video";
  } else if (message?.audioMessage) {
    mediaType = "audio";
    body = wuzapiMsg.key.fromMe ? "🎵 Áudio" : "";
  } else if (message?.documentMessage) {
    mediaType = "document";
    body = message.documentMessage.caption || (wuzapiMsg.key.fromMe ? "📄 Documento" : "");
  } else if (message?.stickerMessage) {
    mediaType = "sticker";
    body = wuzapiMsg.key.fromMe ? "🎨 Sticker" : "";
  } else if (message?.locationMessage) {
    mediaType = "location";
    body = "📍 Localização";
  } else if (message?.buttonsResponseMessage) {
    body = message.buttonsResponseMessage.selectedButtonId || "";
  } else if (message?.listResponseMessage) {
    body = message.listResponseMessage.singleSelectReply?.selectedRowId || "";
  } else if (wuzapiMsg.key.fromMe) {
    // Mensagens fromMe sem corpo (mídia sem legenda)
    body = "📷 Mídia";
  }

  return {
    id: {
      id: wuzapiMsg.key.id,
      _serialized: `${wuzapiMsg.key.fromMe}_${wuzapiMsg.key.remoteJid}_${wuzapiMsg.key.id}`
    },
    from: wuzapiMsg.key.remoteJid,
    fromMe: wuzapiMsg.key.fromMe,
    body: body,
    timestamp: wuzapiMsg.messageTimestamp,
    hasMedia: !!(
      message?.imageMessage ||
      message?.videoMessage ||
      message?.audioMessage ||
      message?.documentMessage ||
      message?.stickerMessage
    ),
    type: mediaType,
    message: message
  };
};

export default HandleWuzapiMessage;

