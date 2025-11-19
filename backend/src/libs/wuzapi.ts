import axios, { AxiosInstance } from "axios";
import { logger } from "../utils/logger";
import FormData from "form-data";
import fs from "fs";

interface WuzapiConfig {
  baseURL: string;
  apiKey: string;
}

interface InstanceInfo {
  instance: string;
  status: string;
  qrcode?: {
    code: string;
    base64?: string;
  };
}

interface SendTextResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
}

class WuzapiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor(config: WuzapiConfig) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        "apikey": config.apiKey, // Evolution API usa "apikey"
        "Content-Type": "application/json"
      },
      timeout: 30000
    });
  }

  // Criar instância (Evolution API)
  async createInstance(instanceId: string): Promise<InstanceInfo> {
    try {
      const response = await this.client.post(`/instance/create`, {
        instanceName: instanceId,
        token: this.apiKey,
        qrcode: true
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Evolution API createInstance error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Obter QR Code (Evolution API)
  async getQRCode(instanceId: string): Promise<string> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceId}`);
      // Evolution API retorna qrcode em base64 ou code
      return response.data.qrcode?.base64 || response.data.qrcode?.code || response.data.qrcode || "";
    } catch (error: any) {
      logger.error(`Evolution API getQRCode error: ${error.message}`);
      throw error;
    }
  }

  // Verificar status da instância (Evolution API)
  async getInstanceStatus(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceId}`);
      // Evolution API retorna: { instance: { state: "open" | "close" | "connecting" } }
      return {
        state: response.data?.instance?.state || response.data?.state || "close",
        instance: response.data?.instance || response.data
      };
    } catch (error: any) {
      logger.error(`Evolution API getInstanceStatus error: ${error.message}`);
      throw error;
    }
  }

  // Obter informações da instância
  async getInstanceInfo(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/fetchInstances`);
      const instances = response.data || [];
      return instances.find((inst: any) => inst.instanceName === instanceId);
    } catch (error: any) {
      logger.error(`WUZAPI getInstanceInfo error: ${error.message}`);
      throw error;
    }
  }

  // Enviar mensagem de texto (Evolution API)
  async sendText(
    instanceId: string,
    number: string,
    text: string,
    options?: {
      quotedMessageId?: string;
    }
  ): Promise<SendTextResponse> {
    try {
      const payload: any = {
        number: number,
        textMessage: {
          text: text
        }
      };

      if (options?.quotedMessageId) {
        payload.quotedMessage = {
          key: {
            id: options.quotedMessageId
          }
        };
      }

      const response = await this.client.post(
        `/message/sendText/${instanceId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Evolution API sendText error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Enviar mídia
  async sendMedia(
    instanceId: string,
    number: string,
    mediaPath: string,
    caption?: string,
    options?: {
      quotedMessageId?: string;
    }
  ): Promise<SendTextResponse> {
    try {
      const form = new FormData();
      form.append("number", number);
      form.append("media", fs.createReadStream(mediaPath));
      if (caption) form.append("caption", caption);
      if (options?.quotedMessageId) {
        form.append("quotedMessageId", options.quotedMessageId);
      }

      const response = await this.client.post(
        `/message/sendMedia/${instanceId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            "X-API-Key": this.apiKey
          }
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI sendMedia error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Enviar botões interativos (Evolution API)
  async sendButtons(
    instanceId: string,
    number: string,
    text: string,
    buttons: Array<{ id: string; text: string }>,
    footer?: string
  ): Promise<SendTextResponse> {
    try {
      const response = await this.client.post(
        `/message/sendButtons/${instanceId}`,
        {
          number: number,
          buttonsMessage: {
            contentText: text,
            footerText: footer,
            buttons: buttons.map(btn => ({
              buttonId: btn.id,
              buttonText: {
                displayText: btn.text
              },
              type: 1 // RESPONSE
            }))
          }
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Evolution API sendButtons error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Enviar lista interativa (Evolution API)
  async sendList(
    instanceId: string,
    number: string,
    text: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    footer?: string
  ): Promise<SendTextResponse> {
    try {
      const response = await this.client.post(
        `/message/sendList/${instanceId}`,
        {
          number: number,
          listMessage: {
            title: text,
            description: footer || "",
            buttonText: buttonText,
            footerText: footer,
            sections: sections.map(section => ({
              title: section.title,
              rows: section.rows.map(row => ({
                rowId: row.id,
                title: row.title,
                description: row.description || ""
              }))
            }))
          }
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Evolution API sendList error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Deletar instância
  async deleteInstance(instanceId: string): Promise<void> {
    try {
      await this.client.delete(`/instance/delete/${instanceId}`);
    } catch (error: any) {
      logger.error(`WUZAPI deleteInstance error: ${error.message}`);
      throw error;
    }
  }

  // Configurar webhook (Evolution API)
  async setWebhook(instanceId: string, webhookUrl: string): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${instanceId}`, {
        url: webhookUrl,
        webhook_by_events: true,
        webhook_base64: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE",
          "QRCODE_UPDATED"
        ]
      });
      logger.info(`Webhook configurado para ${instanceId}: ${webhookUrl}`);
    } catch (error: any) {
      logger.error(`Evolution API setWebhook error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Obter webhook configurado
  async getWebhook(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/webhook/find/${instanceId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI getWebhook error: ${error.message}`);
      throw error;
    }
  }
}

// Singleton
let wuzapiClient: WuzapiClient | null = null;

export const getWuzapiClient = (): WuzapiClient => {
  if (!wuzapiClient) {
    const baseURL = process.env.WUZAPI_BASE_URL || "http://localhost:8080";
    const apiKey = process.env.WUZAPI_API_KEY || "";

    if (!apiKey) {
      logger.warn("WUZAPI_API_KEY não configurada no .env");
    }

    wuzapiClient = new WuzapiClient({
      baseURL,
      apiKey
    });
  }
  return wuzapiClient;
};

export default getWuzapiClient;

