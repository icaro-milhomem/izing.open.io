# Passo a Passo: Instalar e Configurar Evolution API

## 🎯 Objetivo
Ter menus interativos nativos (botões e listas) funcionando no WhatsApp.

---

## 📋 Passo 1: Instalar Evolution API

### Com Docker (Recomendado):
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=minha-chave-secreta-123 \
  atendai/evolution-api:latest
```

**Gere uma chave segura:**
```bash
openssl rand -hex 32
```

**Anote essa chave!** Você vai usar no `.env` do backend.

---

## 📋 Passo 2: Verificar se está rodando

```bash
# Ver se container está rodando
docker ps | grep evolution-api

# Ver logs
docker logs evolution-api

# Testar API
curl http://localhost:8080
```

Se retornar algo, está funcionando! ✅

---

## 📋 Passo 3: Configurar Backend

### No arquivo `.env` do backend:
```env
# Ativar Evolution API
USE_WUZAPI=true

# URL da Evolution API
WUZAPI_BASE_URL=http://localhost:8080

# Chave de API (mesma do Docker)
WUZAPI_API_KEY=minha-chave-secreta-123

# URL do webhook (deve ser HTTPS em produção)
WUZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/wuzapi
# ou para teste local:
# WUZAPI_WEBHOOK_URL=http://seu-ip-publico:3000/webhooks/wuzapi
```

---

## 📋 Passo 4: Instalar Dependências

```bash
cd backend
npm install
```

Isso vai instalar `form-data` que é necessário.

---

## 📋 Passo 5: Reiniciar Backend

```bash
# Parar backend atual
# Reiniciar
npm run dev:server
# ou como você inicia normalmente
```

---

## 📋 Passo 6: Criar Conexão WhatsApp

1. Acesse seu sistema
2. Vá em "Conexões WhatsApp" ou similar
3. Clique em "Nova Conexão"
4. Escolha o tipo "WhatsApp"
5. Sistema vai criar instância na Evolution API
6. Aparecerá QR Code
7. Escaneie com WhatsApp
8. Aguarde conectar

---

## 📋 Passo 7: Testar

### Teste 1: Enviar mensagem de texto
- Envie uma mensagem de teste
- Verifique se chegou no WhatsApp

### Teste 2: Receber mensagem
- Envie mensagem do WhatsApp para o número conectado
- Verifique se apareceu no sistema

### Teste 3: Menu com botões
- Use a funcionalidade de menu com botões
- Verifique se botões aparecem no WhatsApp
- Clique em um botão
- Verifique se sistema recebeu a resposta

### Teste 4: Menu em lista
- Use a funcionalidade de menu em lista
- Verifique se lista aparece no WhatsApp
- Selecione uma opção
- Verifique se sistema recebeu

---

## 🐛 Troubleshooting

### Evolution API não inicia:
```bash
# Ver logs detalhados
docker logs -f evolution-api

# Verificar se porta está livre
netstat -tulpn | grep 8080

# Parar e remover
docker stop evolution-api
docker rm evolution-api

# Tentar novamente
```

### QR Code não aparece:
- Verifique se instância foi criada
- Verifique chave de API no `.env`
- Veja logs do backend
- Veja logs da Evolution API

### Mensagens não são enviadas:
- Verifique se instância está "open" (conectada)
- Verifique formato do número (só número, sem @c.us)
- Veja logs do backend
- Veja logs da Evolution API

### Webhook não recebe mensagens:
- Verifique se URL do webhook é acessível publicamente
- Para teste local, use ngrok ou similar
- Verifique se webhook foi configurado na Evolution API
- Veja logs do backend

---

## 🔧 Configuração Avançada (Opcional)

### Usar Redis (para múltiplas instâncias):
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave \
  -e REDIS_ENABLED=true \
  -e REDIS_URI=redis://localhost:6379 \
  atendai/evolution-api:latest
```

### Usar Banco de Dados:
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI=postgresql://user:pass@localhost:5432/evolution \
  atendai/evolution-api:latest
```

**Para começar, não precisa disso!** Configuração mínima já funciona.

---

## ✅ Checklist Final

- [ ] Evolution API rodando (porta 8080)
- [ ] `.env` configurado corretamente
- [ ] Dependências instaladas (`npm install`)
- [ ] Backend reiniciado
- [ ] Conexão WhatsApp criada
- [ ] QR Code escaneado e conectado
- [ ] Teste de envio funcionando
- [ ] Teste de recebimento funcionando
- [ ] Teste de botões funcionando
- [ ] Teste de lista funcionando

---

## 🎉 Pronto!

Agora você tem:
- ✅ Menus interativos nativos
- ✅ Botões clicáveis
- ✅ Listas interativas
- ✅ Tudo funcionando!

**Se algo der errado, me avise!** 🚀

