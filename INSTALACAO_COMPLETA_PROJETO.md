# Instalação Completa do Projeto - Guia Passo a Passo

## 🎯 Objetivo
Instalar e testar o projeto completo antes de migrar para Evolution API.

---

## 📋 Pré-requisitos

### Verificar se tem instalado:
```bash
# Node.js (versão 20 ou superior)
node --version

# npm ou yarn
npm --version

# Docker (opcional, para Evolution API depois)
docker --version

# Git
git --version

# PostgreSQL (banco de dados)
psql --version
```

**Se não tiver algum, instale primeiro!**

---

## 📋 Passo 1: Clonar/Baixar Projeto

### Se já está no servidor:
```bash
cd /home/deploy/izing.open.io
```

### Se precisa clonar:
```bash
git clone https://github.com/seu-usuario/izing.open.io.git
cd izing.open.io
```

---

## 📋 Passo 2: Configurar Banco de Dados

### Criar banco PostgreSQL:
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco
CREATE DATABASE izing_db;

# Criar usuário (opcional)
CREATE USER izing_user WITH PASSWORD 'sua-senha';
GRANT ALL PRIVILEGES ON DATABASE izing_db TO izing_user;

# Sair
\q
```

### Configurar conexão no `.env`:
```bash
cd backend
cp .env.example .env
nano .env
```

**Adicionar:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=izing_db
DB_USER=izing_user
DB_PASS=sua-senha
```

---

## 📋 Passo 3: Instalar Dependências Backend

```bash
cd backend
npm install
```

**Aguarde instalar todas as dependências!**

---

## 📋 Passo 4: Configurar Variáveis de Ambiente Backend

### Editar `.env` do backend:
```bash
nano backend/.env
```

### Configurações mínimas necessárias:
```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=izing_db
DB_USER=izing_user
DB_PASS=sua-senha

# Servidor
PORT=3000
NODE_ENV=development

# JWT Secret (gere uma chave aleatória)
JWT_SECRET=sua-chave-jwt-secreta-aqui

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Redis (se usar)
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp (WWebJS - padrão)
# Não precisa configurar nada, usa padrão

# Evolution API (para depois, quando migrar)
# USE_WUZAPI=false  # Deixe false por enquanto
# WUZAPI_BASE_URL=http://localhost:8080
# WUZAPI_API_KEY=
```

**Salve o arquivo!**

---

## 📋 Passo 5: Rodar Migrações do Banco

```bash
cd backend
npm run db:migrate
```

**Isso cria todas as tabelas no banco!**

---

## 📋 Passo 6: Instalar Dependências Frontend

```bash
cd frontend
npm install
# ou
yarn install
```

**Aguarde instalar!**

---

## 📋 Passo 7: Configurar Frontend

### Criar `.env` do frontend:
```bash
cd frontend
cp .env.example .env
nano .env
```

### Configurações básicas:
```env
VUE_APP_API_URL=http://localhost:3000
```

---

## 📋 Passo 8: Compilar Backend

```bash
cd backend
npm run build
```

**Isso compila TypeScript para JavaScript!**

---

## 📋 Passo 9: Iniciar Serviços

### Terminal 1: Backend
```bash
cd backend
npm run dev:server
# ou
npm start
```

**Aguarde iniciar!** Deve aparecer algo como:
```
Server running on port 3000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run serve
# ou
npm run dev
```

**Aguarde iniciar!** Deve aparecer algo como:
```
App running at http://localhost:3001
```

---

## 📋 Passo 10: Testar Instalação

### 1. Acessar Frontend:
```
http://localhost:3001
```

### 2. Criar conta de administrador:
- Primeiro acesso geralmente pede para criar admin
- Ou verifique se tem seed/script de criação

### 3. Testar Login:
- Faça login com usuário admin
- Verifique se dashboard carrega

### 4. Testar Conexão WhatsApp:
- Vá em "Conexões" ou "WhatsApp"
- Clique em "Nova Conexão"
- Escolha tipo "WhatsApp"
- Deve aparecer QR Code
- Escaneie com WhatsApp
- Aguarde conectar

### 5. Testar Envio de Mensagem:
- Abra um ticket/chat
- Envie uma mensagem de teste
- Verifique se chegou no WhatsApp

### 6. Testar Recebimento:
- Envie mensagem do WhatsApp para o número conectado
- Verifique se apareceu no sistema

---

## 🐛 Troubleshooting

### Erro ao instalar dependências:
```bash
# Limpar cache
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de conexão com banco:
- Verifique se PostgreSQL está rodando: `sudo systemctl status postgresql`
- Verifique credenciais no `.env`
- Teste conexão: `psql -h localhost -U izing_user -d izing_db`

### Erro ao compilar backend:
```bash
# Verificar TypeScript
npx tsc --version

# Compilar com mais detalhes
npm run build -- --verbose
```

### Porta já em uso:
```bash
# Ver o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :3001

# Matar processo se necessário
kill -9 PID
```

### QR Code não aparece:
- Verifique logs do backend
- Verifique se Chrome/Puppeteer está instalado
- Verifique permissões da pasta `.wwebjs_auth`

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado (v20+)
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado
- [ ] `.env` do backend configurado
- [ ] Dependências do backend instaladas
- [ ] Migrações do banco rodadas
- [ ] Dependências do frontend instaladas
- [ ] `.env` do frontend configurado
- [ ] Backend compilado
- [ ] Backend rodando (porta 3000)
- [ ] Frontend rodando (porta 3001)
- [ ] Acesso ao frontend funcionando
- [ ] Login funcionando
- [ ] Conexão WhatsApp criada
- [ ] QR Code aparecendo
- [ ] WhatsApp conectado
- [ ] Envio de mensagem funcionando
- [ ] Recebimento de mensagem funcionando

---

## 🎯 Próximo Passo (Depois de Testar)

**Quando tudo estiver funcionando com WWebJS:**

1. ✅ Testar todas as funcionalidades
2. ✅ Confirmar que está tudo OK
3. ✅ Fazer backup do banco de dados
4. ✅ Aí sim migrar para Evolution API

**Não tenha pressa!** Teste bem antes de migrar.

---

## 📝 Comandos Úteis

### Ver logs do backend:
```bash
# Se usar PM2
pm2 logs

# Se usar npm
# Logs aparecem no terminal onde rodou
```

### Reiniciar backend:
```bash
# PM2
pm2 restart all

# npm
# Ctrl+C e rodar novamente
npm run dev:server
```

### Verificar processos:
```bash
# Ver processos Node
ps aux | grep node

# Ver processos na porta
sudo lsof -i :3000
```

### Backup do banco:
```bash
pg_dump -U izing_user -d izing_db > backup.sql
```

---

## 🚀 Resumo Rápido

```bash
# 1. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Configurar .env
# Editar backend/.env e frontend/.env

# 3. Rodar migrações
cd backend && npm run db:migrate

# 4. Compilar backend
cd backend && npm run build

# 5. Iniciar
# Terminal 1:
cd backend && npm run dev:server

# Terminal 2:
cd frontend && npm run serve
```

---

**Pronto!** Agora você tem o projeto completo instalado e funcionando! 🎉

**Teste tudo bem antes de migrar para Evolution API!**

