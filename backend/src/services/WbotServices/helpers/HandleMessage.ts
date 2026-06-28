import {
  Contact as WbotContact,
  Message as WbotMessage,
  Client
} from "whatsapp-web.js";
import Contact from "../../../models/Contact";
import { logger } from "../../../utils/logger";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import IsValidMsg from "./IsValidMsg";
import VerifyContact from "./VerifyContact";
import VerifyMediaMessage from "./VerifyMediaMessage";
import VerifyMessage from "./VerifyMessage";
import verifyBusinessHours from "./VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";
import sendPendingTicketGreeting from "../../../helpers/sendPendingTicketGreeting";
import Queue from "../../../libs/Queue";
import isMessageExistsService from "../../MessageServices/isMessageExistsService";
import Setting from "../../../models/Setting";

interface Session extends Client {
  id: number;
}

const handleMessageById = new Map<string, Promise<void>>();

const processMessage = async (
  msg: WbotMessage,
  wbot: Session
): Promise<void> => {
  if (!IsValidMsg(msg)) {
    return;
  }

  const messageId = msg.id?.id;
  if (!messageId) {
    return;
  }

  if (await isMessageExistsService(msg)) {
    return;
  }

  const whatsapp = await ShowWhatsAppService({ id: wbot.id });
  const { tenantId } = whatsapp;
  const chat = await msg.getChat();

  const Settingdb = await Setting.findOne({
    where: { key: "ignoreGroupMsg", tenantId }
  });

  if (
    Settingdb?.value === "enabled" &&
    (chat.isGroup || msg.from === "status@broadcast")
  ) {
    return;
  }

  let msgContact: WbotContact;
  let groupContact: Contact | undefined;

  if (msg.fromMe) {
    if (
      !msg.hasMedia &&
      msg.type !== "chat" &&
      msg.type !== "vcard" &&
      msg.type !== "location"
    ) {
      return;
    }

    msgContact = await wbot.getContactById(msg.to);
  } else {
    msgContact = await msg.getContact();
  }

  if (chat.isGroup) {
    const msgGroupContact = msg.fromMe
      ? await wbot.getContactById(msg.to)
      : await wbot.getContactById(msg.from);

    groupContact = await VerifyContact(msgGroupContact, tenantId, wbot.id);
  }

  const unreadMessages = msg.fromMe ? 0 : chat.unreadCount;

  const contact = await VerifyContact(
    msgContact,
    tenantId,
    wbot.id,
    msg.fromMe ? msg.to : msg.from
  );
  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: wbot.id!,
    unreadMessages,
    tenantId,
    groupContact,
    msg,
    channel: "whatsapp"
  });

  if (ticket?.isCampaignMessage || ticket?.isFarewellMessage) {
    return;
  }

  if (await isMessageExistsService(msg)) {
    return;
  }

  if (msg.hasMedia) {
    await VerifyMediaMessage(msg, ticket, contact);
  } else {
    await VerifyMessage(msg, ticket, contact);
  }

  if (!msg.fromMe) {
    await sendPendingTicketGreeting(ticket);
  }

  const isBusinessHours = await verifyBusinessHours(msg, ticket);

  if (isBusinessHours) await VerifyStepsChatFlowTicket(msg, ticket);

  const apiConfig: any = ticket.apiConfig || {};
  if (
    !msg.fromMe &&
    !ticket.isGroup &&
    !ticket.answered &&
    apiConfig?.externalKey &&
    apiConfig?.urlMessageStatus
  ) {
    const payload = {
      timestamp: Date.now(),
      msg,
      messageId: msg.id.id,
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
};

const HandleMessage = async (
  msg: WbotMessage,
  wbot: Session
): Promise<void> => {
  const messageId = msg.id?.id;
  if (!messageId) {
    return;
  }

  const pending = handleMessageById.get(messageId);
  if (pending) {
    return pending;
  }

  const task = processMessage(msg, wbot)
    .catch(err => {
      logger.error(err);
      throw err;
    })
    .finally(() => {
      handleMessageById.delete(messageId);
    });

  handleMessageById.set(messageId, task);
  return task;
};

export default HandleMessage;
