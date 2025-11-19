# Status da Migração WWebJS → WUZAPI

## ✅ Implementação Concluída

### Arquivos Criados

1. **`backend/src/libs/wuzapi.ts`**
   - Cliente HTTP para comunicação com WUZAPI
   - Métodos: createInstance, getQRCode, sendText, sendMedia, sendButtons, sendList, setWebhook

2. **`backend/src/libs/wuzapiSession.ts`**
   - Gerenciamento de sessões WUZAPI
   - Polling de QR Code e status de conexão
   - Configuração automática de webhooks

3. **`backend/src/controllers/WuzapiWebhookController.ts`**
   - Controller para receber webhooks do WUZAPI
   - Processa eventos: message, message.ack, connection.update

4. **`backend/src/services/WbotServices/helpers/HandleWuzapiMessage.ts`**
   - Processa mensagens recebidas via webhook
   - Adapta formato WUZAPI para formato interno

5. **`backend/src/services/WbotServices/helpers/VerifyContactWuzapi.ts`**
   - Verifica/cria contatos a partir de dados WUZAPI

6. **`backend/src/services/WbotServices/helpers/VerifyMessageWuzapi.ts`**
   - Processa mensagens de texto do WUZAPI

7. **`backend/src/services/WbotServices/helpers/VerifyMediaMessageWuzapi.ts`**
   - Processa mensagens de mídia do WUZAPI

8. **`backend/src/services/WbotServices/helpers/HandleWuzapiAck.ts`**
   - Processa confirmações de leitura (ACK)

### Arquivos Modificados

1. **`backend/src/services/WbotServices/SendWhatsAppMessage.ts`**
   - Adicionado suporte a WUZAPI (condicional via `USE_WUZAPI`)
   - Suporte a menus interativos (botões e listas)

2. **`backend/src/services/WbotServices/SendWhatsAppMedia.ts`**
   - Adicionado suporte a WUZAPI (condicional via `USE_WUZAPI`)

3. **`backend/src/services/WbotServices/StartWhatsAppSession.ts`**
   - Adicionada verificação de `USE_WUZAPI` para escolher entre WWebJS e WUZAPI

4. **`backend/src/routes/WebHooksRoutes.ts`**
   - Adicionada rota `/webhooks/wuzapi/:instanceId`

5. **`backend/package.json`**
   - Adicionada dependência `form-data`

6. **`backend/.env.example`**
   - Adicionadas variáveis de ambiente para WUZAPI

## 🔧 Configuração Necessária

### 1. Instalar WUZAPI

```bash
# Via Docker (recomendado)
docker run -d \
  --name wuzapi \
  -p 8080:8080 \
  -v $(pwd)/wuzapi-data:/app/data \
  ghcr.io/cod3r-company/wuzapi:latest
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env`:

```env
# Ativar WUZAPI
USE_WUZAPI=true

# URL base do WUZAPI
WUZAPI_BASE_URL=http://localhost:8080

# Chave de API do WUZAPI
WUZAPI_API_KEY=sua-chave-api-aqui

# URL do webhook (deve ser acessível publicamente)
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi
```

### 3. Instalar Dependências

```bash
cd backend
npm install
```

## 🚀 Como Ativar

1. **Instale e configure o WUZAPI** (veja acima)

2. **Configure as variáveis de ambiente** no `.env`

3. **Reinicie o backend**

4. **Crie uma nova conexão WhatsApp** no sistema - ela usará WUZAPI automaticamente

## 🔄 Rollback

Para voltar ao WWebJS, simplesmente:

1. Remova ou comente `USE_WUZAPI=true` no `.env`
2. Reinicie o backend

O código WWebJS original permanece intacto e funcionando.

## 📝 Próximos Passos

1. **Testar conexão**: Criar instância e conectar WhatsApp
2. **Testar envio**: Enviar mensagens de texto e mídia
3. **Testar recebimento**: Verificar se webhooks estão funcionando
4. **Testar menus**: Enviar botões e listas interativas
5. **Monitorar logs**: Verificar se há erros

## ⚠️ Observações Importantes

- O sistema funciona em **modo híbrido**: você pode ter algumas conexões com WWebJS e outras com WUZAPI
- A migração é **gradual**: ative `USE_WUZAPI=true` apenas quando estiver pronto
- **Webhook precisa ser HTTPS** em produção (WhatsApp exige)
- Mantenha o código WWebJS por algumas semanas para facilitar rollback se necessário

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se WUZAPI está rodando: `curl http://localhost:8080/health`
- Verifique logs: `docker logs wuzapi`
- Confirme que `WUZAPI_API_KEY` está correto

### Webhook não recebe mensagens
- Verifique se a URL do webhook está acessível publicamente
- Teste manualmente: `curl -X POST http://seu-dominio.com/webhooks/wuzapi/test`
- Verifique logs do backend para erros

### Mensagens não são enviadas
- Verifique status da instância: deve estar "open"
- Confirme formato do número (apenas número, sem @c.us)
- Verifique logs do WUZAPI

---

**Data da implementação:** 2024
**Status:** ✅ Pronto para testes

