# Deploy estatico com GitHub Pages + Supabase

Esta versao do projeto foi preparada para funcionar sem servidor propio:

- GitHub Pages serve os ficheiros estaticos da pasta `public/`
- Supabase trata da base de dados, autenticacao admin e moderacao

## Ponto de entrada

- `public/index.html`: pagina publica
- `public/admin.html`: login e moderacao
- `public/qr.html`: pagina do QR

## Ficheiros de apoio

- `public/config.js`: configuracao runtime a publicar no GitHub Pages
- `deploy/github-pages/supabase-schema.sql`: schema, funcoes e politicas RLS
- `deploy/github-pages/setup-checklist.md`: checklist rapida de configuracao
- `.github/workflows/deploy-pages.yml`: workflow para publicar `public/`

## Fluxo recomendado

1. Criar projeto Supabase
2. Executar o SQL em `deploy/github-pages/supabase-schema.sql`
3. Criar um utilizador admin no Supabase Auth
4. Registar o email desse admin em `public.admin_users`
5. Preencher `public/config.js`
6. Se `APP_URL` mudar, correr `npm run qr`
7. Publicar o repositório com GitHub Pages
