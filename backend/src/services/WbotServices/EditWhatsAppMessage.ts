import AppError from "../../errors/AppError";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";

const EditWhatsAppMessage = async (
  id: string,
  messageId: string,
  tenantId: string | number,
  newBody: string
): Promise<void> => {

  logger.info(`[EditWhatsAppMessage] Iniciando. id: ${id}, messageId: ${messageId}, tenantId: ${tenantId}, newBody: ${newBody}`);
  
  if (!id || id === "null") {
    logger.error(`[EditWhatsAppMessage] ID não fornecido: ${id}`);
    throw new AppError("ERR_NO_MESSAGE_ID_PROVIDED");
  }
  
  logger.info(`[EditWhatsAppMessage] Buscando mensagem no banco: messageId=${messageId}, tenantId=${tenantId}`);
  const message = await Message.findOne({
    where: { messageId: messageId },
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"],
        where: { tenantId }
      }
    ]
  });

  if (!message) {
    logger.error(`[EditWhatsAppMessage] Mensagem não encontrada no banco: messageId=${messageId}, tenantId=${tenantId}`);
    throw new AppError("No message found with this ID.");
  }
  
  logger.info(`[EditWhatsAppMessage] Mensagem encontrada. fromMe: ${message.fromMe}, edited: ${message.edited}, createdAt: ${message.createdAt}`);
  
  // Verificar se já se passaram mais de 15 minutos desde que a mensagem foi enviada
  // WhatsApp permite editar mensagens até 15 minutos após o envio
  const messageAgeInMinutes = (new Date().getTime() - new Date(message.createdAt).getTime()) / 60000;
  logger.info(`[EditWhatsAppMessage] Idade da mensagem: ${messageAgeInMinutes.toFixed(2)} minutos`);
  
  if (messageAgeInMinutes > 15) {
    logger.warn(`[EditWhatsAppMessage] Mensagem muito antiga: ${messageAgeInMinutes.toFixed(2)} minutos (limite: 15 minutos)`);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

  // Verificar se a mensagem já foi editada anteriormente
  // edited guarda o texto original quando a mensagem foi editada
  // Se edited existe e não é vazio, significa que a mensagem já foi editada
  const editedValue = message.edited;
  const isEdited = editedValue && 
                   typeof editedValue === 'string' && 
                   editedValue.trim() !== '' && 
                   editedValue.toLowerCase() !== 'false';
  
  if (isEdited) {
    logger.warn(`[EditWhatsAppMessage] Mensagem já foi editada anteriormente. Não é possível editar novamente.`);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
  
  logger.info(`[EditWhatsAppMessage] Mensagem pode ser editada. edited atual: ${editedValue || 'null'} (tipo: ${typeof editedValue})`);

  const { ticket } = message;
  logger.info(`[EditWhatsAppMessage] Ticket encontrado. ticketId: ${ticket.id}, whatsappId: ${ticket.whatsappId}`);

  // Verificar se o WhatsApp está conectado
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
  if (!whatsapp) {
    logger.error(`[EditWhatsAppMessage] WhatsApp não encontrado: whatsappId=${ticket.whatsappId}`);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
  
  logger.info(`[EditWhatsAppMessage] WhatsApp encontrado. status: ${whatsapp.status}`);
  
  if (whatsapp.status !== "CONNECTED") {
    logger.warn(`[EditWhatsAppMessage] WhatsApp não está conectado. status: ${whatsapp.status}`);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

  // Tentar buscar a mensagem com limite maior (200 mensagens)
  logger.info(`Iniciando busca da mensagem ${messageId} para edição. Ticket: ${ticket.id}, Contact: ${ticket.contact?.number}, Idade: ${messageAgeInMinutes.toFixed(2)} minutos`);
  const messageToEdit = await GetWbotMessage(ticket, messageId, 200);

  if (!messageToEdit) {
    logger.error(`Mensagem não encontrada no WhatsApp: ${messageId}. Ticket: ${ticket.id}, Contact: ${ticket.contact?.number}. Tentou buscar nas últimas 200 mensagens. Idade da mensagem: ${messageAgeInMinutes.toFixed(2)} minutos`);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
  
  logger.info(`Mensagem encontrada no WhatsApp: ${messageId}. Prosseguindo com a edição...`);

  try {
    // Verificar se a mensagem pode ser editada (deve ser uma mensagem enviada por nós)
    if (!message.fromMe) {
      logger.error(`Tentativa de editar mensagem que não foi enviada por nós: ${messageId}`);
      throw new AppError("ERR_EDITING_WAPP_MSG");
    }

    await messageToEdit.edit(newBody);
    
    // Salvar o texto original antes de atualizar
    const originalBody = message.body;
    
    // Atualizar o body com o novo texto e salvar o original em edited
    await message.update({ 
      body: newBody,
      edited: originalBody 
    });
    
    logger.info(`Mensagem editada com sucesso: ${messageId}`);
  } catch (err: any) {
    logger.error(`Erro ao editar mensagem no WhatsApp: ${err?.message || err}`);
    // Se o erro for específico do WhatsApp, logar mais detalhes
    if (err?.message?.includes("edit") || err?.message?.includes("timeout")) {
      logger.error(`Detalhes do erro de edição: ${JSON.stringify(err)}`);
    }
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

  const io = getIO();
  io.to(`tenant:${tenantId}:${message.ticket.id}`).emit(
    `tenant:${tenantId}:appMessage`,
    {
      action: "update",
      message,
      contact: ticket.contact
    }
  );
};

export default EditWhatsAppMessage;
