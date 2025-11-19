# Como Instalar Evolution API

## 🚀 Instalação Rápida (Docker)

### Passo 1: Instalar Evolution API
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-secreta-aqui \
  -e CONFIG_SESSION_PHONE_CLIENT=Chrome \
  -e CONFIG_SESSION_PHONE_NAME=Chrome \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR=#198754 \
  -e CONFIG_URL_HEROKU_APP_NAME= \
  -e CONFIG_URL_HEROKU_API_KEY= \
  -e WEBHOOK_GLOBAL_URL= \
  -e WEBHOOK_GLOBAL_ENABLED=false \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true \
  -e WEBHOOK_GLOBAL_WEBHOOK_BASE64=false \
  -e CONFIG_SESSION_PHONE_STORAGE= \
  -e REDIS_ENABLED=false \
  -e REDIS_URI=redis://localhost:6379 \
  -e DATABASE_ENABLED=false \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI=postgresql://user:password@localhost:5432/evolution \
  -e DATABASE_CONNECTION_CLIENT_NAME= \
  -e DATABASE_SAVE_DATA_INSTANCE=false \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=false \
  -e DATABASE_SAVE_MESSAGE_UPDATE=false \
  -e DATABASE_SAVE_DATA_CONTACTS=false \
  -e DATABASE_SAVE_DATA_CHATS=false \
  -e DATABASE_SAVE_DATA_PRESENCE=false \
  -e DATABASE_SAVE_DATA_CHATSTATE=false \
  -e DATABASE_SAVE_DATA_LABELS=false \
  -e DATABASE_SAVE_DATA_POLL_MESSAGE=false \
  -e SERVER_TYPE=http \
  -e SERVER_PORT=8080 \
  -e SERVER_CORS_ENABLED=true \
  -e SERVER_CORS_ORIGIN=* \
  -e SERVER_LOG_LEVEL=ERROR \
  -e S3_ENABLED=false \
  -e S3_PROVIDER=aws \
  -e S3_REGION=us-east-1 \
  -e S3_ACCESS_KEY_ID= \
  -e S3_SECRET_ACCESS_KEY= \
  -e S3_BUCKET= \
  -e S3_ENDPOINT= \
  -e TYPEBOT_API_URL= \
  -e TYPEBOT_API_KEY= \
  -e TYPEBOT_SESSION_ID= \
  -e TYPEBOT_KEYWORD_FINISHED= \
  -e TYPEBOT_KEYWORD_RESTART= \
  -e TYPEBOT_IS_REMOVE_INTERACTIONS=false \
  -e TYPEBOT_IS_REMOVE_OLD_INTERACTIONS=false \
  -e TYPEBOT_IS_REMOVE_OLD_INTERACTIONS_IN_DAYS=1 \
  -e CHATWOOT_API_URL= \
  -e CHATWOOT_API_KEY= \
  -e CHATWOOT_ACCOUNT_ID= \
  -e CHATWOOT_INBOX_ID= \
  -e CHATWOOT_SIGN_MSG=false \
  -e CHATWOOT_REOPEN_CONVERSATION=false \
  -e CHATWOOT_CONVERSATION_PENDING=false \
  -e CHATWOOT_IMPORT_MESSAGES=false \
  -e CHATWOOT_IMPORT_OLD_MESSAGES=false \
  -e CHATWOOT_IMPORT_OLD_MESSAGES_DAYS=1 \
  -e WEBHOOK_GLOBAL_EVENTS=MESSAGES_UPSERT,MESSAGES_UPDATE,MESSAGES_DELETE,SEND_MESSAGE,CONNECTION_UPDATE,QRCODE_UPDATED \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true \
  -e WEBHOOK_GLOBAL_WEBHOOK_BASE64=false \
  atendai/evolution-api:latest
```

### Passo 2: Verificar se está rodando
```bash
docker ps | grep evolution-api
```

### Passo 3: Ver logs
```bash
docker logs -f evolution-api
```

---

## ⚙️ Configuração Simplificada (Mínima)

### Versão Mínima (só o essencial):
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=minha-chave-secreta-123 \
  atendai/evolution-api:latest
```

**Isso já funciona!** O resto é opcional.

---

## 🔑 Gerar Chave de API

A chave de API é o que você vai usar no `.env` do seu backend:

```bash
# Gere uma chave segura (exemplo)
openssl rand -hex 32
```

Ou use qualquer string aleatória:
```
minha-chave-super-secreta-123456
```

---

## 📝 Configurar Backend

No seu `.env` do backend:
```env
# Ativar Evolution API
USE_WUZAPI=true

# URL da Evolution API
WUZAPI_BASE_URL=http://localhost:8080

# Chave de API (mesma do Docker)
WUZAPI_API_KEY=minha-chave-secreta-123

# URL do webhook (deve ser acessível publicamente)
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi
```

---

## ✅ Testar

### 1. Verificar se Evolution API está rodando:
```bash
curl http://localhost:8080
```

### 2. Criar instância via API:
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: minha-chave-secreta-123" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "teste-1",
    "token": "minha-chave-secreta-123",
    "qrcode": true
  }'
```

### 3. Obter QR Code:
```bash
curl http://localhost:8080/instance/connect/teste-1 \
  -H "apikey: minha-chave-secreta-123"
```

---

## 🐛 Troubleshooting

### Evolution API não inicia:
```bash
# Ver logs
docker logs evolution-api

# Verificar porta
netstat -tulpn | grep 8080
```

### Erro de conexão:
- Verifique se porta 8080 está livre
- Verifique se Docker está rodando
- Verifique logs: `docker logs evolution-api`

### QR Code não aparece:
- Verifique se instância foi criada
- Verifique chave de API
- Veja logs do backend

---

## 🎯 Próximos Passos

1. ✅ Evolution API rodando
2. ✅ Configurar `.env` do backend
3. ✅ Reiniciar backend
4. ✅ Criar conexão WhatsApp no sistema
5. ✅ Escanear QR Code
6. ✅ Testar envio de mensagem
7. ✅ Testar menus interativos

---

## 📚 Documentação Completa

- **GitHub:** https://github.com/EvolutionAPI/evolution-api
- **Documentação:** https://doc.evolution-api.com

---

**Pronto!** Evolution API instalada e configurada! 🚀

