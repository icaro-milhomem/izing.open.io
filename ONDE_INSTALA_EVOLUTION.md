# Onde Fica Instalado a Evolution API ou WUZAPI?

## 🎯 Resposta Rápida

**Depende de como você instala:**

1. **Docker (recomendado):** Fica dentro do container Docker
2. **Binário direto:** Fica na pasta que você escolher

---

## 📁 Opção 1: Docker (Recomendado)

### Onde fica:
```
Sua Máquina:
├── /var/lib/docker/containers/  ← Docker gerencia aqui
│   └── evolution-api/           ← Arquivos do container
│
└── /home/deploy/izing.open.io/  ← Seu projeto
    ├── backend/
    └── frontend/
```

**Você NÃO precisa se preocupar onde fica!** Docker gerencia tudo.

### Como instalar:
```bash
# Roda e pronto - Docker cuida de tudo
docker run -d --name evolution-api -p 8080:8080 \
  atendai/evolution-api:latest
```

**Vantagens:**
- ✅ Não precisa escolher pasta
- ✅ Não precisa configurar nada
- ✅ Fácil de remover depois
- ✅ Isolado do resto do sistema

---

## 📁 Opção 2: Binário Direto

### Onde fica (você escolhe):

#### Opção A: Na pasta do seu projeto
```
/home/deploy/izing.open.io/
├── backend/
├── frontend/
└── evolution-api/          ← Você cria esta pasta
    ├── evolution-api       ← Binário executável
    ├── data/               ← Dados (sessões, etc)
    └── .env                ← Configurações
```

#### Opção B: Em pasta separada (recomendado)
```
/home/deploy/
├── izing.open.io/          ← Seu projeto
│   ├── backend/
│   └── frontend/
│
└── evolution-api/          ← Evolution API separada
    ├── evolution-api       ← Binário
    ├── data/
    └── .env
```

#### Opção C: Em /opt (padrão Linux)
```
/opt/evolution-api/         ← Padrão para aplicações
├── evolution-api
├── data/
└── .env
```

---

## 🔧 Instalação Binário Direto (Passo a Passo)

### 1. Criar pasta:
```bash
# Opção recomendada: pasta separada
mkdir -p /home/deploy/evolution-api
cd /home/deploy/evolution-api
```

### 2. Baixar binário:
```bash
# Baixar do GitHub
wget https://github.com/EvolutionAPI/evolution-api/releases/...
# ou
curl -L https://... -o evolution-api
```

### 3. Dar permissão:
```bash
chmod +x evolution-api
```

### 4. Criar estrutura:
```bash
mkdir -p data
touch .env
```

### 5. Configurar .env:
```bash
nano .env
# Adicionar configurações
```

### 6. Rodar:
```bash
./evolution-api
```

---

## 📊 Comparação

| Aspecto | Docker | Binário Direto |
|---------|--------|---------------|
| **Onde fica?** | Docker gerencia | Você escolhe |
| **Facilidade** | ⭐⭐⭐⭐⭐ Muito fácil | ⭐⭐⭐ Média |
| **Controle** | ⭐⭐⭐ Limitado | ⭐⭐⭐⭐⭐ Total |
| **Isolamento** | ⭐⭐⭐⭐⭐ Total | ⭐⭐⭐ Médio |
| **Remoção** | ⭐⭐⭐⭐⭐ Fácil | ⭐⭐⭐ Média |

---

## 🎯 Recomendação

### Para a maioria: **Docker** ✅

**Por quê?**
- Não precisa se preocupar onde fica
- Mais fácil de gerenciar
- Isolado do resto
- Fácil de remover

### Use binário se:
- Não tem Docker
- Quer controle total
- Prefere gerenciar manualmente

---

## 📁 Estrutura Completa (Exemplo)

### Com Docker:
```
/home/deploy/izing.open.io/
├── backend/                    ← Seu backend
│   ├── src/
│   ├── package.json
│   └── .env                    ← Configura Evolution API aqui
│
└── [Docker gerencia Evolution API]
    └── /var/lib/docker/...     ← Você não mexe aqui
```

### Com Binário (pasta separada):
```
/home/deploy/
├── izing.open.io/              ← Seu projeto
│   ├── backend/
│   │   └── .env                ← Aponta para Evolution API
│   └── frontend/
│
└── evolution-api/               ← Evolution API
    ├── evolution-api            ← Executável
    ├── data/                    ← Sessões WhatsApp
    │   └── instances/
    ├── .env                     ← Configurações
    └── logs/                    ← Logs
```

---

## 🔗 Como Seu Backend Encontra

### No seu `.env` do backend:
```env
# Se Evolution API está no mesmo servidor
WUZAPI_BASE_URL=http://localhost:8080

# Se Evolution API está em outro servidor
WUZAPI_BASE_URL=http://192.168.1.100:8080

# Se Evolution API tem domínio
WUZAPI_BASE_URL=https://evolution-api.seudominio.com
```

**Seu backend só precisa saber a URL, não onde está instalado!**

---

## 💾 O Que Fica Onde

### Evolution API armazena:

1. **Sessões WhatsApp:**
   - Docker: Dentro do container
   - Binário: Na pasta `data/instances/`

2. **Logs:**
   - Docker: `docker logs evolution-api`
   - Binário: Pasta `logs/` ou stdout

3. **Configurações:**
   - Docker: Variáveis de ambiente
   - Binário: Arquivo `.env`

---

## 🗑️ Como Remover Depois

### Docker:
```bash
# Parar
docker stop evolution-api

# Remover
docker rm evolution-api

# Remover imagem (opcional)
docker rmi atendai/evolution-api
```

**Pronto!** Tudo removido.

### Binário:
```bash
# Parar processo
pkill evolution-api

# Remover pasta
rm -rf /home/deploy/evolution-api
```

---

## 🎯 Resumo Visual

### Docker:
```
Sua Máquina
│
├── Seu Projeto (/home/deploy/izing.open.io)
│   └── backend/
│
└── Docker (/var/lib/docker)
    └── evolution-api (gerenciado pelo Docker)
```

### Binário:
```
Sua Máquina
│
├── Seu Projeto (/home/deploy/izing.open.io)
│   └── backend/
│
└── Evolution API (/home/deploy/evolution-api)
    └── evolution-api (você gerencia)
```

---

## ✅ Checklist

- [ ] **Docker:** Fica em `/var/lib/docker/` (gerenciado)
- [ ] **Binário:** Você escolhe a pasta
- [ ] **Recomendado:** Docker (mais fácil)
- [ ] **Backend:** Só precisa da URL, não do caminho

---

## 💡 Conclusão

**Onde fica instalado:**

- **Docker:** Docker gerencia (você não precisa saber onde)
- **Binário:** Você escolhe a pasta (recomendo separada)

**Recomendação:** Use Docker - é mais fácil e você não precisa se preocupar onde fica! 🐳

