import { Contact as WbotContact } from "whatsapp-web.js";
import Contact from "../../../models/Contact";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";
import persistContactProfilePic from "../../../helpers/persistContactProfilePic";
import ResolveContactProfilePicUrl from "../ResolveContactProfilePicUrl";

const VerifyContact = async (
  msgContact: WbotContact,
  tenantId: string | number,
  whatsappId?: number
): Promise<Contact> => {
  const serializedJid = msgContact.id?._serialized;
  const number = msgContact.id?.user;

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

  const existing = await Contact.findOne({ where: { number, tenantId } });

  const contactData = {
    name:
      msgContact.name ||
      msgContact.pushname ||
      msgContact.shortName ||
      msgContact.id.user,
    number,
    profilePicUrl,
    tenantId,
    pushname: msgContact.pushname,
    isUser: msgContact.isUser,
    isWAContact: msgContact.isWAContact,
    isGroup: msgContact.isGroup,
    whatsappId,
    saveVCardToSelf: !existing
  };

  const contact = await CreateOrUpdateContactService(contactData);

  return contact;
};

export default VerifyContact;
