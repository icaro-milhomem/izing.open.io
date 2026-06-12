import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import SendContactVCardToSelf from "../WbotServices/SendContactVCardToSelf";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
  tenantId: string | number;
  pushname: string;
  isUser: boolean;
  isWAContact: boolean;
  telegramId?: string | number;
  instagramPK?: string | number;
  messengerId?: string | number;
  origem?: string;
  whatsappId?: number;
  saveVCardToSelf?: boolean;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  tenantId,
  pushname,
  isUser,
  isWAContact,
  email = "",
  telegramId,
  instagramPK,
  messengerId,
  extraInfo = [],
  origem = "whatsapp",
  whatsappId,
  saveVCardToSelf = false
}: Request): Promise<Contact> => {
  const number = isGroup
    ? String(rawNumber)
    : String(rawNumber).replace(/[^0-9]/g, "");

  let contact: Contact | null = null;

  if (origem === "whatsapp") {
    contact = await Contact.findOne({ where: { number, tenantId } });
  }

  if (origem === "telegram" && telegramId) {
    contact = await Contact.findOne({ where: { telegramId, tenantId } });
  }

  if (origem === "instagram" && instagramPK) {
    contact = await Contact.findOne({ where: { instagramPK, tenantId } });
  }

  if (origem === "messenger" && messengerId) {
    contact = await Contact.findOne({ where: { messengerId, tenantId } });
  }

  const isNewContact = !contact;

  if (contact) {
    const updateData: Record<string, unknown> = {
      pushname,
      isUser,
      isWAContact,
      telegramId,
      instagramPK,
      messengerId
    };

    if (profilePicUrl) {
      updateData.profilePicUrl = profilePicUrl;
    }

    await contact.update(updateData);
    await contact.reload();
  } else {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl: profilePicUrl || "",
      email,
      isGroup,
      pushname,
      isUser,
      isWAContact,
      tenantId,
      extraInfo,
      telegramId,
      instagramPK,
      messengerId
    });
  }

  if (
    isNewContact &&
    origem === "whatsapp" &&
    number &&
    !isGroup &&
    saveVCardToSelf
  ) {
    SendContactVCardToSelf(tenantId, number, whatsappId).catch(() => undefined);
  }

  socketEmit({
    tenantId,
    type: "contact:update",
    payload: contact
  });

  return contact;
};

export default CreateOrUpdateContactService;
