const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const requiredFiles = [
  "public/index.html",
  "public/admin.html",
  "public/qr.html",
  "public/app.js",
  "public/admin.js",
  "public/common.js",
  "public/config.js",
  "public/qr-page.js",
  "public/styles.css",
  "public/logo.png",
  "public/qr.png",
  "public/qr.svg",
  "deploy/github-pages/README.md",
  "deploy/github-pages/setup-checklist.md",
  "deploy/github-pages/supabase-schema.sql",
  ".github/workflows/deploy-pages.yml"
];

const forbiddenPaths = [
  "app.js",
  "db.js",
  "server.js",
  "qr.js",
  "routes/api.js",
  "routes/admin.js",
  "scripts/loadtest.js",
  "scripts/smoke.js",
  "tests/app.test.js",
  "deploy/oracle/README.md",
  "deploy/oracle/setup-server.sh",
  "deploy/oracle/deploy-app.sh",
  "deploy/oracle/backup-db.sh",
  "deploy/oracle/restore-db.sh",
  "deploy/oracle/guestbook-expo.service",
  "deploy/oracle/nginx-guestbook-expo.conf",
  "data/guestbook.db"
];

function main() {
  const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(projectRoot, file)));
  const leftovers = forbiddenPaths.filter((file) => fs.existsSync(path.join(projectRoot, file)));

  if (missing.length) {
    throw new Error(`Faltam ficheiros esperados:\n- ${missing.join("\n- ")}`);
  }

  if (leftovers.length) {
    throw new Error(`Ainda existem artefactos antigos que deviam ter sido removidos:\n- ${leftovers.join("\n- ")}`);
  }

  const htmlTargets = [
    "public/index.html",
    "public/admin.html",
    "public/qr.html"
  ];

  htmlTargets.forEach((file) => {
    const content = fs.readFileSync(path.join(projectRoot, file), "utf8");
    if (/\b(?:href|src)="\//.test(content)) {
      throw new Error(`${file} ainda usa caminhos absolutos incompativeis com GitHub Pages.`);
    }
  });

  const runtimeConfig = fs.readFileSync(path.join(projectRoot, "public/config.js"), "utf8");
  const hasPlaceholderConfig = runtimeConfig.includes("YOUR-USERNAME.github.io") || runtimeConfig.includes("YOUR-PROJECT.supabase.co");

  console.log("Estrutura estatica validada com sucesso.");
  if (hasPlaceholderConfig) {
    console.log("Aviso: public/config.js ainda tem placeholders. Preenche-o antes de publicar.");
  }
}

main();
