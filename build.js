import { build } from 'esbuild';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: false,
  outfile: 'dist/server.cjs',
  external: ['@whiskeysockets/baileys', 'qrcode'],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    'process.env.NODE_ENV': '"production"',
  },
}).then(() => {
  console.log('Successfully bundled standalone server into dist/server.cjs');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});