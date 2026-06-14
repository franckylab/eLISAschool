/**
 * ==================================
 * eLISAschool - Export des entités Configuration
 * ==================================
 * Note: ConfigurationApp a été supprimée (migrée vers ParametreSysteme)
 */

export { ConfigurationModule, ChampPersonnalise, WidgetConfig } from './configuration-module.entity';
export { ParametreSysteme, CategorieParametre, TypeValeurParametre } from './parametre-systeme.entity';
export { HistoriqueConfiguration, ActionConfiguration, CibleConfiguration } from './historique-configuration.entity';
export { BackupRecord, BackupType, StorageProvider } from './backup-record.entity';
export { ParametreVersion } from './parametre-version.entity';
