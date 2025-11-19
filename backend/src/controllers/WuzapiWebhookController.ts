import { Request, Response } from "express";
import { logger } from "../utils/logger";
import HandleWuzapiMessage from "../services/WbotServices/helpers/HandleWuzapiMessage";
import HandleWuzapiAck from "../services/WbotServices/helpers/HandleWuzapiAck";

interface WuzapiWebhookPayload {
  event: string;
  instance: string;
  data: any;
}

const WuzapiWebhookController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const payload: WuzapiWebhookPayload = req.body;
    const instanceId = req.params.instanceId || payload.instance;

    if (!instanceId) {
      logger.warn("WUZAPI Webhook recebido sem instanceId");
      return res.status(400).json({ error: "instanceId is required" });
    }

    logger.info(`WUZAPI Webhook received: ${payload.event} for ${instanceId}`);

    // Processar diferentes tipos de eventos
    switch (payload.event) {
      case "message":
      case "messages.upsert":
        await HandleWuzapiMessage(payload.data, instanceId);
        break;

      case "message.ack":
      case "messages.update":
        await HandleWuzapiAck(payload.data, instanceId);
        break;

      case "connection.update":
        // Atualizar status da conexão
        logger.info(`Connection update for ${instanceId}: ${JSON.stringify(payload.data)}`);
        // TODO: Implementar atualização de status no banco
        break;

      default:
        logger.warn(`Unknown WUZAPI event: ${payload.event}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`WuzapiWebhookController error: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default WuzapiWebhookController;

