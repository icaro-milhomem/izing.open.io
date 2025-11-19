#!/bin/bash

# Script de Configuração PM2 e Nginx
# Execute: bash setup-pm2-nginx.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Configurando PM2 e Nginx..."

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 não encontrado. Instalando...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✅ PM2 encontrado: $(pm2 --version)${NC}"

# Criar pasta de logs
mkdir -p /home/deploy/izing.open.io/logs
echo -e "${GREEN}✅ Pasta logs criada${NC}"

# Compilar backend se necessário
if [ ! -d "/home/deploy/izing.open.io/backend/dist" ]; then
    echo -e "${YELLOW}⚠️  Compilando backend...${NC}"
    cd /home/deploy/izing.open.io/backend
    npm run build
fi

echo -e "${GREEN}✅ Backend compilado${NC}"

# Verificar se já está rodando
if pm2 list | grep -q "izing-backend"; then
    echo -e "${YELLOW}⚠️  Aplicações já estão rodando no PM2${NC}"
    echo "Deseja reiniciar? (s/n)"
    read -r resposta
    if [ "$resposta" = "s" ]; then
        pm2 restart ecosystem.config.js
        echo -e "${GREEN}✅ Aplicações reiniciadas${NC}"
    fi
else
    # Iniciar com PM2
    cd /home/deploy/izing.open.io
    pm2 start ecosystem.config.js
    echo -e "${GREEN}✅ Aplicações iniciadas no PM2${NC}"
fi

# Salvar configuração PM2
pm2 save
echo -e "${GREEN}✅ Configuração PM2 salva${NC}"

# Configurar startup (se não estiver)
if ! pm2 startup | grep -q "already"; then
    echo -e "${YELLOW}⚠️  Execute o comando abaixo com sudo:${NC}"
    pm2 startup
fi

echo ""
echo -e "${GREEN}✅ PM2 configurado!${NC}"
echo ""
echo "📋 Comandos úteis:"
echo "  pm2 status          - Ver status"
echo "  pm2 logs            - Ver logs"
echo "  pm2 restart all     - Reiniciar tudo"
echo "  pm2 stop all        - Parar tudo"
echo ""

# Verificar Nginx
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx encontrado${NC}"
    echo ""
    echo "📋 Para configurar Nginx:"
    echo "  1. Edite nginx.conf com seu domínio"
    echo "  2. sudo cp nginx.conf /etc/nginx/sites-available/izing"
    echo "  3. sudo ln -s /etc/nginx/sites-available/izing /etc/nginx/sites-enabled/"
    echo "  4. sudo nginx -t"
    echo "  5. sudo systemctl reload nginx"
else
    echo -e "${YELLOW}⚠️  Nginx não encontrado${NC}"
    echo "Instale com: sudo apt install nginx -y"
fi

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"

