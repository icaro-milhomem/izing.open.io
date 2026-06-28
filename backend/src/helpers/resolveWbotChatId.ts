import { Client as WbotClient } from "whatsapp-web.js";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import prepareWbotLidMapping, {
  isLikelyLid,
  isLikelyPhone
} from "./prepareWbotLidMapping";

const digitsOnly = (value: string): string =>
  String(value || "").replace(/\D/g, "");

const buildLidChatId = (lid: string): string =>
  lid.includes("@") ? lid : `${lid}@lid`;

const isValidLid = (
  lid: string | null | undefined,
  phone: string | null
): boolean => {
  if (!lid) return false;
  if (!phone) return isLikelyLid(lid);
  return digitsOnly(lid) !== digitsOnly(phone);
};

/** JID falso: telefone com sufixo @lid (ex.: 55999...@lid). */
const isInvalidPhoneLidJid = (jid?: string | null): boolean => {
  if (!jid?.endsWith("@lid")) return false;
  return isLikelyPhone(jid.split("@")[0]);
};

const pushCandidate = (candidates: string[], jid?: string | null): void => {
  if (!jid || isInvalidPhoneLidJid(jid)) return;
  if (!candidates.includes(jid)) {
    candidates.push(jid);
  }
};

const persistResolvedContact = async (
  contact: Contact,
  mapping: { lid?: string; pn?: string },
  lidJid?: string | null
): Promise<void> => {
  const updates: Record<string, string> = {};
  const ext = contact as Contact & { remoteJid?: string; lid?: string };

  if (mapping.pn) {
    const phone = digitsOnly(mapping.pn);
    if (isLikelyPhone(phone) && phone !== contact.number) {
      const conflict = await Contact.findOne({
        where: { number: phone, tenantId: contact.tenantId }
      });
      if (!conflict || conflict.id === contact.id) {
        updates.number = phone;
      }
    }
  }

  if (mapping.lid) {
    const lidUser = mapping.lid.split("@")[0];
    if (isLikelyLid(lidUser)) {
      updates.lid = lidUser;
      updates.remoteJid = mapping.lid;
    }
  } else if (lidJid) {
    updates.remoteJid = lidJid;
    const lidUser = lidJid.split("@")[0];
    if (isLikelyLid(lidUser)) {
      updates.lid = lidUser;
    }
  }

  if (!updates.lid && ext.lid && isLikelyLid(ext.lid)) {
    updates.lid = digitsOnly(ext.lid);
  }

  if (Object.keys(updates).length === 0) return;

  try {
    await contact.update(updates);
  } catch (error) {
    logger.warn(`persistResolvedContact contact=${contact.id}: ${error}`);
  }
};

export const resolveContactPhone = (contact: Contact): string | null => {
  if (contact.number && isLikelyPhone(contact.number)) {
    return digitsOnly(contact.number);
  }

  const ext = contact as Contact & { lid?: string };
  if (ext.lid && isLikelyPhone(ext.lid)) {
    return digitsOnly(ext.lid);
  }

  return null;
};

export const resolveContactLidJid = (contact: Contact): string | null => {
  const ext = contact as Contact & { remoteJid?: string; lid?: string };

  if (ext.remoteJid?.endsWith("@lid") && !isInvalidPhoneLidJid(ext.remoteJid)) {
    return ext.remoteJid;
  }

  if (ext.lid && isLikelyLid(ext.lid)) {
    return buildLidChatId(ext.lid);
  }

  if (contact.number && isLikelyLid(contact.number)) {
    return buildLidChatId(contact.number);
  }

  return null;
};

const addMappingCandidates = (
  candidates: string[],
  mapping: { lid?: string; pn?: string }
): string | null => {
  let resolvedPhone: string | null = null;
  if (mapping.pn) {
    resolvedPhone = digitsOnly(mapping.pn);
    if (isLikelyPhone(resolvedPhone)) {
      pushCandidate(candidates, `${resolvedPhone}@c.us`);
    }
    pushCandidate(candidates, mapping.pn);
  }
  pushCandidate(candidates, mapping.lid);
  return resolvedPhone;
};

export const buildOutboundChatCandidates = async (
  wbot: WbotClient,
  ticket: Ticket,
  contact: Contact
): Promise<string[]> => {
  if (ticket.isGroup) {
    return [`${contact.number}@g.us`];
  }

  const phone = resolveContactPhone(contact);
  const lidJid = resolveContactLidJid(contact);
  const ext = contact as Contact & { remoteJid?: string; lid?: string };
  const candidates: string[] = [];

  if (phone) {
    const mapping = await prepareWbotLidMapping(wbot, phone);
    addMappingCandidates(candidates, mapping);
    pushCandidate(candidates, `${phone}@c.us`);
    await persistResolvedContact(contact, mapping, lidJid);

    try {
      const numberId = await wbot.getNumberId(phone);
      const serialized = numberId?._serialized;
      if (serialized) {
        const user = serialized.split("@")[0];
        if (
          serialized.endsWith("@lid")
            ? isLikelyLid(user)
            : isLikelyPhone(user)
        ) {
          pushCandidate(candidates, serialized);
        }
      }
    } catch (error) {
      logger.warn(`buildOutboundChatCandidates getNumberId ${phone}: ${error}`);
    }
  } else if (lidJid) {
    const mapping = await prepareWbotLidMapping(wbot, lidJid);
    const resolvedPhone = addMappingCandidates(candidates, mapping);
    pushCandidate(candidates, lidJid);
    await persistResolvedContact(contact, mapping, lidJid);

    if (resolvedPhone) {
      try {
        const numberId = await wbot.getNumberId(resolvedPhone);
        pushCandidate(candidates, numberId?._serialized);
      } catch (error) {
        logger.warn(
          `buildOutboundChatCandidates getNumberId ${resolvedPhone}: ${error}`
        );
      }
    }
  }

  if (ext.remoteJid) {
    pushCandidate(candidates, ext.remoteJid);
  }
  if (isValidLid(ext.lid, phone)) {
    pushCandidate(candidates, buildLidChatId(ext.lid!));
  }

  return candidates.length
    ? candidates
    : phone
      ? [`${phone}@c.us`]
      : lidJid
        ? [lidJid]
        : [`${digitsOnly(contact.number)}@c.us`];
};

export const resolveWbotChatId = async (
  wbot: WbotClient,
  ticket: Ticket,
  contact: Contact
): Promise<string> => {
  const candidates = await buildOutboundChatCandidates(wbot, ticket, contact);
  return candidates[0];
};

export default resolveWbotChatId;
