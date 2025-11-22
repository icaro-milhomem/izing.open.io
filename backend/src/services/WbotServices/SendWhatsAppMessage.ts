import { Message as WbotMessage } from "whatsapp-web.js";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import SerializeWbotMsgId from "../../helpers/SerializeWbotMsgId";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import UserMessagesLog from "../../models/UserMessagesLog";
import { logger } from "../../utils/logger";
import getWuzapiClient from "../../libs/wuzapi";
// import { StartWhatsAppSessionVerify } from "./StartWhatsAppSessionVerify";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  userId?: number | string | undefined;
  menuOptions?: {
    buttons?: Array<{ id: string; text: string }>;
    list?: {
      buttonText: string;
      sections: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
    footer?: string;
  };
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  userId,
  menuOptions
}: Request): Promise<WbotMessage | any> => {
  // Verificar se deve usar WUZAPI
  const useWuzapi = process.env.USE_WUZAPI === "true";

  if (useWuzapi) {
    return sendViaWuzapi({ body, ticket, quotedMsg, userId, menuOptions });
  }

  // Código original WWebJS
  let quotedMsgSerializedId: string | undefined;
  if (quotedMsg) {
    await GetWbotMessage(ticket, quotedMsg.id);
    quotedMsgSerializedId = SerializeWbotMsgId(ticket, quotedMsg);
  }

  const wbot = await GetTicketWbot(ticket);

  // Verificar se a sessão está realmente conectada antes de tentar enviar
  try {
    const sessionState = await wbot.getState();
    if (sessionState !== "CONNECTED") {
      logger.warn(`Sessão WhatsApp ${ticket.whatsappId} não está conectada. Estado atual: ${sessionState}`);
      throw new AppError("ERR_WAPP_NOT_INITIALIZED");
    }
  } catch (stateError: any) {
    logger.error(`Erro ao verificar estado da sessão WhatsApp ${ticket.whatsappId}: ${stateError}`);
    // Se não conseguir verificar o estado, assumir que não está conectada
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  try {
    // WWebJS não suporta menus interativos nativos
    // Converter para formato de texto quando menuOptions estiver presente
    let messageBody = body;
    
    if (menuOptions) {
      if (menuOptions.buttons && menuOptions.buttons.length > 0) {
        // Converter botões para formato de texto
        messageBody = `${body}\n\n`;
        if (menuOptions.footer) {
          messageBody += `_${menuOptions.footer}_\n\n`;
        }
        messageBody += `*Opções:*\n`;
        menuOptions.buttons.forEach((button, index) => {
          messageBody += `${index + 1}. ${button.text}\n`;
        });
        messageBody += `\n_Digite o número da opção desejada._`;
        logger.info(`WWebJS: Convertendo botões interativos para texto formatado`);
      } else if (menuOptions.list) {
        // Converter lista para formato de texto
        messageBody = `${body}\n\n`;
        if (menuOptions.footer) {
          messageBody += `_${menuOptions.footer}_\n\n`;
        }
        messageBody += `*${menuOptions.list.buttonText}*\n\n`;
        menuOptions.list.sections.forEach((section, sectionIndex) => {
          if (section.title) {
            messageBody += `*${section.title}*\n`;
          }
          section.rows.forEach((row, rowIndex) => {
            const globalIndex = sectionIndex * 10 + rowIndex + 1;
            messageBody += `${globalIndex}. ${row.title}`;
            if (row.description) {
              messageBody += ` - ${row.description}`;
            }
            messageBody += `\n`;
          });
          messageBody += `\n`;
        });
        messageBody += `_Digite o número da opção desejada._`;
        logger.info(`WWebJS: Convertendo lista interativa para texto formatado`);
      }
    }

    const sendMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`,
      messageBody,
      {
        quotedMessageId: quotedMsgSerializedId,
        linkPreview: false // fix: send a message takes 2 seconds when there's a link on message body
      }
    );

    await ticket.update({
      lastMessage: body,
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
    return sendMessage;
  } catch (err: any) {
    logger.error(`SendWhatsAppMessage | Error: ${err}`);
    
    // Verificar se o erro indica que a sessão está corrompida ou desconectada
    const errorMessage = err?.message || String(err);
    const errorString = errorMessage.toLowerCase();
    
    // Se o erro indicar que a sessão não está inicializada ou está corrompida, tentar reiniciar
    if (
      errorString.includes("cannot read properties of undefined") ||
      errorString.includes("getchat") ||
      errorString.includes("session closed") ||
      errorString.includes("err_wapp_not_initialized")
    ) {
      logger.warn(`Sessão WhatsApp ${ticket.whatsappId} parece estar corrompida. Tentando reiniciar...`);
      try {
        const { StartWhatsAppSessionVerify } = await import("./StartWhatsAppSessionVerify");
        await StartWhatsAppSessionVerify(ticket.whatsappId, errorMessage);
      } catch (restartError) {
        logger.error(`Erro ao tentar reiniciar sessão ${ticket.whatsappId}: ${restartError}`);
      }
    }
    
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

const sendViaWuzapi = async ({
  body,
  ticket,
  quotedMsg,
  userId,
  menuOptions
}: Request): Promise<any> => {
  try {
    const wuzapi = getWuzapiClient();
    const instanceId = `wbot-${ticket.whatsappId}`;
    const number = ticket.contact.number;

    let sendMessage;

    // Enviar lista interativa
    if (menuOptions?.list) {
      sendMessage = await wuzapi.sendList(
        instanceId,
        number,
        body,
        menuOptions.list.buttonText,
        menuOptions.list.sections,
        menuOptions.footer
      );
    }
    // Enviar botões interativos
    else if (menuOptions?.buttons) {
      sendMessage = await wuzapi.sendButtons(
        instanceId,
        number,
        body,
        menuOptions.buttons,
        menuOptions.footer
      );
    }
    // Enviar texto simples
    else {
      sendMessage = await wuzapi.sendText(
        instanceId,
        number,
        body,
        { quotedMessageId: quotedMsg?.messageId }
      );
    }

    // Atualizar ticket
    await ticket.update({
      lastMessage: body,
      lastMessageAt: new Date().getTime()
    });

    // Log de mensagem
    try {
      if (userId) {
        const messageId = sendMessage.key?.id || sendMessage.id || sendMessage.messageId;
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
    logger.error(`SendWhatsAppMessage WUZAPI | Error: ${err}`);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
