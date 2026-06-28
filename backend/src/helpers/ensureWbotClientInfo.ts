import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

// ClientInfo existe em runtime mas não como valor no .d.ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientInfo: ClientInfoClass } = require("whatsapp-web.js");

type ConnInfo = {
  wid?: { _serialized?: string; user?: string };
  pushname?: string;
  platform?: string;
};

/** wwebjs só define client.info na 1ª injeção; em restore WWebJS já existe e wid fica null. */
export const ensureWbotClientInfo = async (
  wbot: WbotClient
): Promise<boolean> => {
  if ((wbot as any).info?.wid) {
    return true;
  }
  if (!wbot.pupPage) {
    return false;
  }

  try {
    const data = (await wbot.pupPage.evaluate(() => {
      const Conn = window.require("WAWebConnModel").Conn;
      const meUser = window.require("WAWebUserPrefsMeUser");
      return {
        ...Conn.serialize(),
        wid: meUser.getMaybeMePnUser() || meUser.getMaybeMeLidUser()
      };
    })) as ConnInfo;

    if (!data?.wid) {
      return false;
    }

    (wbot as any).info = new ClientInfoClass(wbot, data);
    const wid =
      (data.wid as any)?._serialized ||
      (data.wid.user ? `${data.wid.user}@c.us` : null);
    logger.info(`ensureWbotClientInfo: wid=${wid || "unknown"}`);
    return true;
  } catch (error) {
    logger.warn(`ensureWbotClientInfo failed: ${error}`);
    return false;
  }
};

export default ensureWbotClientInfo;
