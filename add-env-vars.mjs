import https from 'https';
import { execSync } from 'child_process';

// Get Vercel token from CLI
let VERCEL_TOKEN;
try {
  const tokenOutput = execSync('vercel whoami', { encoding: 'utf-8' });
  console.log('Logged in to Vercel');
} catch (e) {
  console.error('Please run: vercel login');
  process.exit(1);
}

// Try to get token from config
try {
  const configPath = process.platform === 'win32' 
    ? process.env.APPDATA + '\\com.vercel.cli\\config.json'
    : process.env.HOME + '/.config/vercel/config.json';
  
  const fs = await import('fs');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  VERCEL_TOKEN = config.token;
} catch (e) {
  console.error('Could not read Vercel token. Please set VERCEL_TOKEN environment variable.');
  console.log('Get your token from: https://vercel.com/account/tokens');
  process.exit(1);
}

const PROJECT_ID = 'prj_GaqGZCoUOewXX7v7GpxmxlAVIkNC';
const TEAM_ID = 'team_ykKCFwbAE761JMgbmGNoAvrh';

const envVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://mlljzwuflbbquttejvuq.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDcxMDQsImV4cCI6MjA3NTgyMzEwNH0.YxYyWd2-6dSytqTv92KfeMkf1wSWeoCLYNY1NCuF7dw',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGp6d3VmbGJicXV0dGVqdnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI0NzEwNCwiZXhwIjoyMDc1ODIzMTA0fQ.rneNu_-nQ1CrHPnzWAjwpyxnOW1wcMIh4-TIPi6jbxU',
    type: 'encrypted',
    target: ['production', 'preview']
  },
  {
    key: 'SUPABASE_STORAGE_BUCKET',
    value: 'mgm-museum-storage',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'RESEND_API_KEY',
    value: 're_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE',
    type: 'encrypted',
    target: ['production', 'preview']
  },
  {
    key: 'FROM_EMAIL',
    value: 'MGM Science Centre <noreply@mgmapjscicentre.org>',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'https://mgm-museum.vercel.app',
    type: 'plain',
    target: ['production', 'preview']
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://mgm-museum.vercel.app',
    type: 'plain',
    target: ['production', 'preview']
  },
  {
    key: 'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
    value: 'https://mgm-museum.vercel.app/api/graphql',
    type: 'plain',
    target: ['production', 'preview']
  },
  {
    key: 'NODE_ENV',
    value: 'production',
    type: 'plain',
    target: ['production']
  }
];

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path + `?teamId=${TEAM_ID}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function addEnvironmentVariables() {
  console.log('🔧 Adding environment variables to Vercel project...\n');
  
  for (const envVar of envVars) {
    console.log(`Adding ${envVar.key}...`);
    const result = await makeRequest(
      `/v10/projects/${PROJECT_ID}/env?upsert=true`,
      'POST',
      [envVar]
    );

    if (result.error) {
      console.error(`❌ Error adding ${envVar.key}:`, result.error.message);
    } else {
      console.log(`✅ Added ${envVar.key}`);
    }
  }

  console.log('\n✨ All environment variables configured!');
  console.log('🔄 Triggering redeploy to apply changes...\n');
}

addEnvironmentVariables().catch(console.error);
