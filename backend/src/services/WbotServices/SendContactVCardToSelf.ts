import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

/** Envia o vCard do contato para o próprio WhatsApp conectado (chat "você"). */
const SendContactVCardToSelf = async (
  tenantId: string | number,
  number: string,
  whatsappId?: number
): Promise<void> => {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return;

  try {
    const whatsapp = whatsappId
      ? await Whatsapp.findByPk(whatsappId)
      : await GetDefaultWhatsApp(tenantId);

    if (!whatsapp || whatsapp.status !== "CONNECTED") return;

    const wbot = getWbot(whatsapp.id);
    const selfJid =
      (wbot as any).info?.wid?._serialized ||
      (wbot as any).info?.wid?.user
        ? `${(wbot as any).info.wid.user}@c.us`
        : null;

    if (!selfJid) {
      logger.warn("SendContactVCardToSelf: wid not available");
      return;
    }

    await wbot.sendMessage(selfJid, "", {
      contactCard: `${digits}@c.us`
    } as Record<string, unknown>);
  } catch (error) {
    logger.warn(
      `SendContactVCardToSelf tenant=${tenantId} number=${digits}: ${error}`
    );
  }
};

export default SendContactVCardToSelf;
