# 📝 Configuração dos Seeds

## ✅ Seeds Configurados para Tenant 1

### **Seeds que serão executados:**

1. **`20200904070001-create-default-tenant.ts`**
   - Cria o tenant "Empresa 01" (ID: 1)
   - ✅ OK - Mantido

2. **`20200904070005-create-default-users.ts`**
   - Cria usuário "Administrador" (admin@izing.io)
   - **tenantId: 1** ✅
   - ✅ OK - Mantido

3. **`20240517000001-create-default-super.ts`**
   - Cria usuário "Super" (super@izing.io)
   - **tenantId: 1** ✅
   - ✅ OK - Mantido

4. **`20200904070004-create-default-settings.ts`**
   - Cria configurações padrão
   - **tenantId: 1** ✅
   - ✅ OK - Mantido

---

## 🚫 Seed Desabilitado

### **`20240522000002-transfer-users-to-econect.ts`** ❌
- **Status:** DESABILITADO (renomeado para `.disabled`)
- **Motivo:** Este seed criava o tenant "Econect" e movia todos os dados do tenant 1 para o tenant 2
- **Ação:** Não será executado mais

---

## 📊 Resultado ao Rodar Seeds

Ao executar `npm run db:seed` ou `npx sequelize db:seed:all`:

✅ **Será criado:**
- 1 Tenant: "Empresa 01" (ID: 1)
- 2 Usuários no Tenant 1:
  - Administrador (admin@izing.io) - senha: 123456
  - Super (super@izing.io) - senha: 123456
- Configurações padrão no Tenant 1

❌ **NÃO será criado:**
- Tenant "Econect"
- Múltiplos tenants
- Movimentação de dados entre tenants

---

## 🔧 Como Reabilitar (se necessário)

Se no futuro precisar do seed de transferência:

```bash
mv backend/src/database/seeds/20240522000002-transfer-users-to-econect.ts.disabled \
   backend/src/database/seeds/20240522000002-transfer-users-to-econect.ts
```

---

## ✅ Conclusão

**Os seeds estão configurados para manter tudo no Tenant 1.**

Ao rodar os seeds, você terá:
- ✅ 1 único tenant (Empresa 01)
- ✅ Admin e Super no Tenant 1
- ✅ Sem criação de tenants adicionais

