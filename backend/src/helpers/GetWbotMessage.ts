import { Message as WbotMessage } from "whatsapp-web.js";
import Ticket from "../models/Ticket";
import GetTicketWbot from "./GetTicketWbot";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

export const GetWbotMessage = async (
  ticket: Ticket,
  messageId: string,
  totalMessages = 100
): Promise<WbotMessage | undefined> => {
  const wbot = await GetTicketWbot(ticket);

  const wbotChat = await wbot.getChatById(
    `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`
  );

  let limit = 20;

  const fetchWbotMessagesGradually = async (): Promise<WbotMessage | undefined> => {
    const chatMessages = await wbotChat.fetchMessages({ limit });

    // Tentar encontrar por id.id (formato padrão)
    let msgFound = chatMessages.find(msg => msg.id.id === messageId);
    
    // Se não encontrar, tentar por id._serialized
    if (!msgFound) {
      msgFound = chatMessages.find(msg => msg.id._serialized === messageId);
    }
    
    // Se ainda não encontrar, tentar por id (objeto completo)
    if (!msgFound) {
      msgFound = chatMessages.find(msg => {
        const msgId = msg.id?.id || msg.id?._serialized || JSON.stringify(msg.id);
        return msgId === messageId || msgId?.includes(messageId);
      });
    }

    if (!msgFound && limit < totalMessages) {
      limit += 20;
      return await fetchWbotMessagesGradually();
    }

    return msgFound;
  };

  try {
    // Tentar buscar imediatamente
    let msgFound = await fetchWbotMessagesGradually();

    // Se não encontrar e a mensagem é muito recente, tentar novamente com delays progressivos
    if (!msgFound) {
      const message = await import("../models/Message").then(m => m.default);
      const dbMessage = await message.findOne({ where: { messageId } });
      if (dbMessage) {
        const messageAgeInSeconds = (new Date().getTime() - new Date(dbMessage.createdAt).getTime()) / 1000;
        
        // Para mensagens muito recentes (< 3 minutos), tentar múltiplas vezes com delays
        if (messageAgeInSeconds < 180) {
          const maxRetries = messageAgeInSeconds < 60 ? 5 : 3; // Mais tentativas para mensagens < 1 minuto
          const delayMs = messageAgeInSeconds < 60 ? 2000 : 1500; // 2s para < 1 min, 1.5s para < 3 min
          
          logger.info(`Mensagem muito recente (${messageAgeInSeconds.toFixed(1)}s), tentando ${maxRetries} vezes com delay de ${delayMs}ms...`);
          
          for (let attempt = 1; attempt <= maxRetries && !msgFound; attempt++) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            logger.info(`Tentativa ${attempt}/${maxRetries} de buscar mensagem ${messageId}...`);
            msgFound = await fetchWbotMessagesGradually();
            
            if (msgFound) {
              logger.info(`Mensagem encontrada na tentativa ${attempt}!`);
              break;
            }
          }
        }
      }
    }

    if (!msgFound) {
      // Log detalhado para debug
      const chatMessages = await wbotChat.fetchMessages({ limit: 50 });
      const sampleIds = chatMessages.slice(0, 5).map(msg => ({
        id: msg.id?.id,
        serialized: msg.id?._serialized,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp
      }));
      
      logger.error(
        `Cannot found message ${messageId} within ${totalMessages} last messages. Ticket: ${ticket.id}, Contact: ${ticket.contact?.number}. Sample message IDs: ${JSON.stringify(sampleIds)}`
      );
      return undefined;
    }

    return msgFound;
  } catch (err) {
    logger.error(`Erro ao buscar mensagem no WhatsApp: ${err}`);
    throw new AppError("ERR_FETCH_WAPP_MSG");
  }
};

export default GetWbotMessage;
