# Explicação Simples: Migração WWebJS → WUZAPI

## 🤔 O que mudou?

### ANTES (WWebJS):
```
Seu Sistema → whatsapp-web.js → Chrome/Puppeteer → WhatsApp
```
- Usa Chrome (navegador) rodando no servidor
- Consome muita memória
- Pode dar problemas de estabilidade
- Menus interativos (botões/listas) não funcionam bem

### AGORA (WUZAPI):
```
Seu Sistema → WUZAPI (API) → WhatsApp
```
- Não precisa de Chrome
- Mais estável
- Menus interativos funcionam nativamente
- Consome menos recursos

## 📦 O que foi adicionado?

### 1. Cliente para falar com WUZAPI
**Arquivo:** `backend/src/libs/wuzapi.ts`
- É como um "tradutor" que converte seus comandos em chamadas HTTP para o WUZAPI
- Envia mensagens, cria conexões, etc.

### 2. Gerenciamento de sessões
**Arquivo:** `backend/src/libs/wuzapiSession.ts`
- Cria conexões WhatsApp via WUZAPI
- Mostra QR Code para você escanear
- Verifica se está conectado

### 3. Recebimento de mensagens
**Arquivos:** 
- `WuzapiWebhookController.ts` - Recebe mensagens do WUZAPI
- `HandleWuzapiMessage.ts` - Processa as mensagens recebidas
- `VerifyMessageWuzapi.ts` - Salva mensagens de texto
- `VerifyMediaMessageWuzapi.ts` - Salva mídias (fotos, vídeos, etc)

### 4. Envio de mensagens
**Arquivos modificados:**
- `SendWhatsAppMessage.ts` - Agora pode enviar via WUZAPI OU WWebJS
- `SendWhatsAppMedia.ts` - Agora pode enviar mídia via WUZAPI OU WWebJS

## 🎛️ Como funciona na prática?

### Situação 1: Você NÃO configurou WUZAPI
```env
# .env vazio ou sem USE_WUZAPI
```
→ Sistema usa WWebJS normalmente (como antes)

### Situação 2: Você configurou WUZAPI
```env
USE_WUZAPI=true
WUZAPI_BASE_URL=http://localhost:8080
WUZAPI_API_KEY=sua-chave
```
→ Sistema usa WUZAPI automaticamente

## 🔄 Fluxo de uma mensagem

### ENVIAR MENSAGEM:
```
1. Você clica "Enviar" no sistema
2. Sistema verifica: USE_WUZAPI está true?
   - SIM → Envia via WUZAPI
   - NÃO → Envia via WWebJS (como antes)
3. Mensagem chega no WhatsApp
```

### RECEBER MENSAGEM:
```
1. Alguém envia mensagem no WhatsApp
2. WUZAPI recebe e envia webhook para seu sistema
3. Sistema processa e salva no banco
4. Aparece no chat
```

## 🚀 Como ativar?

### Passo 1: Instalar WUZAPI
```bash
docker run -d --name wuzapi -p 8080:8080 \
  ghcr.io/cod3r-company/wuzapi:latest
```

### Passo 2: Pegar a chave de API
- Acesse: http://localhost:8080
- Crie uma conta ou veja a documentação para pegar a API key

### Passo 3: Configurar .env
```env
USE_WUZAPI=true
WUZAPI_BASE_URL=http://localhost:8080
WUZAPI_API_KEY=abc123xyz  # sua chave aqui
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi
```

### Passo 4: Reiniciar
```bash
cd backend
npm install  # instala form-data
npm run dev:server  # ou como você inicia
```

### Passo 5: Criar conexão WhatsApp
- Vá no sistema
- Crie uma nova conexão WhatsApp
- Vai aparecer QR Code (agora vem do WUZAPI)
- Escaneie e conecte

## ❓ Perguntas Comuns

### "Preciso mudar algo no código?"
**NÃO!** O código já detecta automaticamente se deve usar WUZAPI ou WWebJS.

### "E se eu quiser voltar ao WWebJS?"
Simplesmente remova ou comente `USE_WUZAPI=true` no `.env` e reinicie.

### "Preciso remover o WWebJS?"
**NÃO!** Pode deixar instalado. O sistema escolhe qual usar.

### "Funciona junto com WWebJS?"
Sim! Você pode ter:
- Algumas conexões usando WWebJS
- Outras usando WUZAPI
- Basta configurar `USE_WUZAPI` por conexão (futuro) ou globalmente (agora)

### "O que acontece se WUZAPI cair?"
- Se `USE_WUZAPI=false`: continua funcionando com WWebJS
- Se `USE_WUZAPI=true`: as mensagens não vão funcionar até WUZAPI voltar

## 🎯 Resumo Visual

```
┌─────────────────┐
│  Seu Sistema    │
│   (Backend)     │
└────────┬────────┘
         │
         ├─ USE_WUZAPI=true? ──┐
         │                     │
         │ SIM                 │ NÃO
         ▼                     ▼
    ┌─────────┐          ┌──────────┐
    │ WUZAPI  │          │ WWebJS   │
    │ (API)   │          │ (Chrome) │
    └────┬────┘          └────┬─────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
            ┌─────────────┐
            │  WhatsApp   │
            └─────────────┘
```

## 📝 Checklist Rápido

- [ ] Instalar WUZAPI (Docker)
- [ ] Pegar API Key
- [ ] Adicionar variáveis no `.env`
- [ ] Rodar `npm install`
- [ ] Reiniciar backend
- [ ] Criar conexão WhatsApp
- [ ] Testar envio de mensagem
- [ ] Testar recebimento de mensagem

## 🆘 Precisa de ajuda?

1. **WUZAPI não inicia?**
   - Verifique: `docker ps` (deve mostrar wuzapi rodando)
   - Verifique logs: `docker logs wuzapi`

2. **QR Code não aparece?**
   - Verifique se `WUZAPI_BASE_URL` está correto
   - Verifique se `WUZAPI_API_KEY` está correto
   - Veja logs do backend

3. **Mensagens não chegam?**
   - Verifique se webhook está configurado
   - Verifique se URL do webhook é acessível publicamente
   - Veja logs do backend

---

**Em resumo:** O sistema agora pode usar WUZAPI OU WWebJS. Você escolhe qual usar através da variável `USE_WUZAPI` no `.env`. Tudo funciona automaticamente! 🎉

