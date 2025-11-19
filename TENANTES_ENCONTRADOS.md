# 📊 Tenantes Encontrados no Sistema

## 📋 Resumo

**Total de Tenantes:** 3

---

## 🏢 Detalhes dos Tenantes

### **Tenant 1: Empresa 01**
- **ID:** 1
- **Nome:** Empresa 01
- **Status:** active
- **Owner ID:** (não definido)
- **Limites:**
  - Max Users: 99
  - Max Connections: 99
- **Criado em:** 2021-03-10 14:28:29
- **Estatísticas:**
  - Usuários: 0
  - Conexões WhatsApp: 0
  - Tickets: 0

---

### **Tenant 2: Econect** ⭐
- **ID:** 2
- **Nome:** Econect
- **Status:** active
- **Owner ID:** (não definido)
- **Limites:**
  - Max Users: 99
  - Max Connections: 99
- **Criado em:** 2025-10-18 19:51:12
- **Estatísticas:**
  - Usuários: 3
  - Conexões WhatsApp: 1
  - Tickets: 5

---

### **Tenant 3: Empresa 01**
- **ID:** 3
- **Nome:** Empresa 01
- **Status:** active
- **Owner ID:** (não definido)
- **Limites:**
  - Max Users: 99
  - Max Connections: 99
- **Criado em:** 2021-03-10 14:28:29
- **Estatísticas:**
  - Usuários: 0
  - Conexões WhatsApp: 0
  - Tickets: 0

---

## 📊 Análise

### **Tenant Ativo:**
- ✅ **Tenant 2 (Econect)** - Único com dados:
  - 3 usuários
  - 1 conexão WhatsApp
  - 5 tickets

### **Tenants Vazios:**
- ⚠️ **Tenant 1 e 3** - Sem dados:
  - Nenhum usuário
  - Nenhuma conexão
  - Nenhum ticket

### **Observações:**
- ⚠️ Nenhum tenant tem `ownerId` definido
- ⚠️ Tenant 1 e 3 têm o mesmo nome ("Empresa 01")
- ✅ Todos os tenants estão com status "active"
- ✅ Limites configurados: 99 usuários e 99 conexões

---

## 🔍 Recomendações

1. **Verificar duplicação:**
   - Tenant 1 e 3 têm o mesmo nome
   - Considerar consolidar ou renomear

2. **Definir Owners:**
   - Nenhum tenant tem owner definido
   - Considerar atribuir owners para melhor gestão

3. **Focar no Tenant 2:**
   - Tenant "Econect" é o único com dados
   - Este parece ser o tenant principal em uso

---

## 📝 Comandos Úteis

```sql
-- Ver todos os tenantes
SELECT * FROM "Tenants" ORDER BY id;

-- Ver usuários por tenant
SELECT t.name, COUNT(u.id) as users 
FROM "Tenants" t 
LEFT JOIN "Users" u ON t.id = u."tenantId" 
GROUP BY t.id, t.name;

-- Ver conexões por tenant
SELECT t.name, COUNT(w.id) as whatsapps 
FROM "Tenants" t 
LEFT JOIN "Whatsapps" w ON t.id = w."tenantId" 
GROUP BY t.id, t.name;
```

