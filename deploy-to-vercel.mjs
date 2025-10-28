import https from 'https';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_ID = 'team_HHm6AJ7yGjdDDEGQ07unbsl9';

// Environment variables to configure
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
    key: 'NODE_ENV',
    value: 'production',
    type: 'plain',
    target: ['production']
  }
];

async function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path + (TEAM_ID ? `?teamId=${TEAM_ID}` : ''),
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

async function createProject() {
  console.log('Creating Vercel project...');
  
  const projectData = {
    name: 'mgm-museum',
    framework: 'nextjs',
    gitRepository: {
      repo: 'SProjects-cpu/mgm-museum',
      type: 'github'
    }
  };

  const project = await makeRequest('/v9/projects', 'POST', projectData);
  
  if (project.error) {
    console.error('Error creating project:', project.error);
    if (project.error.code === 'PROJECT_ALREADY_EXISTS') {
      console.log('Project already exists, using existing project');
      return 'mgm-museum';
    }
    throw new Error(project.error.message);
  }

  console.log('✅ Project created:', project.id || project.name);
  return project.id || project.name;
}

async function addEnvironmentVariables(projectId) {
  console.log('Adding environment variables...');
  
  const result = await makeRequest(
    `/v10/projects/${projectId}/env?upsert=true`,
    'POST',
    envVars
  );

  if (result.error) {
    console.error('Error adding env vars:', result.error);
    throw new Error(result.error.message);
  }

  console.log('✅ Environment variables added');
  return result;
}

async function triggerDeployment(projectId) {
  console.log('Triggering deployment...');
  
  const deploymentData = {
    name: 'mgm-museum',
    target: 'production',
    gitSource: {
      type: 'github',
      repo: 'mgm-museum',
      ref: 'main',
      org: 'SProjects-cpu'
    }
  };

  const deployment = await makeRequest('/v13/deployments', 'POST', deploymentData);
  
  if (deployment.error) {
    console.error('Error creating deployment:', deployment.error);
    throw new Error(deployment.error.message);
  }

  console.log('✅ Deployment created!');
  console.log('📦 Deployment ID:', deployment.id);
  console.log('🔗 URL:', deployment.url);
  console.log('📊 Status:', deployment.readyState);
  
  return deployment;
}

async function updateEnvironmentURLs(projectId, deploymentUrl) {
  console.log('Updating environment URLs...');
  
  const urlEnvVars = [
    {
      key: 'NEXT_PUBLIC_APP_URL',
      value: `https://${deploymentUrl}`,
      type: 'plain',
      target: ['production', 'preview']
    },
    {
      key: 'NEXT_PUBLIC_SITE_URL',
      value: `https://${deploymentUrl}`,
      type: 'plain',
      target: ['production', 'preview']
    },
    {
      key: 'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
      value: `https://${deploymentUrl}/api/graphql`,
      type: 'plain',
      target: ['production', 'preview']
    }
  ];

  const result = await makeRequest(
    `/v10/projects/${projectId}/env?upsert=true`,
    'POST',
    urlEnvVars
  );

  if (result.error) {
    console.warn('Warning: Could not update URLs, you may need to do this manually');
  } else {
    console.log('✅ Environment URLs updated');
  }
}

async function deploy() {
  try {
    if (!VERCEL_TOKEN) {
      console.error('❌ VERCEL_TOKEN environment variable is required!');
      console.log('Please run: vercel login');
      console.log('Then get your token from: https://vercel.com/account/tokens');
      process.exit(1);
    }

    console.log('🚀 Starting Vercel deployment for MGM Museum...\n');

    // Step 1: Create project
    const projectId = await createProject();
    
    // Step 2: Add environment variables
    await addEnvironmentVariables(projectId);
    
    // Step 3: Trigger deployment
    const deployment = await triggerDeployment(projectId);
    
    // Step 4: Update URLs with deployment URL
    if (deployment.url) {
      await updateEnvironmentURLs(projectId, deployment.url);
    }

    console.log('\n✨ Deployment complete!');
    console.log('🌐 Your site will be available at: https://' + deployment.url);
    console.log('📊 Check deployment status: https://vercel.com/dashboard');
    console.log('\n⚠️  Note: You may need to redeploy to apply the updated environment URLs');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();
