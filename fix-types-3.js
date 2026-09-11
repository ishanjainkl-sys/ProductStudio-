const fs = require('fs');
const path = require('path');

const projectsServiceFile = path.join(__dirname, 'apps', 'api', 'src', 'modules', 'projects', 'projects.service.ts');
let psContent = fs.readFileSync(projectsServiceFile, 'utf8');

// Fix themeTokens assignment (line 110-ish)
psContent = psContent.replace(/themeTokens: body\.themeTokens,/g, 'themeTokens: body.themeTokens as any,');
// Fix page contentJson assignments
psContent = psContent.replace(/contentJson: page\.contentJson,/g, 'contentJson: page.contentJson as any,');
psContent = psContent.replace(/contentJson: \(\?\: \w+\)\.contentJson/g, (match) => match + ' as any');

fs.writeFileSync(projectsServiceFile, psContent, 'utf8');
console.log('Fixed projects.service.ts properly');
