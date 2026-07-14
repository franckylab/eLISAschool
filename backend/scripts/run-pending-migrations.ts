import { AppDataSource } from '../src/database/data-source';

async function main() {
    await AppDataSource.initialize();
    const pending = await AppDataSource.showMigrations();
    console.log('Pending migrations:', pending);
    const result = await AppDataSource.runMigrations({ transaction: 'all' });
    console.log('Executed:', result.map((m: { name: string }) => m.name));
    await AppDataSource.destroy();
}

main().catch((err) => { console.error(err); process.exit(1); });
