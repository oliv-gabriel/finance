const fs = require('fs');
const path = require('path');

const files = [
  'page.tsx',
  'transactions/page.tsx',
  'categories/page.tsx',
  'budgets/page.tsx',
  'accounts/page.tsx',
  'admin/page.tsx'
];

for (const file of files) {
  const fullPath = path.join('c:/Users/ADM/Documents/gab/PROJETOS/finance/src/app', file);
  let text = fs.readFileSync(fullPath, 'utf8');
  
  if (file === 'admin/page.tsx') {
    text = text.replace(/<Navbar \/>/, '<Navbar isAdmin={admin} />');
    fs.writeFileSync(fullPath, text);
    continue;
  }

  if (!text.includes('import { isAdmin }')) {
    text = text.replace(/import Navbar/, 'import { isAdmin } from "@/lib/auth-utils";\nimport Navbar');
    text = text.replace(/(export default async function [a-zA-Z0-9_]+\([^)]*\)\s*\{)/, '$1\n  const admin = await isAdmin();');
    text = text.replace(/<Navbar summary=\{data\.summary\} \/>/g, '<Navbar summary={data.summary} isAdmin={admin} />');
    fs.writeFileSync(fullPath, text);
  }
}
