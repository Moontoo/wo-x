const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'outputs/harbor-bid/dist');
const output = path.join(root, '_site');
const html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
const files = new Set(['index.html']);
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const name = match[1];
  if (/^(?:https?:|data:|#|\.[\/]$)/.test(name)) continue;
  if (!/^[a-z0-9-]+\.(?:js|css)$/i.test(name)) throw Error('Unexpected page asset: ' + name);
  files.add(name);
}
for (const name of [...files]) {
  const text = fs.readFileSync(path.join(source, name), 'utf8');
  for (const match of text.matchAll(/assets\/[a-z0-9-]+\.png/gi)) files.add(match[0]);
}
fs.mkdirSync(output, { recursive: true });
let bytes = 0;
for (const name of files) {
  const from = path.join(source, name), to = path.join(output, name);
  if (!fs.statSync(from).isFile()) throw Error('Missing asset: ' + name);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  bytes += fs.statSync(from).size;
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(JSON.stringify({files: files.size + 1, megabytes: +(bytes/1048576).toFixed(2), output}));
