import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import persistContactProfilePic from "../../helpers/persistContactProfilePic";
import { getWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

const buildJidCandidates = (
  number: string,
  serializedJid?: string
): string[] => {
  const digits = String(number || "").replace(/\D/g, "");
  const candidates: string[] = [];

  const push = (jid?: string | null) => {
    if (jid && !candidates.includes(jid)) {
      candidates.push(jid);
    }
  };

  push(serializedJid);
  if (digits) {
    push(`${digits}@c.us`);
    push(`${digits}@lid`);
  }
  if (number?.includes("@")) {
    push(number);
  }

  return candidates;
};

const ResolveContactProfilePicUrl = async (
  tenantId: string | number,
  number: string,
  serializedJid?: string,
  whatsappId?: number
): Promise<string | undefined> => {
  try {
    const whatsapp = whatsappId
      ? { id: whatsappId }
      : await GetDefaultWhatsApp(tenantId);
    const wbot = getWbot(whatsapp.id);
    const candidates = buildJidCandidates(number, serializedJid);

    for (const jid of candidates) {
      try {
        const remoteUrl = await wbot.getProfilePicUrl(jid);
        if (!remoteUrl) continue;

        const persisted = await persistContactProfilePic(
          tenantId,
          number,
          remoteUrl
        );
        if (persisted) return persisted;
      } catch {
        /* try next jid */
      }
    }
  } catch (error) {
    logger.warn(
      `ResolveContactProfilePicUrl tenant=${tenantId} number=${number}: ${error}`
    );
  }

  return undefined;
};

export default ResolveContactProfilePicUrl;
