/* Regenerates assets/fonts.js from the TTF files in fonts/. Run: node tools/build-fonts.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const b64 = f => fs.readFileSync(path.join(root, 'fonts', f)).toString('base64');
fs.writeFileSync(path.join(root, 'assets/fonts.js'),
  '/* IBM Plex Sans Arabic (SIL OFL 1.1, see fonts/OFL.txt), base64-encoded so the text engine works from any static host,\n' +
  '   including file:// previews. Regenerate with: npm run build:fonts */\n' +
  `var FONT_REG_B64 = "${b64('IBMPlexSansArabic-Regular.ttf')}";\nvar FONT_BOLD_B64 = "${b64('IBMPlexSansArabic-Bold.ttf')}";\n`);
console.log('assets/fonts.js written');
