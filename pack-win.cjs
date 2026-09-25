const { execSync } = require('child_process');
const cmd =
  'npx electron-packager . Vyoma --platform=win32 --arch=x64 --out=release --overwrite --icon=assets/icon.ico ' +
  '--ignore="^/(src|server|api|components|lib|scripts|android|apk|VyomPOS|design-system|graphify-out|release)" ' +
  '--ignore="[.](git|agents|impeccable|md|pdf|xlsx|map)$" --prune=true';
console.log('Running:', cmd);
execSync(cmd, { stdio: 'inherit', cwd: __dirname });
console.log('Packaging complete.');
