const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not available? We can just manually specify directories.

const dir = path.join(__dirname, 'apps', 'api', 'src');

function fixFiles(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix req.params.* errors
            const paramRegex = /req\.params\.([a-zA-Z0-9_]+)!/g;
            if (paramRegex.test(content)) {
                content = content.replace(paramRegex, '(req.params.$1 as string)');
                modified = true;
            }

            // Fix JsonValue assignments
            const jsonValueAssignRegex = /contentJson: (body|data)\.contentJson( as never)?/g;
            if (jsonValueAssignRegex.test(content)) {
                content = content.replace(jsonValueAssignRegex, 'contentJson: $1.contentJson as never');
                modified = true;
            }

            // Fix ThemeTokens is not assignable to InputJsonObject (Prisma JSON)
            // Just cast as any in projects.service.ts
            if (file === 'projects.service.ts') {
                content = content.replace(/themeTokens: body\.themeTokens,/g, 'themeTokens: body.themeTokens as any,');
                content = content.replace(/contentJson: page\.contentJson,/g, 'contentJson: page.contentJson as any,');
                content = content.replace(/page\.contentJson as never/g, 'page.contentJson as any');
                modified = true;
            }
            if (file === 'templates.service.ts') {
                content = content.replace(/as PageDocument/g, 'as unknown as PageDocument');
                modified = true;
            }
            if (file === 'theme.service.ts') {
                content = content.replace(/as ThemeTokens/g, 'as unknown as ThemeTokens');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', fullPath);
            }
        }
    }
}

fixFiles(dir);
