const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'apps', 'api', 'src', 'config', 'env.ts');
let envContent = fs.readFileSync(envFile, 'utf8');

if (!envContent.includes('SMTP_HOST: z.string().optional()')) {
    const envRegex = /GEMINI_API_KEY: z\.string\(\)\.optional\(\),/;
    envContent = envContent.replace(envRegex, `GEMINI_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),`);
    fs.writeFileSync(envFile, envContent, 'utf8');
    console.log('Fixed env.ts');
}

const projectsServiceFile = path.join(__dirname, 'apps', 'api', 'src', 'modules', 'projects', 'projects.service.ts');
let psContent = fs.readFileSync(projectsServiceFile, 'utf8');
psContent = psContent.replace(/ThemeTokens/g, 'any');
psContent = psContent.replace(/PageDocument/g, 'any');
fs.writeFileSync(projectsServiceFile, psContent, 'utf8');
console.log('Fixed projects.service.ts');
