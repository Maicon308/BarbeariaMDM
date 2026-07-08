# BarbeariaMDM

SaaS multi-tenant para barbearias com Backend Django/DRF/PostgreSQL e Frontend React/TypeScript/Tailwind.

## Estrutura

- `Backend`: API Django, modelos multi-tenant, autenticação JWT e cupom térmico.
- `Frontend`: aplicação React com dashboard, Axios JWT e impressão de cupom.

## Local

```powershell
.\run-dev.bat
```

Backend: http://localhost:8000  
Frontend: http://localhost:5173
Frontend na rede/Tailscale: use um dos IPs exibidos pelo Vite em `:5173`; a API sera chamada no mesmo host pela porta `8000`.

Login SuperAdmin local criado automaticamente pelo Docker:

- Usuario: `admin`
- Senha: `16122012`

O SuperAdmin cadastra as barbearias no menu `Barbearias`. A tela inicial e apenas login.

## Produção com Coolify

1. Crie o projeto no Coolify apontando para o repositório `BarbeariaMDM`.
2. Use a branch `main`.
3. Selecione deploy por Docker Compose.
4. Informe o compose `docker-compose.prod.yml`.
5. Configure as variáveis:
   - `SECRET_KEY`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `ALLOWED_HOSTS`
   - `CORS_ALLOWED_ORIGINS`
   - `VITE_API_URL`
   - `SUPERADMIN_USERNAME`
   - `SUPERADMIN_EMAIL`
   - `SUPERADMIN_PASSWORD`
6. Configure os domínios nos serviços `backend` e `frontend`.

## Branches

- `dev`: ambiente local, com `run-dev.bat`.
- `main`: produção, pronto para Coolify.
