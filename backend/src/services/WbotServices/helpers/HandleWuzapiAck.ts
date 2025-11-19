import { logger } from "../../../utils/logger";
import HandleMsgAck from "./HandleMsgAck";

interface WuzapiAck {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  receipt: {
    readTimestamp?: number;
    playedTimestamp?: number;
  };
  update: {
    status?: "READ" | "PLAYED" | "DELIVERED" | "SENT";
  };
}

const HandleWuzapiAck = async (
  wuzapiAck: WuzapiAck | WuzapiAck[],
  instanceId: string
): Promise<void> => {
  try {
    const acks = Array.isArray(wuzapiAck) ? wuzapiAck : [wuzapiAck];

    for (const ack of acks) {
      // Adaptar ACK do WUZAPI para formato esperado
      const adaptedAck = {
        id: {
          id: ack.key.id,
          _serialized: `${ack.key.fromMe}_${ack.key.remoteJid}_${ack.key.id}`
        },
        from: ack.key.remoteJid,
        fromMe: ack.key.fromMe
      };

      // Mapear status do WUZAPI para formato WWebJS
      let ackStatus: number = 3; // ACK_ERROR (padrão)
      
      if (ack.update?.status === "READ" || ack.receipt?.readTimestamp) {
        ackStatus = 3; // ACK_READ
      } else if (ack.update?.status === "PLAYED" || ack.receipt?.playedTimestamp) {
        ackStatus = 4; // ACK_PLAYED
      } else if (ack.update?.status === "DELIVERED") {
        ackStatus = 2; // ACK_DELIVRD
      } else if (ack.update?.status === "SENT") {
        ackStatus = 1; // ACK_SERVER
      }

      // Usar o HandleMsgAck existente
      await HandleMsgAck(adaptedAck as any, ackStatus);
    }
  } catch (error) {
    logger.error(`HandleWuzapiAck error: ${error}`);
  }
};

export default HandleWuzapiAck;

