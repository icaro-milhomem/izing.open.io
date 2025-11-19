# O Que Roda Onde? E O Que Será Deletado?

## 🎯 Respostas Diretas

### 1. Evolution API roda na sua máquina?
**SIM!** Pode rodar na mesma máquina do seu backend (mais comum).

### 2. WWebJS será deletado?
**NÃO!** Fica instalado. O sistema escolhe qual usar.

---

## 🖥️ O Que Roda na Sua Máquina

### ANTES (só WWebJS):
```
Sua Máquina:
┌─────────────────────────────┐
│  Backend (Node.js)          │
│  - Seu código               │
│  - whatsapp-web.js          │ ← Dentro do processo
│  - Chrome/Puppeteer         │ ← Dentro do processo
└─────────────────────────────┘

Total: 1 processo rodando
```

### AGORA (com Evolution API):
```
Sua Máquina:
┌─────────────────────────────┐
│  Backend (Node.js)          │
│  - Seu código               │
│  - whatsapp-web.js          │ ← Ainda instalado (não usado)
└─────────────────────────────┘
         │
         │ HTTP
         ▼
┌─────────────────────────────┐
│  Evolution API (Docker/Go)  │ ← NOVO processo
│  - Gerencia WhatsApp        │
│  - Porta 8080               │
└─────────────────────────────┘

Total: 2 processos rodando
```

---

## 📦 O Que Será Deletado?

### ❌ NADA será deletado automaticamente!

**O que acontece:**

1. **whatsapp-web.js** → Fica instalado, mas não é usado
2. **Chrome/Puppeteer** → Fica instalado, mas não é usado
3. **Evolution API** → Novo, roda junto

**Por quê não deletar?**
- ✅ Você pode voltar ao WWebJS se quiser
- ✅ Migração gradual e segura
- ✅ Testa Evolution API sem perder WWebJS

---

## 🔄 Como Funciona a Escolha

### No seu `.env`:
```env
# Se estiver assim:
USE_WUZAPI=false
# ou não existir
```
→ Sistema usa **WWebJS** (como antes)

```env
# Se estiver assim:
USE_WUZAPI=true
```
→ Sistema usa **Evolution API** (novo)

**O código detecta automaticamente qual usar!**

---

## 🗑️ Se Você QUISER Deletar WWebJS

### Depois de testar e confirmar que Evolution API funciona:

1. **Remover do package.json:**
```bash
cd backend
npm uninstall whatsapp-web.js
```

2. **Remover pastas de sessão:**
```bash
rm -rf .wwebjs_auth
```

3. **Remover código WWebJS:**
- Opcional, pode deixar comentado

**Mas NÃO precisa fazer isso agora!** Deixe para depois de testar.

---

## 📊 Comparação Visual

### ANTES:
```
Sua Máquina:
┌──────────────────────┐
│  Backend             │
│  └─ WWebJS           │ ← Usado
└──────────────────────┘
```

### AGORA (com USE_WUZAPI=true):
```
Sua Máquina:
┌──────────────────────┐
│  Backend             │
│  └─ WWebJS           │ ← Instalado, mas NÃO usado
└──────────────────────┘
         │
         │ HTTP
         ▼
┌──────────────────────┐
│  Evolution API       │ ← Usado agora
└──────────────────────┘
```

### Se voltar (USE_WUZAPI=false):
```
Sua Máquina:
┌──────────────────────┐
│  Backend             │
│  └─ WWebJS           │ ← Usado de novo
└──────────────────────┘
```

---

## 💾 Espaço em Disco

### O que ocupa espaço:

1. **whatsapp-web.js** (não usado): ~50-100 MB
2. **Chrome/Puppeteer** (não usado): ~200-300 MB
3. **Evolution API** (usado): ~100-200 MB

**Total adicional:** ~100-200 MB (só Evolution API)

**WWebJS continua ocupando espaço, mas não é usado quando `USE_WUZAPI=true`**

---

## 🎯 Resumo Prático

### O que roda na sua máquina:
- ✅ Backend (sempre)
- ✅ Evolution API (quando `USE_WUZAPI=true`)
- ✅ WWebJS (instalado, mas não usado quando Evolution está ativo)

### O que será deletado:
- ❌ **NADA automaticamente**
- ✅ Você pode deletar WWebJS depois, se quiser

### Como escolher:
- `USE_WUZAPI=false` → Usa WWebJS
- `USE_WUZAPI=true` → Usa Evolution API

---

## 🚀 Recomendação

### Fase 1: Testar (AGORA)
```
✅ Instalar Evolution API
✅ Configurar USE_WUZAPI=true
✅ Testar tudo
✅ WWebJS fica instalado (backup)
```

### Fase 2: Depois de confirmar (FUTURO)
```
✅ Se tudo funcionar bem
✅ Remover WWebJS (opcional)
✅ Liberar espaço em disco
```

**Não precisa ter pressa!** Deixe WWebJS instalado até ter certeza que Evolution API funciona perfeitamente.

---

## ✅ Checklist

- [ ] Evolution API vai rodar na mesma máquina? **SIM**
- [ ] WWebJS será deletado? **NÃO automaticamente**
- [ ] Posso voltar ao WWebJS? **SIM, só mudar .env**
- [ ] Vai ocupar mais espaço? **SIM, ~100-200 MB (Evolution)**
- [ ] WWebJS continua ocupando espaço? **SIM, mas não é usado**

---

## 💡 Conclusão

**O que roda na sua máquina:**
- Backend (sempre)
- Evolution API (quando ativada)
- WWebJS (instalado, mas não usado quando Evolution está ativa)

**O que será deletado:**
- **NADA automaticamente**
- Você pode deletar WWebJS depois, se quiser

**É uma migração gradual e segura!** 🎉

