import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface HeureCours {
    id: string;
    enseignantId: string;
    classeId: string;
    matiereId: string;
    periodeId: string;
    salleId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    statutEffectue: 'PLANIFIE' | 'EFFECTUE' | 'ANNULE' | 'REMPLACE';
    commentaire?: string;
    remplacantId?: string;
    classe?: { id: string; nom: string };
    matiere?: { id: string; nom: string };
    periode?: { id: string; nom: string };
    salle?: { id: string; nom: string };
    remplacant?: { id: string; nom: string; prenom: string };
}

export interface ResumeMensuelHeures {
    mois: number;
    annee: number;
    heuresEffectuees: number;
    heuresPlanifiees: number;
    heuresAnnulees: number;
    nombreCours: number;
    detailParMatiere?: Array<{ matiereNom: string; heures: number; tarifHoraire: number; montant: number }>;
}

export function useResumeMensuel(enseignantId: string, mois: number, annee: number) {
    return useQuery<ResumeMensuelHeures>({
        queryKey: ['personnel', 'heures-cours', 'resume', enseignantId, mois, annee],
        queryFn: async () => {
            const response = await apiClient.get(`/api/personnel/heures-cours/enseignants/${enseignantId}/resume-mensuel/${annee}/${mois}`);
            return (response as any).data;
        },
        enabled: !!enseignantId,
    });
}

export function useEdtEnseignant(enseignantId: string, semaine?: string) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'edt', enseignantId, semaine],
        queryFn: async () => {
            const response = await apiClient.get(`/api/personnel/heures-cours/enseignants/${enseignantId}/edt?semaine=${semaine}`);
            return (response as any).data;
        },
        enabled: !!enseignantId && !!semaine,
    });
}

export function useVolumeHoraire(enseignantId: string, dateDebut: string, dateFin: string) {
    return useQuery({
        queryKey: ['personnel', 'heures-cours', 'volume', enseignantId, dateDebut, dateFin],
        queryFn: async () => {
            const response = await apiClient.get(`/api/personnel/heures-cours/enseignants/${enseignantId}/volume-horaire?dateDebut=${dateDebut}&dateFin=${dateFin}`);
            return (response as any).data;
        },
        enabled: !!enseignantId && !!dateDebut && !!dateFin,
    });
}
