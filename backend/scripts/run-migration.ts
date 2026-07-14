import { AppDataSource } from '../src/database/data-source';

async function main() {
    const ds = await AppDataSource.initialize();
    const migrations = await ds.runMigrations();
    console.log(`Migrations exécutées: ${migrations.length}`);
    await ds.destroy();
}

main().catch((err) => { console.error(err); process.exit(1); });
