import { AppDataSource } from '../src/database/data-source';
import { AddRoleChangePermission1796000000000 } from '../src/database/migrations/1796000000000-AddRoleChangePermission';

async function main() {
    await AppDataSource.initialize();
    const runner = AppDataSource.createQueryRunner();
    await runner.connect();
    const mig = new AddRoleChangePermission1796000000000();
    console.log('Running role:change permission migration...');
    await mig.up(runner);
    console.log('Migration completed successfully.');
    await runner.release();
    await AppDataSource.destroy();
}

main().catch((err) => { console.error('Migration failed:', err); process.exit(1); });
