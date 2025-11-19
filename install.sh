#!/bin/bash

# Script de Instalação Completa - Izing Open.io
# Execute: bash install.sh

set -e

echo "🚀 Iniciando instalação do Izing Open.io..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado! Instale Node.js 20+ primeiro.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js versão 20+ é necessário. Versão atual: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) encontrado${NC}"

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) encontrado${NC}"

# Verificar PostgreSQL
echo "📦 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL não encontrado. Você precisará instalá-lo manualmente.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL encontrado${NC}"
fi

# Verificar se está no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto!${NC}"
    exit 1
fi

echo ""
echo "📋 Passo 1: Instalando dependências do backend..."
cd backend
npm install
echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"

echo ""
echo "📋 Passo 2: Verificando arquivo .env do backend..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Copiando .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo backend/.env com suas configurações!${NC}"
    else
        echo -e "${RED}❌ Arquivo .env.example não encontrado!${NC}"
    fi
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

echo ""
echo "📋 Passo 3: Instalando dependências do frontend..."
cd ../frontend
npm install
echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"

echo ""
echo "📋 Passo 4: Verificando arquivo .env do frontend..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Copiando .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo frontend/.env com suas configurações!${NC}"
    else
        echo -e "${YELLOW}⚠️  Arquivo .env.example não encontrado no frontend${NC}"
    fi
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Instalação de dependências concluída!${NC}"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure o banco de dados PostgreSQL:"
echo "   - Crie o banco de dados"
echo "   - Configure as credenciais em backend/.env"
echo ""
echo "2. Configure as variáveis de ambiente:"
echo "   - Edite backend/.env"
echo "   - Edite frontend/.env"
echo ""
echo "3. Execute as migrações:"
echo "   cd backend"
echo "   npm run db:migrate"
echo ""
echo "4. (Opcional) Execute os seeds:"
echo "   cd backend"
echo "   npm run db:seed"
echo ""
echo "5. Compile o backend:"
echo "   cd backend"
echo "   npm run build"
echo ""
echo "6. Inicie os serviços:"
echo "   Terminal 1: cd backend && npm run dev:server"
echo "   Terminal 2: cd frontend && npm run serve"
echo ""
echo "📚 Consulte INSTALACAO_COMPLETA_PROJETO.md para guia detalhado!"
echo ""

