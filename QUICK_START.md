# Quick Start - Instalação Rápida

## 🚀 Instalação Automatizada

### Opção 1: Script Automático (Recomendado)
```bash
bash install.sh
```

**Isso instala todas as dependências automaticamente!**

---

## 📋 Instalação Manual (Passo a Passo)

### 1. Instalar Dependências Backend
```bash
cd backend
npm install
```

### 2. Instalar Dependências Frontend
```bash
cd frontend
npm install
```

### 3. Configurar .env
```bash
# Backend
cd backend
cp .env.example .env
nano .env  # Editar com suas configurações

# Frontend
cd frontend
cp .env.example .env
nano .env  # Editar com suas configurações
```

### 4. Configurar Banco de Dados
```bash
# Criar banco PostgreSQL
sudo -u postgres psql
CREATE DATABASE izing_db;
\q
```

### 5. Rodar Migrações
```bash
cd backend
npm run db:migrate
```

### 6. Compilar Backend
```bash
cd backend
npm run build
```

### 7. Iniciar Serviços

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run serve
```

---

## ✅ Verificar se Funcionou

1. **Backend:** http://localhost:3000
2. **Frontend:** http://localhost:3001

---

## 🐛 Problemas Comuns

### Erro ao instalar:
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de permissão:
```bash
# Dar permissão ao script
chmod +x install.sh
```

### Porta em uso:
```bash
# Ver o que está usando
sudo lsof -i :3000
sudo lsof -i :3001
```

---

## 📚 Documentação Completa

Consulte `INSTALACAO_COMPLETA_PROJETO.md` para guia detalhado!

---

**Pronto para começar!** 🎉

