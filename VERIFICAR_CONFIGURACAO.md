# Verificar Configuração - Checklist

## ✅ O Que Está Configurado

### 1. Arquivo .env
**Localização:** `/home/deploy/izing.open.io/backend/.env`

**Status:** ✅ Criado e configurado com 70 variáveis

---

## 📋 Variáveis Configuradas

### ✅ Banco de Dados (PostgreSQL)
```
POSTGRES_HOST=localhost
DB_PORT=5432
POSTGRES_DB=izing
POSTGRES_USER=izing
POSTGRES_PASSWORD=123@mudar
DB_DIALECT=postgres
DB_TIMEZONE=-03:00
```

### ✅ Servidor
```
PORT=3100
NODE_ENV=development
BACKEND_URL=http://localhost:3100
FRONTEND_URL=http://localhost:3001
```

### ✅ Segurança (JWT)
```
JWT_SECRET=uxNEiDw0g9tNpBdSjPOt1GRVYn6Q9/F6oDPringJcoI=
JWT_REFRESH_SECRET=OUOggyfjTxdo3EgDZy8DBbslYHV7f2L+2E8sf65nAcs=
```

### ✅ Redis
```
IO_REDIS_SERVER=localhost
IO_REDIS_PORT=6379
IO_REDIS_DB_SESSION=2
IO_REDIS_PASSWORD=123@mudar
REDIS_HOST=localhost
REDIS_PORT=6379
```

### ✅ Chrome (WhatsApp)
```
CHROME_BIN=/usr/bin/google-chrome
```

### ✅ RabbitMQ
```
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=123@mudar
AMQP_URL=amqp://admin:123@mudar@localhost:5672?connection_attempts=5&retry_delay=5
```

### ✅ Outros
```
ADMIN_DOMAIN=izing.io
USER_LIMIT=99
CONNECTIONS_LIMIT=99
```

---

## 🔍 Como Verificar

### Ver conteúdo do .env:
```bash
cd /home/deploy/izing.open.io/backend
cat .env
```

### Ver apenas variáveis importantes:
```bash
cd /home/deploy/izing.open.io/backend
grep -E "^POSTGRES_|^PORT=|^JWT_|^CHROME_BIN" .env
```

### Verificar se arquivo existe:
```bash
ls -la /home/deploy/izing.open.io/backend/.env
```

---

## ⚠️ Importante

**O arquivo `.env` está em:**
```
/home/deploy/izing.open.io/backend/.env
```

**NÃO é o `.env.example`!** O `.env.example` é só um template.

---

## 🧪 Testar Configuração

### 1. Verificar se backend lê o .env:
```bash
cd /home/deploy/izing.open.io/backend
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('DB:', process.env.POSTGRES_DB);"
```

### 2. Tentar iniciar backend:
```bash
cd /home/deploy/izing.open.io/backend
npm run dev:server
```

**Se aparecer erro, me mostre o erro!**

---

## 📝 Se Ainda Não Estiver Configurado

Execute:
```bash
cd /home/deploy/izing.open.io/backend
cat .env
```

**Me mostre o que aparece!** Assim vejo o que falta.

---

## ✅ Resumo

- ✅ Arquivo `.env` criado
- ✅ 70 variáveis configuradas
- ✅ Banco de dados configurado
- ✅ Servidor configurado
- ✅ Segurança configurada
- ✅ Redis configurado
- ✅ Chrome configurado

**Tudo está configurado!** 🎉

