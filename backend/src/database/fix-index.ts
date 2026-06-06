import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function fixDuplicateIndex() {
    console.log('🔧 Connexion à la base de données...');
    
    try {
        await AppDataSource.initialize();
        console.log('✅ Connecté à la base de données');
        
        const queryRunner = AppDataSource.createQueryRunner();
        
        try {
            await queryRunner.connect();
            console.log('🗑️  Suppression de l\'index dupliqué IDX_0bf6f45eec40da903429d755d5...');
            
            await queryRunner.query(`
                DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5"
            `);
            
            console.log('✅ Index dupliqué supprimé avec succès !');
            console.log('');
            console.log('💡 Vous pouvez maintenant démarrer l\'application avec:');
            console.log('   npm run dev');
            
        } finally {
            await queryRunner.release();
        }
        
        await AppDataSource.destroy();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

fixDuplicateIndex();
