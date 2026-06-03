const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const QRCode = require("qrcode");

dotenv.config();

const QR_COLORS = {
  dark: "#1f1b17",
  light: "#FFF8EF"
};

async function main() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL is required to generate QR assets.");
  }

  const outputDir = path.join(__dirname, "..", "public");
  const pngPath = path.join(outputDir, "qr.png");
  const svgPath = path.join(outputDir, "qr.svg");

  fs.mkdirSync(outputDir, { recursive: true });

  await QRCode.toFile(pngPath, appUrl, {
    width: 1200,
    margin: 2,
    color: QR_COLORS
  });

  const svg = await QRCode.toString(appUrl, {
    type: "svg",
    margin: 2,
    color: QR_COLORS
  });
  fs.writeFileSync(svgPath, svg);

  console.log(`QR code written to ${pngPath} and ${svgPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
