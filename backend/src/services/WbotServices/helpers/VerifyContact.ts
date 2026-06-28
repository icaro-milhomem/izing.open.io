import { Contact as WbotContact } from "whatsapp-web.js";
import Contact from "../../../models/Contact";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";
import persistContactProfilePic from "../../../helpers/persistContactProfilePic";
import ResolveContactProfilePicUrl from "../ResolveContactProfilePicUrl";
import { isLikelyLid, isLikelyPhone } from "../../../helpers/prepareWbotLidMapping";
import { getWbot } from "../../../libs/wbot";

const digitsOnly = (value: string): string =>
  String(value || "").replace(/\D/g, "");

const VerifyContact = async (
  msgContact: WbotContact,
  tenantId: string | number,
  whatsappId?: number,
  chatJid?: string
): Promise<Contact> => {
  const serializedJid =
    chatJid || msgContact.id?._serialized || "";
  const isLidJid =
    serializedJid.endsWith("@lid") || msgContact.id?.server === "lid";
  const rawUser = msgContact.id?.user || "";
  const phoneFromWweb = digitsOnly(String((msgContact as any).number || ""));

  let number = "";
  let lid: string | undefined;
  let remoteJid: string | undefined;

  if (isLidJid) {
    lid = rawUser;
    remoteJid = serializedJid.endsWith("@lid")
      ? serializedJid
      : `${rawUser}@lid`;
    if (isLikelyPhone(phoneFromWweb)) {
      number = phoneFromWweb;
    }
  } else if (isLikelyPhone(rawUser)) {
    number = digitsOnly(rawUser);
  } else if (isLikelyPhone(phoneFromWweb)) {
    number = phoneFromWweb;
  }

  const existing = number
    ? await Contact.findOne({ where: { number, tenantId } })
    : null;

  if (!number && existing?.number && isLikelyPhone(existing.number)) {
    number = digitsOnly(existing.number);
  }

  if (!number && whatsappId && isLidJid && lid) {
    try {
      const wbot = getWbot(whatsappId);
      if (wbot.pupPage) {
        const mapped = await wbot.pupPage.evaluate((lidJid: string) => {
          const w = window as any;
          if (!w.WWebJS?.enforceLidAndPnRetrieval) return null;
          return w.WWebJS.enforceLidAndPnRetrieval(lidJid).then(
            ({ phone }: { phone?: { user?: string; _serialized?: string } }) =>
              phone?.user || phone?._serialized?.split("@")[0] || null
          );
        }, remoteJid || `${lid}@lid`);
        if (mapped && isLikelyPhone(mapped)) {
          number = digitsOnly(mapped);
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!number && isLikelyLid(rawUser)) {
    const byLid = await Contact.findOne({
      where: { lid: rawUser, tenantId }
    });
    if (byLid?.number && isLikelyPhone(byLid.number)) {
      number = digitsOnly(byLid.number);
    }
  }

  if (!number && lid) {
    const byRemote = await Contact.findOne({
      where: { remoteJid: remoteJid || `${lid}@lid`, tenantId }
    });
    if (byRemote?.number && isLikelyPhone(byRemote.number)) {
      number = digitsOnly(byRemote.number);
    }
  }

  let profilePicUrl: string | undefined;
  try {
    profilePicUrl = await msgContact.getProfilePicUrl();
    if (profilePicUrl) {
      profilePicUrl = await persistContactProfilePic(
        tenantId,
        number,
        profilePicUrl
      );
    }
  } catch {
    profilePicUrl = undefined;
  }

  if (!profilePicUrl) {
    profilePicUrl = await ResolveContactProfilePicUrl(
      tenantId,
      number,
      serializedJid,
      whatsappId
    );
  }

  const existingForPic = existing || (number
    ? await Contact.findOne({ where: { number, tenantId } })
    : null);

  const contactData = {
    name:
      msgContact.name ||
      msgContact.pushname ||
      msgContact.shortName ||
      msgContact.id.user,
    number,
    lid,
    remoteJid,
    profilePicUrl,
    tenantId,
    pushname: msgContact.pushname,
    isUser: msgContact.isUser,
    isWAContact: msgContact.isWAContact,
    isGroup: msgContact.isGroup,
    whatsappId,
    saveVCardToSelf: !existingForPic
  };

  const contact = await CreateOrUpdateContactService(contactData);

  return contact;
};

export default VerifyContact;
