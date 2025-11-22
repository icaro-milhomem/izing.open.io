import { Client as Session } from "whatsapp-web.js";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  if (!ticket.whatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.tenantId);

    await ticket.$set("whatsapp", defaultWhatsapp);
  }

  try {
    const wbot = getWbot(ticket.whatsappId);
    return wbot;
  } catch (error: any) {
    // Se a sessão não estiver inicializada, tentar reiniciar se o status no banco for CONNECTED
    if (error instanceof AppError && error.message === "ERR_WAPP_NOT_INITIALIZED") {
      logger.warn(`Sessão WhatsApp ${ticket.whatsappId} não encontrada em memória. Verificando status no banco...`);
      
      const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
      if (whatsapp && whatsapp.status === "CONNECTED") {
        logger.info(`Status no banco é CONNECTED mas sessão não está em memória. Tentando reiniciar sessão ${whatsapp.id}...`);
        try {
          await StartWhatsAppSession(whatsapp);
          // Aguardar um pouco para a sessão inicializar
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Tentar novamente obter a sessão
          try {
            const wbot = getWbot(ticket.whatsappId);
            logger.info(`Sessão ${whatsapp.id} reiniciada com sucesso`);
            return wbot;
          } catch (retryError) {
            logger.error(`Sessão ${whatsapp.id} ainda não disponível após reinício`);
            throw new AppError("ERR_WAPP_NOT_INITIALIZED");
          }
        } catch (restartError) {
          logger.error(`Erro ao reiniciar sessão ${whatsapp.id}: ${restartError}`);
          throw new AppError("ERR_WAPP_NOT_INITIALIZED");
        }
      } else {
        logger.warn(`Sessão ${ticket.whatsappId} não está CONNECTED no banco (status: ${whatsapp?.status || 'não encontrado'})`);
        throw error;
      }
    }
    throw error;
  }
};

export default GetTicketWbot;
