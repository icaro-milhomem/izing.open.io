# Arquitetura Simples: Como Funciona

## 🏗️ Estrutura Atual

### ANTES (só WWebJS):
```
┌─────────────────┐
│  Seu Backend   │  ← Seu sistema (Node.js)
│  (Porta 3000)  │
└────────┬───────┘
         │
         ▼
    ┌─────────┐
    │ WWebJS  │  ← Biblioteca dentro do seu backend
    │ Chrome  │  ← Roda dentro do seu processo
    └─────────┘
```

**Total:** 1 processo (seu backend)

---

### AGORA (com WUZAPI/Evolution):
```
┌─────────────────┐         HTTP         ┌──────────────┐
│  Seu Backend   │◄─────────────────────►│  Evolution   │
│  (Porta 3000)  │                       │  API        │
│                │                       │ (Porta 8080) │
└────────────────┘                       └──────────────┘
```

**Total:** 2 processos
1. Seu backend (já existe)
2. Evolution API (novo, precisa rodar)

---

## 🤔 Precisa de Docker?

### Opção 1: COM Docker (Mais Fácil) ✅
```bash
docker run -d --name evolution-api -p 8080:8080 \
  atendai/evolution-api:latest
```

**Vantagens:**
- ✅ Instalação em 1 comando
- ✅ Não precisa configurar nada
- ✅ Funciona em qualquer sistema

**Desvantagens:**
- ❌ Precisa ter Docker instalado

---

### Opção 2: SEM Docker (Direto) ✅
```bash
# Baixar binário
wget https://github.com/EvolutionAPI/evolution-api/releases/...

# Executar
./evolution-api
```

**Vantagens:**
- ✅ Não precisa Docker
- ✅ Mais controle

**Desvantagens:**
- ❌ Mais complexo de instalar
- ❌ Precisa configurar manualmente

---

## 🎯 Resposta Direta

### Quantas APIs?
**2 processos rodando:**
1. Seu backend (Node.js) - já existe
2. Evolution API (Go) - novo, precisa rodar

### Precisa Docker?
**NÃO obrigatório**, mas **recomendado** porque:
- É mais fácil
- Funciona igual
- Menos problemas

### Pode rodar direto?
**SIM!** Pode rodar sem Docker, mas é mais trabalhoso.

---

## 📋 Como Fica na Prática

### Cenário 1: Com Docker (Recomendado)
```bash
# Terminal 1: Seu backend (como sempre)
cd backend
npm run dev:server

# Terminal 2: Evolution API (novo)
docker run -d --name evolution-api -p 8080:8080 \
  atendai/evolution-api:latest
```

**Resultado:**
- Backend rodando na porta 3000
- Evolution API rodando na porta 8080
- Eles conversam via HTTP

---

### Cenário 2: Sem Docker
```bash
# Terminal 1: Seu backend (como sempre)
cd backend
npm run dev:server

# Terminal 2: Evolution API (novo)
# Baixar binário e executar
./evolution-api
```

**Resultado:**
- Mesma coisa, mas sem Docker

---

## 🔄 Fluxo de uma Mensagem

### ENVIAR:
```
1. Você clica "Enviar" no sistema
   ↓
2. Seu Backend recebe
   ↓
3. Backend envia HTTP para Evolution API
   POST http://localhost:8080/message/sendText
   ↓
4. Evolution API envia para WhatsApp
   ↓
5. Mensagem chega no WhatsApp
```

### RECEBER:
```
1. Alguém envia mensagem no WhatsApp
   ↓
2. Evolution API recebe
   ↓
3. Evolution API envia webhook para seu Backend
   POST http://seu-backend.com/webhooks/evolution
   ↓
4. Backend processa e salva
   ↓
5. Aparece no chat
```

---

## ⚙️ Configuração

### No seu .env:
```env
# Ativar Evolution API
USE_WUZAPI=true  # ou USE_EVOLUTION_API=true

# URL da Evolution API (rodando no mesmo servidor ou outro)
WUZAPI_BASE_URL=http://localhost:8080

# Chave de API (gerada pela Evolution)
WUZAPI_API_KEY=sua-chave
```

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────┐
│         SEU SERVIDOR                     │
│                                          │
│  ┌──────────────┐      ┌──────────────┐ │
│  │   Backend    │ HTTP │  Evolution   │ │
│  │  (Node.js)   │◄────►│  API (Go)    │ │
│  │  Porta 3000  │      │  Porta 8080  │ │
│  └──────────────┘      └──────┬───────┘ │
│                               │          │
└───────────────────────────────┼──────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │   WhatsApp   │
                        └──────────────┘
```

---

## ✅ Checklist

- [ ] Instalar Evolution API (Docker ou binário)
- [ ] Configurar .env com URL da Evolution
- [ ] Iniciar Evolution API
- [ ] Iniciar seu Backend
- [ ] Testar conexão

---

## 🆘 Dúvidas Comuns

### "Preciso de 2 servidores?"
**NÃO!** Os 2 processos podem rodar no mesmo servidor.

### "Evolution API consome muito?"
**NÃO!** É leve, consome menos que Chrome do WWebJS.

### "E se eu não quiser usar Evolution?"
**OK!** Só não configure `USE_WUZAPI=true` e continua usando WWebJS.

### "Posso rodar Evolution em outro servidor?"
**SIM!** Só mudar `WUZAPI_BASE_URL` para o IP do outro servidor.

---

## 🎯 Conclusão

- **2 processos:** Seu backend + Evolution API
- **Docker:** Recomendado, mas não obrigatório
- **Mesmo servidor:** Pode rodar tudo junto
- **Funciona igual:** Com ou sem Docker

**É só mais um serviço rodando junto com seu backend!** 🚀

