import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import socketEmit from "../../helpers/socketEmit";
import CreateLogTicketService from "./CreateLogTicketService";
import Message from "../../models/Message";
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";
import { StartWhatsAppSession } from "../WbotServices/StartWhatsAppSession";
import { logger } from "../../utils/logger";

// Função para verificar se a mensagem contém código PIX
const containsPixCode = (message: string): boolean => {
  // Verifica se a mensagem contém o padrão de código PIX
  const pixPattern = /00020101021226850014br\.gov\.bcb\.pix2563qrcodepix\.bb\.com\.br\/pix\/v2\/[a-zA-Z0-9-]+/;
  return pixPattern.test(message);
};

interface TicketData {
  status?: string;
  userId?: number;
  tenantId: number | string;
  queueId?: number | null;
  autoReplyId?: number | string | null;
  stepAutoReplyId?: number | string | null;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  isTransference?: string | boolean | null;
  userIdRequest: number | string;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  isTransference,
  userIdRequest
}: Request): Promise<Response> => {
  const { status, userId, tenantId, queueId } = ticketData;

  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId },
    include: [
      {
        model: Contact,
        as: "contact",
        include: [
          "extraInfo",
          "tags",
          {
            association: "wallets",
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"]
      },
      {
        association: "whatsapp",
        attributes: ["id", "name", "wavoip", "logo"]
      }
    ]
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // Verifica se está tentando abrir um ticket com código PIX
  if (status === "open" && ticket.lastMessage && typeof ticket.lastMessage === "string" && containsPixCode(ticket.lastMessage)) {
    // Remove qualquer linha que seja apenas "Nome:" (assinatura) antes do código PIX
    const messageWithoutSignature = ticket.lastMessage
      .split('\n')
      .filter(line => !/^[^:]+:\s*$/i.test(line.trim()))
      .join('\n');
    await ticket.update({ lastMessage: messageWithoutSignature.trim() });
  }

  try {
    await SetTicketMessagesAsRead(ticket);
  } catch (error) {
    logger.warn(`Error setting ticket messages as read for ticket ${ticketId}: ${error}`);
    // Não bloquear a atualização do ticket se houver erro ao marcar mensagens como lidas
  }

  // Variavel para notificar usuário de novo contato como pendente
  const toPending =
    ticket.status !== "pending" && ticketData.status === "pending";

  const oldStatus = ticket.status;
  const oldUserId = ticket.user?.id;

  if (oldStatus === "closed") {
    await CheckContactOpenTickets(ticket.contact.id);
  }

  // verificar se o front envia close e substituir por closed
  const statusData = status === "close" ? "closed" : status;

  const data: any = {
    status: statusData,
    queueId,
    userId
  };

  // se atendimento for encerrado, informar data da finalização
  if (statusData === "closed") {
    data.closedAt = new Date().getTime();
  }

  // se iniciar atendimento, retirar o bot e informar a data
  if (oldStatus === "pending" && statusData === "open") {
    data.autoReplyId = null;
    data.stepAutoReplyId = null;
    data.startedAttendanceAt = new Date().getTime();

    // Adicionar mensagem personalizada do atendente e enviar para o cliente
    const user = await User.findByPk(userId);
    if (user && ticket.whatsappId) {
      // Verificar se o WhatsApp está realmente conectado antes de enviar
      const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
      if (whatsapp && whatsapp.status === "CONNECTED") {
        try {
          const mensagens = [
            `Olá! Sou ${user.name}, da equipe EcoNect Fibra. Vou te ajudar a resolver sua solicitação agora mesmo.`,
            `Olá! Aqui é ${user.name} da EcoNect Fibra. Vamos iniciar seu atendimento!`,
            `Oi! Tudo bem? 😊 Sou ${user.name}, da EcoNect Fibra, e vou te acompanhar no atendimento. Como posso te ajudar?`,
            `Olá! 👋 Me chamo ${user.name} e faço parte da equipe da EcoNect Fibra. Estou aqui para te ajudar no que for preciso!`
          ];
          const mensagemAleatoria = mensagens[Math.floor(Math.random() * mensagens.length)];

          await SendMessageSystemProxy({
            ticket,
            messageData: {
              body: mensagemAleatoria,
              ticketId,
              contactId: ticket.contactId,
              fromMe: true,
              read: true,
              mediaType: "chat",
              userId,
              tenantId: ticket.tenantId
            },
            media: null,
            userId
          });
        } catch (error: any) {
          // Se a sessão do WhatsApp não estiver inicializada, tentar reinicializar
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes("ERR_WAPP_NOT_INITIALIZED") || errorMessage.includes("ERR_SENDING_WAPP_MSG")) {
            logger.warn(`WhatsApp session not initialized for ticket ${ticketId}. Checking session status before restart.`);
            try {
              const whatsapp = await Whatsapp.findOne({
                where: { id: ticket.whatsappId, tenantId: ticket.tenantId }
              });
              if (whatsapp) {
                // Se o status é CONNECTED mas a sessão não está em memória, forçar reinício
                // Não tentar reiniciar apenas se já estiver em processo de conexão (OPENING, qrcode)
                if (whatsapp.status === "OPENING" || whatsapp.status === "qrcode") {
                  logger.info(`WhatsApp session ${whatsapp.id} is already ${whatsapp.status}. Skipping restart.`);
                } else {
                  logger.info(`WhatsApp session ${whatsapp.id} is ${whatsapp.status} but not in memory. Attempting to restart.`);
                  await StartWhatsAppSession(whatsapp);
                  logger.info(`WhatsApp session restart initiated for ticket ${ticketId}`);
                }
              }
            } catch (restartError) {
              logger.error(`Failed to restart WhatsApp session for ticket ${ticketId}: ${restartError}`);
            }
          } else {
            logger.error(`Error sending welcome message for ticket ${ticketId}: ${error}`);
          }
          // Não bloquear o início do atendimento se o envio da mensagem falhar
        }
      }
    }
  }

  await ticket.update(data);

  // logar o inicio do atendimento
  if (oldStatus === "pending" && statusData === "open") {
    await CreateLogTicketService({
      userId: userIdRequest,
      ticketId,
      type: "open"
    });
  }

  // logar ticket resolvido
  if (statusData === "closed") {
    await CreateLogTicketService({
      userId: userIdRequest,
      ticketId,
      type: "closed"
    });
  }

  // logar ticket retornado à pendente
  if (oldStatus === "open" && statusData === "pending") {
    await CreateLogTicketService({
      userId: userIdRequest,
      ticketId,
      type: "pending"
    });
  }

  if (isTransference) {
    // tranferiu o atendimento
    await CreateLogTicketService({
      userId: userIdRequest,
      ticketId,
      type: "transfered"
    });
    // recebeu o atendimento tansferido
    if (userId) {
      await CreateLogTicketService({
        userId,
        ticketId,
        type: "receivedTransfer"
      });
    }
  }

  await ticket.reload();

  if (isTransference) {
    await ticket.setDataValue("isTransference", true);
  }

  if (toPending) {
    socketEmit({
      tenantId,
      type: "notification:new",
      payload: ticket
    });
  }

  socketEmit({
    tenantId,
    type: "ticket:update",
    payload: ticket
  });

  return { ticket, oldStatus, oldUserId };
};

export default UpdateTicketService;
