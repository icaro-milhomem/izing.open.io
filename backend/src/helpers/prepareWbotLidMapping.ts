import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

const digitsOnly = (value: string): string =>
  String(value || "").replace(/\D/g, "");

const lidMappingCache = new WeakMap<
  WbotClient,
  Map<string, { at: number; data: { lid?: string; pn?: string } }>
>();

const LID_MAPPING_CACHE_MS = 60_000;

export const isLikelyPhone = (value: string): boolean => {
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 13;
};

export const isLikelyLid = (value: string): boolean => {
  const digits = digitsOnly(value);
  return digits.length > 13;
};

/** Sincroniza mapeamento LID↔telefone no WhatsApp Web antes do envio. */
export const prepareWbotLidMapping = async (
  wbot: WbotClient,
  phoneOrJid: string
): Promise<{ lid?: string; pn?: string }> => {
  if (!wbot.pupPage) return {};

  const pnJid = phoneOrJid.includes("@")
    ? phoneOrJid
    : `${digitsOnly(phoneOrJid)}@c.us`;

  if (!pnJid.endsWith("@c.us") && !pnJid.endsWith("@lid")) {
    return {};
  }

  if (pnJid.endsWith("@c.us") && !isLikelyPhone(pnJid)) {
    return {};
  }

  const cacheForWbot =
    lidMappingCache.get(wbot) ||
    new Map<string, { at: number; data: { lid?: string; pn?: string } }>();
  lidMappingCache.set(wbot, cacheForWbot);

  const cached = cacheForWbot.get(pnJid);
  if (cached && Date.now() - cached.at < LID_MAPPING_CACHE_MS) {
    return cached.data;
  }

  try {
    const mapped = await wbot.pupPage.evaluate((userId: string) => {
      const w = window as any;
      if (!w.WWebJS?.enforceLidAndPnRetrieval) {
        return {};
      }
      return w.WWebJS.enforceLidAndPnRetrieval(userId).then(
        ({ lid, phone }: { lid?: { _serialized?: string }; phone?: { _serialized?: string } }) => ({
          lid: lid?._serialized,
          pn: phone?._serialized
        })
      );
    }, pnJid);

    if (mapped?.lid || mapped?.pn) {
      logger.info(
        `prepareWbotLidMapping phone=${pnJid} lid=${mapped.lid || "-"} pn=${mapped.pn || "-"}`
      );
    }

    const data = mapped || {};
    cacheForWbot.set(pnJid, { at: Date.now(), data });
    return data;
  } catch (error) {
    logger.warn(`prepareWbotLidMapping failed for ${pnJid}: ${error}`);
    return {};
  }
};

export default prepareWbotLidMapping;
