# 🔗 O que é Webhook e para que serve?

## 📖 Explicação Simples

**Webhook = "Callback" ou "Notificação em Tempo Real"**

É como um **"telefone"** que a Evolution API usa para **avisar seu sistema** quando algo acontece no WhatsApp.

---

## 🔄 Como Funciona?

### **Sem Evolution API (WWebJS):**
```
WhatsApp → WWebJS (polling/escuta direta) → Seu Sistema
```
- WWebJS fica "escutando" diretamente o WhatsApp
- Quando chega mensagem, processa imediatamente

### **Com Evolution API (Webhook):**
```
WhatsApp → Evolution API → Webhook (HTTP POST) → Seu Sistema
```
- Evolution API fica "escutando" o WhatsApp
- Quando algo acontece, **envia um HTTP POST** para o webhook
- Seu sistema recebe e processa

---

## 🎯 Para que serve o Webhook?

O webhook recebe **notificações** da Evolution API sobre eventos do WhatsApp:

### 1. **Mensagens Recebidas** 📨
```
Evento: "message" ou "messages.upsert"
```
- Alguém enviou mensagem para você
- Sistema cria ticket, processa mensagem, etc.

### 2. **Confirmação de Envio** ✅
```
Evento: "message.ack" ou "messages.update"
```
- Mensagem que você enviou foi entregue/lida
- Atualiza status no chat (enviada → entregue → lida)

### 3. **Status de Conexão** 🔌
```
Evento: "connection.update"
```
- WhatsApp desconectou
- QR Code expirou
- Reconectou com sucesso

### 4. **Outros Eventos** 📢
- Mensagem deletada
- Grupo criado/atualizado
- Contato atualizado
- etc.

---

## 🔧 Como está Configurado?

### **URL do Webhook:**
```
http://localhost:3100/webhooks/wuzapi/:instanceId
```

**Exemplo:**
```
http://localhost:3100/webhooks/wuzapi/wbot-1
```

Onde:
- `3100` = Porta do seu backend
- `wuzapi` = Rota do webhook
- `wbot-1` = ID da instância do WhatsApp

### **No código:**
```typescript
// backend/src/routes/WebHooksRoutes.ts
webHooksRoutes.post("/wuzapi/:instanceId", WuzapiWebhookController);
```

### **O que acontece quando recebe:**
1. Evolution API envia POST para o webhook
2. `WuzapiWebhookController` recebe
3. Identifica o tipo de evento
4. Processa:
   - Mensagem → `HandleWuzapiMessage`
   - ACK → `HandleWuzapiAck`
   - Conexão → Atualiza status

---

## 📋 Fluxo Completo

### **Quando alguém envia mensagem:**

```
1. Pessoa envia mensagem no WhatsApp
   ↓
2. Evolution API detecta
   ↓
3. Evolution API faz POST para:
   http://localhost:3100/webhooks/wuzapi/wbot-1
   {
     "event": "message",
     "instance": "wbot-1",
     "data": { ...mensagem... }
   }
   ↓
4. Seu backend recebe no WuzapiWebhookController
   ↓
5. Processa mensagem:
   - Cria/atualiza contato
   - Cria/atualiza ticket
   - Salva mensagem no banco
   - Mostra no chat
   ↓
6. Retorna 200 OK para Evolution API
```

### **Quando você envia mensagem:**

```
1. Você envia via seu sistema
   ↓
2. Sistema chama Evolution API
   POST /message/sendText/wbot-1
   ↓
3. Evolution API envia mensagem
   ↓
4. Evolution API confirma via webhook:
   {
     "event": "message.ack",
     "data": { status: "delivered" }
   }
   ↓
5. Sistema atualiza status no chat
```

---

## ⚙️ Configuração no .env

```env
# URL que a Evolution API vai chamar
WUZAPI_WEBHOOK_URL=http://localhost:3100/webhooks/wuzapi
```

**Importante:**
- Em **produção**, deve ser **HTTPS** e **acessível publicamente**
- Em **desenvolvimento**, pode ser `localhost` se tudo roda na mesma máquina
- Se usar Docker/cloud, precisa ser IP público ou domínio

---

## 🚨 Por que é Necessário?

**Sem webhook:**
- ❌ Seu sistema não saberia quando chega mensagem
- ❌ Não saberia se mensagem foi entregue/lida
- ❌ Não saberia se WhatsApp desconectou

**Com webhook:**
- ✅ Recebe notificações em tempo real
- ✅ Processa mensagens automaticamente
- ✅ Atualiza status de entrega/leitura
- ✅ Monitora conexão

---

## 🔍 Resumo

**Webhook = Endpoint HTTP que recebe notificações da Evolution API**

É como um **"ouvido"** do seu sistema:
- Evolution API "ouve" o WhatsApp
- Quando algo acontece, "grita" para o webhook
- Webhook "ouve" e processa

**Sem webhook = Sistema "surdo"** 🚫👂

---

## 📝 Exemplo Prático

**Situação:** Alguém te manda "Olá" no WhatsApp

**O que acontece:**
1. Evolution API detecta mensagem
2. Faz POST para: `http://localhost:3100/webhooks/wuzapi/wbot-1`
3. Seu sistema recebe e processa
4. Mensagem aparece no chat do sistema
5. Sistema pode responder automaticamente

**Tudo isso em milissegundos!** ⚡

