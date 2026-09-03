import { PrismaClient } from '@prisma/client';
import { duplicatePage } from './src/modules/pages/pages.service.js';
const prisma = new PrismaClient();
async function main() {
    const page = await prisma.page.findFirst({ where: { id: 'pg_c21bd67b-57cb-41ad-a068-4a32045e27f6' }, include: { project: true } });
    if (!page) { console.log('not found'); return; }
    console.log('found page:', page.id);
    try {
        const res = await duplicatePage(page.id, page.project.ownerId);
        console.log('success!', res);
    } catch (e) {
        console.error('THREW ERROR:', e);
    }
}
main().catch(console.error);
