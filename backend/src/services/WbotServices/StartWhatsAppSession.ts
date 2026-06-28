import { getWbot, initWbot, isWbotInitializing, bootstrapConnectedWbot } from "../../libs/wbot";
import { initWuzapiSession } from "../../libs/wuzapiSession";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import { StartInstaBotSession } from "../InstagramBotServices/StartInstaBotSession";
import { StartTbotSession } from "../TbotServices/StartTbotSession";
import { StartWaba360 } from "../WABA360/StartWaba360";
import { StartMessengerBot } from "../MessengerChannelServices/StartMessengerBot";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp
): Promise<void> => {
  try {
    const wbot = getWbot(whatsapp.id);
    const state = String(await wbot.getState()).toUpperCase();
    if (state === "CONNECTED") {
      logger.info(`StartWhatsAppSession: ${whatsapp.id} already CONNECTED`);
      const fresh = await Whatsapp.findByPk(whatsapp.id);
      if (fresh) await bootstrapConnectedWbot(wbot as any, fresh);
      return;
    }
  } catch {
    /* session not in memory */
  }

  if (isWbotInitializing(whatsapp.id)) {
    logger.info(
      `StartWhatsAppSession: ${whatsapp.id} already initializing, skipping duplicate`
    );
    return;
  }

  const fresh = await Whatsapp.findByPk(whatsapp.id);
  if (!fresh) return;

  if (fresh.status !== "qrcode" || !fresh.qrcode) {
    await fresh.update({ status: "OPENING" });
  }

  const io = getIO();
  const updated = await Whatsapp.findByPk(whatsapp.id);
  io.emit(`${whatsapp.tenantId}:whatsappSession`, {
    action: "update",
    session: updated || fresh
  });

  try {
    if (fresh.type === "whatsapp") {
      // Verificar se deve usar WUZAPI
      const useWuzapi = process.env.USE_WUZAPI === "true";

      if (useWuzapi) {
        await initWuzapiSession(whatsapp);
      } else {
        const wbot = await initWbot(fresh);
        await bootstrapConnectedWbot(wbot, fresh);
      }
    }

    if (fresh.type === "telegram") {
      StartTbotSession(fresh);
    }

    if (fresh.type === "instagram") {
      StartInstaBotSession(fresh);
    }

    if (fresh.type === "messenger") {
      StartMessengerBot(fresh);
    }

    if (fresh.type === "waba") {
      if (fresh.wabaBSP === "360") {
        StartWaba360(fresh);
      }
    }
  } catch (err) {
    logger.error(`StartWhatsAppSession | Error: ${err}`);
    throw new AppError("ERR_START_SESSION", 404);
  }
};
