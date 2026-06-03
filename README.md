# Livro de Visitas Multimedia

Aplicacao estatica para o Dia da Multimedia, preparada para ser publicada em GitHub Pages e ligada diretamente ao Supabase.

## O que esta versao faz

- Pagina publica para submissao de mensagens
- Feed publico com apenas mensagens aprovadas
- Estatisticas por estado de espirito
- Painel admin com login Supabase
- Moderacao com estados `pending`, `approved` e `rejected`
- QR code regeneravel para o URL final do site
- Deploy sem servidor proprio e sem Oracle

## Arquitetura final

- `GitHub Pages`: hosting dos ficheiros estaticos
- `Supabase`: base de dados, autenticacao e politicas RLS
- `public/`: frontend publicado
- `deploy/github-pages/`: SQL, checklist e apoio ao deploy

## Estrutura principal

```text
guestbook-expo/
  .github/workflows/deploy-pages.yml
  public/
    index.html
    admin.html
    qr.html
    app.js
    admin.js
    common.js
    config.js
    styles.css
    logo.png
    qr.png
    qr.svg
  scripts/
    generate-qr.js
    validate-static.js
  deploy/
    github-pages/
      README.md
      setup-checklist.md
      supabase-schema.sql
```

## Configuracao local

1. Copia `.env.example` para `.env`
2. Preenche:

```env
APP_URL=https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY
```

3. Edita `public/config.js` com os mesmos valores
4. Instala dependencias:

```bash
npm install
```

5. Regenera o QR:

```bash
npm run qr
```

6. Valida a estrutura estatica:

```bash
npm run validate
```

## Como preencher public/config.js

```js
window.GUESTBOOK_CONFIG = {
  APP_URL: "https://USERNAME.github.io/REPOSITORIO/",
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "CHAVE-PUBLISHABLE-DO-SUPABASE"
};
```

Notas:

- `APP_URL` deve incluir o subpath do repositorio no GitHub Pages
- a `SUPABASE_ANON_KEY` e publica por natureza; a protecao vem das politicas RLS

## Supabase

O SQL completo da base de dados e das politicas RLS esta em [deploy/github-pages/supabase-schema.sql](deploy/github-pages/supabase-schema.sql).

Esse ficheiro cria:

- tabela `feedback`
- tabela `admin_users`
- funcao `is_admin()`
- funcao `get_feedback_stats()`
- politicas RLS para leitura publica, insercao publica e moderacao apenas por admins autenticados

## Deploy GitHub Pages

1. Faz push do repositorio para o GitHub
2. Vai a `Settings -> Pages`
3. Escolhe `GitHub Actions`
4. Confirma que o workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) corre com sucesso
5. Abre:
   - `https://USERNAME.github.io/REPOSITORIO/`
   - `https://USERNAME.github.io/REPOSITORIO/admin.html`
   - `https://USERNAME.github.io/REPOSITORIO/qr.html`

## Scripts uteis

```bash
npm run qr
npm run validate
```

## Fluxo admin

1. Criar utilizador admin no Supabase Auth
2. Inserir o email em `public.admin_users`
3. Abrir `admin.html`
4. Fazer login com email e password
5. Moderar mensagens pelo painel

## Documentacao adicional

- [deploy/github-pages/README.md](deploy/github-pages/README.md)
- [deploy/github-pages/setup-checklist.md](deploy/github-pages/setup-checklist.md)
- [deploy/github-pages/supabase-schema.sql](deploy/github-pages/supabase-schema.sql)

## Observacoes

- O backend Node.js, a base SQLite e a preparacao Oracle foram removidos intencionalmente
- A pagina `/qr` depende dos ficheiros `public/qr.png` e `public/qr.svg`, por isso corre `npm run qr` sempre que `APP_URL` mudar
- O site final fica estatico, mas continua com moderacao real via Supabase
