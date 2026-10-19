// Gera uma página para imprimir com o QR code de cada máquina.
// Uso: npm run qrcodes  →  abre qrcodes.html no navegador e imprime (Ctrl+P).
// Ao escanear com a câmera do celular, o QR abre o Dymra direto na máquina.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import QRCode from 'qrcode';

const { MACHINES } = await import(new URL('../src/catalog/machines.ts', import.meta.url).href);

const cards = [];
for (const m of MACHINES) {
  const svg = await QRCode.toString(`dymra://maquina/${m.id}`, { type: 'svg', margin: 1, width: 220 });
  cards.push(`<div class="card">${svg}<div class="nome">${m.nome}</div><div class="id">${m.id}</div></div>`);
}

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Dymra · QR codes das máquinas</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 16px; }
  h1 { font-size: 18px; }
  p { color: #555; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card { border: 1px dashed #999; border-radius: 8px; padding: 10px; text-align: center; break-inside: avoid; }
  .card svg { width: 100%; height: auto; max-width: 200px; }
  .nome { font-weight: 700; font-size: 14px; margin-top: 4px; }
  .id { color: #888; font-size: 10px; }
  @media print { p, h1 { display: none; } }
</style>
</head>
<body>
<h1>Dymra · QR codes das máquinas</h1>
<p>Imprima (Ctrl+P), recorte e cole cada código na máquina correspondente. Plastifique ou cubra com fita para durar mais.</p>
<div class="grid">
${cards.join('\n')}
</div>
</body>
</html>`;

const out = fileURLToPath(new URL('../qrcodes.html', import.meta.url));
writeFileSync(out, html);
console.log(`Gerado: ${out} (${MACHINES.length} máquinas)`);
