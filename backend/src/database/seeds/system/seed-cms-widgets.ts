/**
 * ==========================================
 * eLISAschool - Seed : Widgets CMS par défaut
 * ==========================================
 *
 * Seed idempotent des 5 types de widgets par défaut.
 * Créés pour chaque établissement existant.
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { CmsWidget } from '@modules/cms/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

const DEFAULT_WIDGETS = [
    {
        type: 'RESEAUX_SOCIAUX',
        titre: 'Réseaux sociaux',
        emplacement: 'pied_page',
        contenu: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '' },
    },
    {
        type: 'CONTACT_RAPIDE',
        titre: 'Contact rapide',
        emplacement: 'pied_page',
        contenu: { email: '', telephone: '', adresse: '' },
    },
    {
        type: 'HORAIRES',
        titre: 'Horaires',
        emplacement: 'pied_page',
        contenu: { horaires: 'Lun-Ven : 7h30 - 17h00' },
    },
    {
        type: 'NEWSLETTER',
        titre: 'Newsletter',
        emplacement: 'pied_page',
        contenu: { description: 'Inscrivez-vous à notre newsletter' },
    },
    {
        type: 'LIENS_UTILES',
        titre: 'Liens utiles',
        emplacement: 'pied_page',
        contenu: { liens: [] },
    },
];

export async function seedCmsWidgets(): Promise<{ created: number; skipped: number }> {
    const widgetRepo = AppDataSource.getRepository(CmsWidget);
    const etablissementRepo = AppDataSource.getRepository(Etablissement);

    const etablissements = await etablissementRepo.find();
    let created = 0;
    let skipped = 0;

    for (const etab of etablissements) {
        for (const widgetDef of DEFAULT_WIDGETS) {
            const existing = await widgetRepo.findOne({
                where: {
                    type: widgetDef.type,
                    etablissementId: etab.id,
                },
            });
            if (existing) {
                skipped++;
                continue;
            }

            const widget = widgetRepo.create({
                ...widgetDef,
                etablissementId: etab.id,
                estActif: true,
                ordre: DEFAULT_WIDGETS.indexOf(widgetDef) + 1,
            });
            await widgetRepo.save(widget);
            created++;
        }
    }

    logger.info(`🧩 Seed widgets CMS : ${created} créés, ${skipped} ignorés`);
    return { created, skipped };
}
