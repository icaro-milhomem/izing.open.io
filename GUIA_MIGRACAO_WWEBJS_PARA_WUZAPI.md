# Guia Completo de Migração: WWebJS → WUZAPI

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Diferenças Arquiteturais](#diferenças-arquiteturais)
3. [Pré-requisitos](#pré-requisitos)
4. [Passo a Passo da Migração](#passo-a-passo-da-migração)
5. [Mapeamento de Funcionalidades](#mapeamento-de-funcionalidades)
6. [Arquivos a Modificar](#arquivos-a-modificar)
7. [Configurações](#configurações)
8. [Testes e Validação](#testes-e-validação)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este guia detalha a migração do sistema de **whatsapp-web.js** (WWebJS) para **WUZAPI** (whatsmeow), uma API RESTful baseada em Go que oferece maior estabilidade e suporte nativo a mensagens interativas.

### Por que migrar?

- ✅ **Estabilidade**: WUZAPI usa whatsmeow (Go), mais estável que Puppeteer
- ✅ **Menor consumo de recursos**: Não precisa de Chrome/Puppeteer
- ✅ **Suporte nativo a menus interativos**: Botões e listas funcionam nativamente
- ✅ **API RESTful**: Integração mais simples e escalável
- ✅ **Multi-instância**: Suporte nativo a múltiplas conexões

### O que muda?

| Aspecto | WWebJS | WUZAPI |
|---------|--------|--------|
| **Conexão** | Cliente Puppeteer local | API REST externa |
| **Autenticação** | QR Code via eventos | QR Code via endpoint HTTP |
| **Mensagens** | Eventos `message_create` | Webhooks HTTP |
| **Envio** | Método `wbot.sendMessage()` | POST `/messages/sendText` |
| **Sessões** | Armazenadas em `.wwebjs_auth` | Gerenciadas pela API |

---

## 🔄 Diferenças Arquiteturais

### WWebJS (Atual)

```
┌─────────────────┐
│   Backend App   │
│                 │
│  ┌───────────┐  │
│  │  WWebJS   │  │
│  │  Client   │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │ Puppeteer │  │
│  │  + Chrome │  │
│  └───────────┘  │
└─────────────────┘
```

### WUZAPI (Novo)

```
┌─────────────────┐         HTTP/REST         ┌──────────────┐
│   Backend App   │◄─────────────────────────►│   WUZAPI     │
│                 │                            │  (whatsmeow) │
│  ┌───────────┐  │                            └──────┬───────┘
│  │ HTTP      │  │                                   │
│  │ Client    │  │                                   ▼
│  │ (axios)   │  │                            ┌──────────────┐
│  └───────────┘  │                            │   WhatsApp   │
└─────────────────┘                            │   WebSocket  │
                                                └──────────────┘
```

---

## 📦 Pré-requisitos

### 1. Instalar WUZAPI

```bash
# Opção 1: Docker (Recomendado)
docker run -d \
  --name wuzapi \
  -p 8080:8080 \
  -v $(pwd)/wuzapi-data:/app/data \
  ghcr.io/cod3r-company/wuzapi:latest

# Opção 2: Binário direto
# Baixar de: https://github.com/cod3r-company/wuzapi/releases
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env`:

```env
# WUZAPI Configuration
WUZAPI_BASE_URL=http://localhost:8080
WUZAPI_API_KEY=your-api-key-here
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi
```

### 3. Dependências Node.js

O projeto já tem `axios`, mas verifique:

```bash
cd backend
npm list axios
# Se não tiver:
npm install axios
```

---

## 🚀 Passo a Passo da Migração

### **ETAPA 1: Criar Cliente WUZAPI**

Crie o arquivo `backend/src/libs/wuzapi.ts`:

```typescript
import axios, { AxiosInstance } from "axios";
import { logger } from "../utils/logger";

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
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json"
      },
      timeout: 30000
    });
  }

  // Criar instância
  async createInstance(instanceId: string): Promise<InstanceInfo> {
    try {
      const response = await this.client.post(`/instance/create`, {
        instance: instanceId,
        token: this.apiKey
      });
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI createInstance error: ${error.message}`);
      throw error;
    }
  }

  // Obter QR Code
  async getQRCode(instanceId: string): Promise<string> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceId}`);
      return response.data.qrcode?.base64 || response.data.qrcode?.code || "";
    } catch (error: any) {
      logger.error(`WUZAPI getQRCode error: ${error.message}`);
      throw error;
    }
  }

  // Verificar status da instância
  async getInstanceStatus(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI getInstanceStatus error: ${error.message}`);
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendText(instanceId: string, number: string, text: string, options?: {
    quotedMessageId?: string;
  }): Promise<any> {
    try {
      const payload: any = {
        number: number,
        text: text
      };

      if (options?.quotedMessageId) {
        payload.quotedMessageId = options.quotedMessageId;
      }

      const response = await this.client.post(
        `/message/sendText/${instanceId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI sendText error: ${error.message}`);
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
  ): Promise<any> {
    try {
      const FormData = require("form-data");
      const fs = require("fs");

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
          headers: form.getHeaders()
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI sendMedia error: ${error.message}`);
      throw error;
    }
  }

  // Enviar botões interativos
  async sendButtons(
    instanceId: string,
    number: string,
    text: string,
    buttons: Array<{ id: string; text: string }>,
    footer?: string
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/message/sendButtons/${instanceId}`,
        {
          number: number,
          text: text,
          buttons: buttons,
          footer: footer
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI sendButtons error: ${error.message}`);
      throw error;
    }
  }

  // Enviar lista interativa
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
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/message/sendList/${instanceId}`,
        {
          number: number,
          text: text,
          buttonText: buttonText,
          sections: sections,
          footer: footer
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`WUZAPI sendList error: ${error.message}`);
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

  // Configurar webhook
  async setWebhook(instanceId: string, webhookUrl: string): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${instanceId}`, {
        url: webhookUrl,
        events: ["message", "message.ack", "connection.update"]
      });
    } catch (error: any) {
      logger.error(`WUZAPI setWebhook error: ${error.message}`);
      throw error;
    }
  }
}

// Singleton
let wuzapiClient: WuzapiClient | null = null;

export const getWuzapiClient = (): WuzapiClient => {
  if (!wuzapiClient) {
    wuzapiClient = new WuzapiClient({
      baseURL: process.env.WUZAPI_BASE_URL || "http://localhost:8080",
      apiKey: process.env.WUZAPI_API_KEY || ""
    });
  }
  return wuzapiClient;
};

export default getWuzapiClient;
```

---

### **ETAPA 2: Substituir Inicialização de Sessão**

Modifique `backend/src/libs/wbot.ts`:

**ANTES (WWebJS):**
```typescript
import { Client, LocalAuth } from "whatsapp-web.js";

export const initWbot = async (whatsapp: Whatsapp): Promise<Session> => {
  const wbot = new Client({
    authStrategy: new LocalAuth({ clientId: `wbot-${whatsapp.id}` }),
    puppeteer: { ... }
  });
  // ...
}
```

**DEPOIS (WUZAPI):**
```typescript
import getWuzapiClient from "./wuzapi";
import { getIO } from "./socket";

export const initWbot = async (whatsapp: Whatsapp): Promise<void> => {
  const io = getIO();
  const wuzapi = getWuzapiClient();
  const instanceId = `wbot-${whatsapp.id}`;

  try {
    // Criar instância
    await wuzapi.createInstance(instanceId);

    // Configurar webhook
    const webhookUrl = `${process.env.WUZAPI_WEBHOOK_URL}/${instanceId}`;
    await wuzapi.setWebhook(instanceId, webhookUrl);

    // Obter QR Code
    const pollQR = async () => {
      const status = await wuzapi.getInstanceStatus(instanceId);
      
      if (status.state === "close" || status.state === "connecting") {
        const qr = await wuzapi.getQRCode(instanceId);
        if (qr) {
          await whatsapp.update({ 
            qrcode: qr, 
            status: "qrcode",
            retries: 0 
          });
          io.emit(`${whatsapp.tenantId}:whatsappSession`, {
            action: "update",
            session: whatsapp
          });
        }
        setTimeout(pollQR, 5000); // Poll a cada 5s
      } else if (status.state === "open") {
        await whatsapp.update({
          status: "CONNECTED",
          qrcode: "",
          retries: 0,
          number: status.instance?.user?.split("@")[0] || ""
        });
        io.emit(`${whatsapp.tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
        io.emit(`${whatsapp.tenantId}:whatsappSession`, {
          action: "readySession",
          session: whatsapp
        });
      }
    };

    await pollQR();
  } catch (error) {
    logger.error(`initWbot error: ${error}`);
    throw error;
  }
};
```

---

### **ETAPA 3: Criar Webhook Controller**

Crie `backend/src/controllers/WuzapiWebhookController.ts`:

```typescript
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import HandleWuzapiMessage from "../services/WbotServices/helpers/HandleWuzapiMessage";

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

    logger.info(`WUZAPI Webhook received: ${payload.event} for ${instanceId}`);

    // Processar diferentes tipos de eventos
    switch (payload.event) {
      case "message":
        await HandleWuzapiMessage(payload.data, instanceId);
        break;

      case "message.ack":
        // Processar confirmação de leitura
        // TODO: Implementar HandleWuzapiAck
        break;

      case "connection.update":
        // Atualizar status da conexão
        // TODO: Implementar atualização de status
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
```

---

### **ETAPA 4: Adaptar Handler de Mensagens**

Crie `backend/src/services/WbotServices/helpers/HandleWuzapiMessage.ts`:

```typescript
import { logger } from "../../../utils/logger";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import VerifyContact from "./VerifyContact";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "./VerifyMessage";
import VerifyMediaMessage from "./VerifyMediaMessage";
import verifyBusinessHours from "./VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";

interface WuzapiMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  pushName?: string;
}

const HandleWuzapiMessage = async (
  wuzapiMsg: WuzapiMessage,
  instanceId: string
): Promise<void> => {
  try {
    // Extrair ID do WhatsApp da instância
    const whatsappId = parseInt(instanceId.replace("wbot-", ""));
    const whatsapp = await ShowWhatsAppService({ id: whatsappId });

    if (!whatsapp) {
      logger.error(`WhatsApp instance not found: ${whatsappId}`);
      return;
    }

    const { tenantId } = whatsapp;
    const remoteJid = wuzapiMsg.key.remoteJid;
    const fromMe = wuzapiMsg.key.fromMe;

    // Ignorar status broadcasts
    if (remoteJid === "status@broadcast") {
      return;
    }

    // Extrair número do contato
    const number = remoteJid.split("@")[0];
    const isGroup = remoteJid.includes("@g.us");

    // Ignorar grupos se configurado
    const Settingdb = await Setting.findOne({
      where: { key: "ignoreGroupMsg", tenantId }
    });

    if (Settingdb?.value === "enabled" && isGroup) {
      return;
    }

    // Adaptar mensagem para formato interno
    const adaptedMsg = adaptWuzapiMessage(wuzapiMsg);

    // Verificar/Criar contato
    const contact = await VerifyContactWuzapi(
      number,
      wuzapiMsg.pushName || number,
      tenantId
    );

    // Verificar/Criar ticket
    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId: whatsapp.id,
      unreadMessages: fromMe ? 0 : 1,
      tenantId,
      msg: adaptedMsg,
      channel: "whatsapp"
    });

    if (ticket?.isCampaignMessage || ticket?.isFarewellMessage) {
      return;
    }

    // Processar mensagem
    const hasMedia = !!(
      wuzapiMsg.message?.imageMessage ||
      wuzapiMsg.message?.videoMessage ||
      wuzapiMsg.message?.audioMessage ||
      wuzapiMsg.message?.documentMessage
    );

    if (hasMedia) {
      await VerifyMediaMessageWuzapi(wuzapiMsg, ticket, contact);
    } else {
      await VerifyMessageWuzapi(wuzapiMsg, ticket, contact);
    }

    // Verificar horário comercial e chat flow
    const isBusinessHours = await verifyBusinessHours(adaptedMsg, ticket);
    if (isBusinessHours) {
      await VerifyStepsChatFlowTicket(adaptedMsg, ticket);
    }
  } catch (error) {
    logger.error(`HandleWuzapiMessage error: ${error}`);
  }
};

// Adaptar mensagem WUZAPI para formato interno
const adaptWuzapiMessage = (wuzapiMsg: WuzapiMessage): any => {
  const message = wuzapiMsg.message;
  let body = "";
  let mediaType = "chat";

  // Extrair texto
  if (message?.conversation) {
    body = message.conversation;
  } else if (message?.extendedTextMessage?.text) {
    body = message.extendedTextMessage.text;
  } else if (message?.imageMessage?.caption) {
    body = message.imageMessage.caption;
    mediaType = "image";
  } else if (message?.videoMessage?.caption) {
    body = message.videoMessage.caption;
    mediaType = "video";
  } else if (message?.audioMessage) {
    mediaType = "audio";
    body = "🎵 Áudio";
  } else if (message?.documentMessage) {
    mediaType = "document";
    body = message.documentMessage.caption || "📄 Documento";
  } else if (message?.stickerMessage) {
    mediaType = "sticker";
    body = "🎨 Sticker";
  } else if (message?.locationMessage) {
    mediaType = "location";
    body = "📍 Localização";
  } else if (message?.buttonsResponseMessage) {
    body = message.buttonsResponseMessage.selectedButtonId || "";
  } else if (message?.listResponseMessage) {
    body = message.listResponseMessage.singleSelectReply?.selectedRowId || "";
  }

  return {
    id: {
      id: wuzapiMsg.key.id,
      _serialized: `${wuzapiMsg.key.fromMe}_${wuzapiMsg.key.remoteJid}_${wuzapiMsg.key.id}`
    },
    from: wuzapiMsg.key.remoteJid,
    fromMe: wuzapiMsg.key.fromMe,
    body: body || (wuzapiMsg.key.fromMe ? "📷 Mídia" : ""),
    timestamp: wuzapiMsg.messageTimestamp,
    hasMedia: !!(
      message?.imageMessage ||
      message?.videoMessage ||
      message?.audioMessage ||
      message?.documentMessage
    ),
    type: mediaType,
    message: message
  };
};

export default HandleWuzapiMessage;
```

---

### **ETAPA 5: Atualizar Serviços de Envio**

Modifique `backend/src/services/WbotServices/SendWhatsAppMessage.ts`:

**ANTES:**
```typescript
const wbot = await GetTicketWbot(ticket);
const sendMessage = await wbot.sendMessage(
  `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`,
  body,
  { quotedMessageId: quotedMsgSerializedId }
);
```

**DEPOIS:**
```typescript
import getWuzapiClient from "../../../libs/wuzapi";

const wuzapi = getWuzapiClient();
const instanceId = `wbot-${ticket.whatsappId}`;
const number = ticket.contact.number;

const sendMessage = await wuzapi.sendText(
  instanceId,
  number,
  body,
  { quotedMessageId: quotedMsg?.messageId }
);
```

Modifique `backend/src/services/WbotServices/SendWhatsAppMedia.ts`:

**ANTES:**
```typescript
const wbot = await GetTicketWbot(ticket);
const newMedia = MessageMedia.fromFilePath(media.path);
const sendMessage = await wbot.sendMessage(chatId, newMedia, {
  sendAudioAsVoice: true
});
```

**DEPOIS:**
```typescript
import getWuzapiClient from "../../../libs/wuzapi";

const wuzapi = getWuzapiClient();
const instanceId = `wbot-${ticket.whatsappId}`;
const number = ticket.contact.number;

const sendMessage = await wuzapi.sendMedia(
  instanceId,
  number,
  media.path,
  media.filename
);
```

---

### **ETAPA 6: Adicionar Suporte a Menus Interativos**

Modifique `backend/src/services/WbotServices/SendWhatsAppMessage.ts` para suportar botões e listas:

```typescript
// Adicionar interface para menus
interface MenuOptions {
  buttons?: Array<{ id: string; text: string }>;
  list?: {
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
  footer?: string;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  userId,
  menuOptions
}: Request & { menuOptions?: MenuOptions }): Promise<any> => {
  const wuzapi = getWuzapiClient();
  const instanceId = `wbot-${ticket.whatsappId}`;
  const number = ticket.contact.number;

  try {
    let sendMessage;

    // Enviar lista interativa
    if (menuOptions?.list) {
      sendMessage = await wuzapi.sendList(
        instanceId,
        number,
        body,
        menuOptions.list.buttonText,
        menuOptions.list.sections,
        menuOptions.footer
      );
    }
    // Enviar botões interativos
    else if (menuOptions?.buttons) {
      sendMessage = await wuzapi.sendButtons(
        instanceId,
        number,
        body,
        menuOptions.buttons,
        menuOptions.footer
      );
    }
    // Enviar texto simples
    else {
      sendMessage = await wuzapi.sendText(
        instanceId,
        number,
        body,
        { quotedMessageId: quotedMsg?.messageId }
      );
    }

    // Atualizar ticket
    await ticket.update({
      lastMessage: body,
      lastMessageAt: new Date().getTime()
    });

    // Log de mensagem
    if (userId) {
      await UserMessagesLog.create({
        messageId: sendMessage.key?.id || sendMessage.id,
        userId,
        ticketId: ticket.id
      });
    }

    return sendMessage;
  } catch (err) {
    logger.error(`SendWhatsAppMessage | Error: ${err}`);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};
```

---

### **ETAPA 7: Atualizar Rotas**

Adicione em `backend/src/routes/whatsappRoutes.ts`:

```typescript
import WuzapiWebhookController from "../controllers/WuzapiWebhookController";

// Webhook para receber mensagens do WUZAPI
router.post(
  "/webhooks/wuzapi/:instanceId",
  WuzapiWebhookController
);
```

---

### **ETAPA 8: Remover Dependências WWebJS**

1. **Remover do package.json:**
```bash
npm uninstall whatsapp-web.js
```

2. **Remover imports:**
   - Busque por `whatsapp-web.js` em todo o projeto
   - Substitua por imports do WUZAPI

3. **Remover pastas de sessão:**
```bash
rm -rf .wwebjs_auth
```

---

## 🔀 Mapeamento de Funcionalidades

| Funcionalidade WWebJS | Equivalente WUZAPI |
|----------------------|-------------------|
| `new Client()` | `wuzapi.createInstance()` |
| `wbot.on("qr")` | Polling `wuzapi.getQRCode()` |
| `wbot.on("ready")` | Polling `wuzapi.getInstanceStatus()` |
| `wbot.on("message_create")` | Webhook `POST /webhooks/wuzapi` |
| `wbot.sendMessage(text)` | `wuzapi.sendText()` |
| `wbot.sendMessage(media)` | `wuzapi.sendMedia()` |
| `wbot.getChats()` | Não necessário (webhook) |
| `wbot.getContactById()` | Adaptar do webhook payload |
| `msg.getChat()` | Adaptar do `remoteJid` |
| `MessageMedia.fromFilePath()` | Usar `fs.createReadStream()` |

---

## ⚙️ Configurações

### Variáveis de Ambiente (.env)

```env
# WUZAPI
WUZAPI_BASE_URL=http://localhost:8080
WUZAPI_API_KEY=sua-chave-api
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi

# Remover (não mais necessárias)
# CHROME_BIN=
# CHROME_ARGS=
# CHECK_INTERVAL=
```

### Nginx (se usar)

```nginx
location /webhooks/wuzapi/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ✅ Testes e Validação

### Checklist de Testes

- [ ] **Conexão**
  - [ ] Criar instância via API
  - [ ] Obter QR Code
  - [ ] Conectar WhatsApp
  - [ ] Verificar status "CONNECTED"

- [ ] **Recebimento**
  - [ ] Receber mensagem de texto
  - [ ] Receber mídia (imagem, áudio, vídeo, documento)
  - [ ] Receber mensagem de grupo (se habilitado)
  - [ ] Receber mensagem `fromMe` (enviada do celular)

- [ ] **Envio**
  - [ ] Enviar texto simples
  - [ ] Enviar mídia
  - [ ] Enviar botões interativos
  - [ ] Enviar lista interativa
  - [ ] Responder mensagem (quoted)

- [ ] **Tickets**
  - [ ] Criar ticket ao receber mensagem
  - [ ] Não duplicar tickets
  - [ ] Atualizar último contato

- [ ] **Integrações**
  - [ ] Chat Flow
  - [ ] Horário comercial
  - [ ] Webhooks externos

---

## 🐛 Troubleshooting

### Problema: QR Code não aparece

**Solução:**
- Verifique se WUZAPI está rodando: `curl http://localhost:8080/health`
- Verifique logs: `docker logs wuzapi`
- Confirme que a instância foi criada: `GET /instance/fetchInstances`

### Problema: Webhook não recebe mensagens

**Solução:**
- Verifique se o webhook está configurado: `GET /webhook/find/{instanceId}`
- Teste manualmente: `curl -X POST http://seu-dominio.com/webhooks/wuzapi/test`
- Verifique firewall/nginx permitindo requisições POST

### Problema: Mensagens não são enviadas

**Solução:**
- Verifique status da instância: deve estar "open"
- Verifique logs do WUZAPI
- Confirme formato do número (sem @c.us, apenas número)

### Problema: Mídia não é enviada

**Solução:**
- Verifique se o arquivo existe no caminho especificado
- Confirme permissões de leitura
- Verifique tamanho máximo permitido pela API

---

## 📝 Notas Importantes

1. **IDs de Instância**: Use o padrão `wbot-{whatsappId}` para manter compatibilidade

2. **Formato de Número**: WUZAPI espera apenas o número (ex: `5511999999999`), não o formato completo `5511999999999@c.us`

3. **Webhooks**: Configure HTTPS para produção (WhatsApp exige)

4. **Backup**: Antes de migrar, faça backup completo do banco de dados

5. **Rollback**: Mantenha o código WWebJS comentado por algumas semanas para facilitar rollback se necessário

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. Monitorar logs por 48h
2. Validar todas as funcionalidades críticas
3. Remover código WWebJS obsoleto
4. Atualizar documentação
5. Treinar equipe nas novas configurações

---

**Última atualização:** 2024
**Versão do guia:** 1.0

