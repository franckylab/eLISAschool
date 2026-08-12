/**
 * ==================================
 * eLISAschool - Export des entités Configuration
 * ==================================
 * Note: ConfigurationApp supprimée (v3.0) — migrée vers ParametreSysteme
 */

export { ConfigurationModule, ChampPersonnalise, WidgetConfig } from './configuration-module.entity';
export { ParametreSysteme, CategorieParametre, TypeValeurParametre } from './parametre-systeme.entity';
export { HistoriqueConfiguration, ActionConfiguration, CibleConfiguration } from './historique-configuration.entity';
export { BackupRecord, BackupType, StorageProvider } from './backup-record.entity';
export { ParametreVersion } from './parametre-version.entity';

// Durcissement v9 — KeyManager
export { CleCryptographique, TypeCleCryptographique, StatutCleCryptographique } from './cle-cryptographique.entity';
