const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function getFiles(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(getFiles(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) res.push(full);
  }
  return res;
}

const tables = new Set();
const files = getFiles('src').concat(getFiles('superadmin/src'));
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.matchAll(/\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g);
  for (const m of matches) tables.add(m[1]);
}

const supabaseUrl = 'https://jkxmcbzipmcmyiwfqupx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreG1jYnppcG1jbXlpd2ZxdXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTk4NTUsImV4cCI6MjA5Mzk3NTg1NX0.A_M283GTrji6A3P80zwaflmlpbjC6RJIuWLdtyZ_OOo';
const client = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  console.log('Total referenced tables in codebase:', tables.size);
  const arr = Array.from(tables).sort();
  for (const t of arr) {
    const { data, error } = await client.from(t).select('*').limit(1);
    if (error) {
      console.log(`[FAIL] Table "${t}": ${error.message}`);
    } else {
      console.log(`[PASS] Table "${t}": EXISTS, rows: ${data.length}, cols: ${Object.keys(data[0] || {}).join(', ')}`);
    }
  }
}

testAll();
