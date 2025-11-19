# Configurar PM2 e Nginx (Proxy Reverso)

## 🎯 Objetivo
Configurar PM2 para gerenciar processos e Nginx como proxy reverso.

---

## 📋 Passo 1: Instalar PM2

```bash
npm install -g pm2
```

**Verificar instalação:**
```bash
pm2 --version
```

---

## 📋 Passo 2: Criar Pasta de Logs

```bash
cd /home/deploy/izing.open.io
mkdir -p logs
```

---

## 📋 Passo 3: Compilar Backend (se ainda não compilou)

```bash
cd /home/deploy/izing.open.io/backend
npm run build
```

---

## 📋 Passo 4: Iniciar com PM2

### Opção 1: Usar ecosystem.config.js (Recomendado)
```bash
cd /home/deploy/izing.open.io
pm2 start ecosystem.config.js
```

### Opção 2: Iniciar manualmente
```bash
# Backend
cd /home/deploy/izing.open.io/backend
pm2 start dist/server.js --name izing-backend --env production

# Frontend (se usar serve)
cd /home/deploy/izing.open.io/frontend
pm2 start npm --name izing-frontend -- run serve
```

---

## 📋 Passo 5: Comandos PM2 Úteis

### Ver status:
```bash
pm2 status
```

### Ver logs:
```bash
# Todos os logs
pm2 logs

# Logs específicos
pm2 logs izing-backend
pm2 logs izing-frontend
```

### Reiniciar:
```bash
pm2 restart all
pm2 restart izing-backend
```

### Parar:
```bash
pm2 stop all
pm2 stop izing-backend
```

### Deletar:
```bash
pm2 delete all
pm2 delete izing-backend
```

### Salvar configuração (iniciar no boot):
```bash
pm2 save
pm2 startup
# Execute o comando que aparecer (geralmente com sudo)
```

---

## 📋 Passo 6: Instalar Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

**Verificar se está rodando:**
```bash
sudo systemctl status nginx
```

---

## 📋 Passo 7: Configurar Nginx

### 1. Copiar configuração:
```bash
sudo cp /home/deploy/izing.open.io/nginx.conf /etc/nginx/sites-available/izing
```

### 2. Editar configuração:
```bash
sudo nano /etc/nginx/sites-available/izing
```

**Ajustar:**
- `seu-dominio.com` → seu domínio real
- Caminhos dos certificados SSL (se usar HTTPS)

### 3. Criar link simbólico:
```bash
sudo ln -s /etc/nginx/sites-available/izing /etc/nginx/sites-enabled/
```

### 4. Remover default (opcional):
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 5. Testar configuração:
```bash
sudo nginx -t
```

### 6. Recarregar Nginx:
```bash
sudo systemctl reload nginx
```

---

## 📋 Passo 8: Configurar SSL (Opcional - Let's Encrypt)

### Instalar Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obter certificado:
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

**Siga as instruções!**

### Renovação automática:
```bash
sudo certbot renew --dry-run
```

---

## 📋 Passo 9: Configuração HTTP Simples (Sem SSL)

Se não quiser usar HTTPS ainda, edite o nginx.conf:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

---

## ✅ Checklist

- [ ] PM2 instalado
- [ ] Pasta logs criada
- [ ] Backend compilado
- [ ] PM2 iniciado (backend e frontend)
- [ ] PM2 salvo (`pm2 save`)
- [ ] PM2 startup configurado
- [ ] Nginx instalado
- [ ] Configuração Nginx criada
- [ ] Nginx testado (`nginx -t`)
- [ ] Nginx recarregado
- [ ] SSL configurado (se usar HTTPS)
- [ ] Domínio apontando para servidor

---

## 🐛 Troubleshooting

### PM2 não inicia:
```bash
# Ver logs
pm2 logs

# Verificar se porta está livre
sudo lsof -i :3100
sudo lsof -i :3001
```

### Nginx não inicia:
```bash
# Verificar erros
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### 502 Bad Gateway:
- Verificar se backend/frontend estão rodando: `pm2 status`
- Verificar se portas estão corretas no nginx.conf
- Verificar logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

### Socket.io não funciona:
- Verificar se WebSocket está configurado no Nginx
- Verificar se `/socket.io` está no proxy_pass

---

## 🚀 Comandos Rápidos

### Iniciar tudo:
```bash
cd /home/deploy/izing.open.io
pm2 start ecosystem.config.js
pm2 save
```

### Parar tudo:
```bash
pm2 stop all
```

### Reiniciar tudo:
```bash
pm2 restart all
```

### Ver status:
```bash
pm2 status
pm2 logs
```

### Recarregar Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📝 Arquivos Criados

1. `ecosystem.config.js` - Configuração PM2
2. `nginx.conf` - Configuração Nginx
3. `logs/` - Pasta de logs (criar manualmente)

---

**Pronto!** Agora você tem PM2 gerenciando os processos e Nginx como proxy reverso! 🎉

