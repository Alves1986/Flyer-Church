#!/usr/bin/env node
/**
 * Flyer Church - Pre-deploy Verification Script
 * Execute: `node scripts/pre-deploy-check.mjs`
 * Ou: `npm run pre-deploy` (se adicionado ao package.json)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const CHECKS = [];

function log(check, pass, message = '') {
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${check}${message ? ` - ${message}` : ''}`);
  CHECKS.push({ check, pass, message });
}

function run(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (e) {
    return null;
  }
}

// 1. Verificar package.json
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
log('package.json existe', fs.existsSync(pkgPath));
log('scripts.build definido', !!pkg.scripts?.build, pkg.scripts?.build);
log('scripts.dev definido', !!pkg.scripts?.dev, pkg.scripts?.dev);

// 2. Verificar .env.example
log('.env.example existe', fs.existsSync(path.join(ROOT, '.env.example')));

// 3. Verificar arquivos críticos
const criticalFiles = [
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.ts',
  'vercel.json',
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'lib/types.ts',
  'lib/db.ts',
  'lib/auth.ts',
  'lib/store.ts',
  'lib/text-renderer.ts',
  'lib/brandDna.ts',
  'lib/promptMerge.ts',
  'lib/metaPrompt.ts',
];
criticalFiles.forEach(f => log(`Arquivo crítico: ${f}`, fs.existsSync(path.join(ROOT, f))));

// 3. Verificar variáveis obrigatórias no .env.example
const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf-8');
const requiredVars = [
  'OPENROUTER_API_KEY',
  'GOOGLE_API_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
];
requiredVars.forEach(v => {
  const found = envExample.includes(`${v}=`);
  log(`Variável obrigatória no .env.example: ${v}`, found);
});

// 4. TypeScript check
console.log('\n🔍 Verificando TypeScript...');
const tscResult = run('npx tsc --noEmit');
log('TypeScript (npx tsc --noEmit)', tscResult !== null);

// 5. Build
console.log('\n🏗️  Build de produção...');
const buildResult = run('npm run build');
log('Build (npm run build)', buildResult !== null);

// 6. Testes
console.log('\n🧪 Testes...');
const testResult = run('npx vitest run');
log('Testes (npx vitest run)', testResult !== null);

// 7. Verificar .gitignore
const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
log('.gitignore tem .env.local', gitignore.includes('.env.local'));
log('.gitignore tem .env', gitignore.includes('.env'));
log('.gitignore tem .next', gitignore.includes('.next'));

// 8. Verificar próximos.config.js configurações
const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.js'), 'utf-8');
log('next.config.js tem external @napi-rs/canvas', nextConfig.includes('@napi-rs/canvas'));
log('next.config.js tem node-loader', nextConfig.includes('node-loader'));

// 9. Verificar se há testes
const testDirs = ['lib/__tests__', 'app/api/__tests__'];
testDirs.forEach(d => log(`Diretório de testes: ${d}`, fs.existsSync(path.join(ROOT, d))));

// 10. Verificar se node_modules existe
log('node_modules existe', fs.existsSync(path.join(ROOT, 'node_modules')));

// Resumo
console.log('\n' + '='.repeat(50));
const passed = CHECKS.filter(c => c.pass).length;
const failed = CHECKS.filter(c => !c.pass).length;
console.log(`✅ Passou: ${passed}`);
console.log(`❌ Falhou: ${failed}`);
console.log(`Total: ${CHECKS.length}`);

if (failed > 0) {
  console.log('\n❌ FALHAS:');
  CHECKS.filter(c => !c.pass).forEach(c => console.log(`  - ${c.check}${c.message ? ': ' + c.message : ''}`));
  console.log('\n🚫 Deploy BLOQUEADO. Corrija as falhas acima.');
  process.exit(1);
} else {
  console.log('\n✅ TUDO OK! Pronto para deploy.');
  console.log('\nPróximos passos:');
  console.log('  1. Configure as variáveis no Vercel Dashboard');
  console.log('  2. Rode: vercel --prod');
  console.log('  4. Ou: git push origin main (se conectado via GitHub)');
  process.exit(0);
}