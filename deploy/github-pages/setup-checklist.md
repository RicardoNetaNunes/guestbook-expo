# Checklist GitHub Pages + Supabase

## Supabase

1. Criar um novo projeto Supabase
2. Abrir o SQL Editor
3. Executar `deploy/github-pages/supabase-schema.sql`
4. Em `Authentication -> Providers`, manter Email ativo
5. Em `Authentication -> Sign In / Providers`, desativar signups publicos se quiseres apenas admins criados manualmente
6. Em `Authentication -> Users`, criar o utilizador admin com email e password
7. Executar:

```sql
insert into public.admin_users (email)
values ('o-teu-admin@exemplo.pt');
```

8. Copiar:
   - `Project URL`
   - `Publishable key`

## Projeto

1. Editar `public/config.js`
2. Ajustar `.env` se quiseres regenerar o QR localmente
3. Correr:

```bash
npm install
npm run qr
npm run validate
```

## GitHub Pages

1. Fazer push do repositório para o GitHub
2. Em `Settings -> Pages`, escolher `GitHub Actions`
3. Confirmar que o workflow `.github/workflows/deploy-pages.yml` executa com sucesso
4. Abrir:
   - `https://USERNAME.github.io/REPOSITORIO/`
   - `https://USERNAME.github.io/REPOSITORIO/admin.html`
   - `https://USERNAME.github.io/REPOSITORIO/qr.html`
