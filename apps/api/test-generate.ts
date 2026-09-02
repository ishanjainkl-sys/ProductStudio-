import { generatePage } from './src/modules/ai/ai.service.ts';
generatePage('Make a page', 'prj_1', 'pg_1').then(console.log).catch(console.error);
