# Izing Open.io

Sistema de atendimentos multicanal

## Requisitos

- Node.js >= 20
- npm >= 11.3.0
- PostgreSQL
- Redis

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/izing.open.io.git
cd izing.open.io
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

> **Nota**: Durante a instalação, o script `preinstall` solicitará permissões de sudo para instalar o npm globalmente. Isso é necessário apenas uma vez durante a instalação.

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrations do banco de dados:
```bash
npm run db:migrate
```

5. Execute os seeds do banco de dados:
```bash
npm run db:seed
```

6. Inicie o servidor:
```bash
npm run dev:server
```

## Estrutura do Projeto

- `backend/` - API REST em Node.js
- `frontend/` - Interface web em React

## Licença

AGPL-3.0-or-later 