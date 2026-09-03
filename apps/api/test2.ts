import { PrismaClient } from '@prisma/client';
import { duplicatePage } from './src/modules/pages/pages.service.js';
const prisma = new PrismaClient();
async function main() {
    const page = await prisma.page.findFirst({ include: { project: true } });
    try {
        const res = await duplicatePage(page.id, page.project.ownerId);
        console.log('success!', res);
    } catch (e) { console.error('ERROR', e); }
}
main();
