import { initWbot, removeWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";

export const StartWhatsAppSessionVerify = async (
  whatsappId: number,
  error: string
): Promise<void> => {
  const errorString = error.toString().toLowerCase();
  const sessionClosed = "session closed";
  const sessiondisconnected =
    "TypeError: Cannot read property 'sendSeen' of undefined";
  const getChatError = "cannot read properties of undefined (reading 'getchat')";
  const getChatError2 = "cannot read property 'getchat' of undefined";
  const WAPP_NOT_INIT = "ERR_WAPP_NOT_INITIALIZED".toLowerCase();
  
  if (
    errorString.indexOf(sessionClosed) !== -1 ||
    errorString.indexOf(WAPP_NOT_INIT) !== -1 ||
    errorString.indexOf(sessiondisconnected) !== -1 ||
    errorString.indexOf(getChatError) !== -1 ||
    errorString.indexOf(getChatError2) !== -1
  ) {
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    try {
      if (whatsapp) {
        // Remover sessão corrompida da memória antes de reiniciar
        try {
          removeWbot(whatsappId);
          logger.info(`Sessão corrompida ${whatsappId} removida da memória`);
        } catch (removeError) {
          logger.warn(`Não foi possível remover sessão ${whatsappId} da memória: ${removeError}`);
        }
        
        await whatsapp.update({ status: "OPENING" });
        const io = getIO();
        io.emit(`${whatsapp?.tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
        const wbot = await initWbot(whatsapp);
        wbotMessageListener(wbot);
        wbotMonitor(wbot, whatsapp);
        logger.info(`Sessão WhatsApp ${whatsappId} reiniciada com sucesso`);
      }
    } catch (err) {
      logger.error(`Erro ao reiniciar sessão WhatsApp ${whatsappId}: ${err}`);
    }
  }
};
