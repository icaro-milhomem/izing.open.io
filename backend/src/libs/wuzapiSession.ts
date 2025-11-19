import { getIO } from "./socket";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import getWuzapiClient from "./wuzapi";

// Função para inicializar sessão via WUZAPI
export const initWuzapiSession = async (whatsapp: Whatsapp): Promise<void> => {
  const io = getIO();
  const sessionName = whatsapp.name;
  const { tenantId } = whatsapp;
  const instanceId = `wbot-${whatsapp.id}`;
  const wuzapi = getWuzapiClient();

  try {
    // Criar instância se não existir
    try {
      await wuzapi.createInstance(instanceId);
      logger.info(`Instância WUZAPI criada: ${instanceId}`);
    } catch (error: any) {
      // Se já existe, continua
      if (!error.response || error.response.status !== 409) {
        throw error;
      }
      logger.info(`Instância WUZAPI já existe: ${instanceId}`);
    }

    // Configurar webhook
    const webhookUrl = process.env.WUZAPI_WEBHOOK_URL || 
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/webhooks/wuzapi/${instanceId}`;
    
    try {
      await wuzapi.setWebhook(instanceId, webhookUrl);
    } catch (error: any) {
      logger.warn(`Erro ao configurar webhook (pode já estar configurado): ${error.message}`);
    }

    // Polling para obter QR Code e status
    const pollConnection = async (): Promise<void> => {
      try {
        const status = await wuzapi.getInstanceStatus(instanceId);
        
        if (!status || status.state === "close" || status.state === "connecting") {
          // Obter QR Code
          try {
            const qr = await wuzapi.getQRCode(instanceId);
            if (qr && whatsapp.status !== "CONNECTED") {
              await whatsapp.update({ 
                qrcode: qr, 
                status: "qrcode",
                retries: 0 
              });
              
              io.emit(`${tenantId}:whatsappSession`, {
                action: "update",
                session: whatsapp
              });
            }
          } catch (error: any) {
            logger.error(`Erro ao obter QR Code: ${error.message}`);
          }
          
          // Continuar polling
          setTimeout(pollConnection, 5000);
        } 
        else if (status.state === "open") {
          // Conectado
          const instanceInfo = await wuzapi.getInstanceInfo(instanceId);
          const phoneNumber = instanceInfo?.user?.split("@")[0] || 
                            status.instance?.user?.split("@")[0] || 
                            whatsapp.number;

          await whatsapp.update({
            status: "CONNECTED",
            qrcode: "",
            retries: 0,
            number: phoneNumber,
            phone: {
              ...(instanceInfo || {}),
              wuzapi: true
            }
          });

          io.emit(`${tenantId}:whatsappSession`, {
            action: "update",
            session: whatsapp
          });

          io.emit(`${tenantId}:whatsappSession`, {
            action: "readySession",
            session: whatsapp
          });

          logger.info(`Session WUZAPI: ${sessionName}-READY`);
        }
      } catch (error: any) {
        logger.error(`Erro no polling de conexão WUZAPI: ${error.message}`);
        
        // Em caso de erro, tentar novamente após 10 segundos
        setTimeout(pollConnection, 10000);
      }
    };

    // Iniciar polling
    await pollConnection();

  } catch (error: any) {
    logger.error(`initWuzapiSession error: ${error.message}`);
    
    const retry = whatsapp.retries || 0;
    await whatsapp.update({
      status: "DISCONNECTED",
      retries: retry + 1
    });

    io.emit(`${tenantId}:whatsappSession`, {
      action: "update",
      session: whatsapp
    });

    throw error;
  }
};

// Função para remover sessão WUZAPI
export const removeWuzapiSession = async (whatsappId: number): Promise<void> => {
  try {
    const wuzapi = getWuzapiClient();
    const instanceId = `wbot-${whatsappId}`;
    
    await wuzapi.deleteInstance(instanceId);
    logger.info(`Instância WUZAPI removida: ${instanceId}`);
  } catch (error: any) {
    logger.error(`Erro ao remover instância WUZAPI: ${error.message}`);
    // Não lançar erro, apenas logar
  }
};

