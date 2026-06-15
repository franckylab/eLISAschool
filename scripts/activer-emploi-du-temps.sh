#!/bin/bash
# Script d'activation du module emploi-du-temps

cd /mnt/DONNEES/projets/eLISAschool/backend

echo "🔄 Activation du module emploi-du-temps..."

node -r tsconfig-paths/register -r ts-node/register << 'EOF'
require('dotenv').config({ path: '../.env' });
const { AppDataSource } = require('@database/data-source');

AppDataSource.initialize().then(async () => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        // Activer le module
        await queryRunner.query(`
            UPDATE parametres_systeme 
            SET valeur = 'true', "updatedAt" = NOW()
            WHERE cle = 'emploi-du-temps.actif'
        `);
        
        console.log('✅ Module emploi-du-temps activé avec succès');
        
        // Vérifier
        const result = await queryRunner.query(`
            SELECT cle, valeur FROM parametres_systeme 
            WHERE cle = 'emploi-du-temps.actif'
        `);
        
        console.log('📊 État actuel:', result[0]);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
        process.exit(0);
    }
}).catch(err => {
    console.error('❌ Connexion DB échouée:', err.message);
    process.exit(1);
});
EOF
