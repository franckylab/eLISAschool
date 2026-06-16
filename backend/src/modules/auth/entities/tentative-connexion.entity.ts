/**
 * ==================================
 * eLISAschool - Entité TentativeConnexion
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Traçage des tentatives de connexion par identifiant et par machine
 * pour implémenter un système de blocage à deux niveaux professionnel
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

/**
 * Type de blocage
 */
export enum TypeBlocage {
    SPECIFIQUE = 'specifique',  // Blocage sur identifiant spécifique
    GENERAL = 'general'         // Blocage global (tous identifiants)
}

/**
 * Entité TentativeConnexion
 * Permet le suivi des tentatives échouées avec distinction par machine (adresse IP + user agent fingerprint)
 */
@Entity('tentatives_connexion')
@Index(['identifiant', 'adresseIp'])
@Index(['adresseIp', 'bloqueJusqua'])
@Index(['typeBlocage', 'bloqueJusqua'])
export class TentativeConnexion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Identifiant utilisé (email, matricule, pseudonyme)
     */
    @Column({ type: 'varchar', length: 255 })
    identifiant!: string;

    /**
     * Adresse IP de la machine
     */
    @Column({ type: 'varchar', length: 45 })
    adresseIp!: string;

    /**
     * Empreinte utilisateur (hash de user-agent + autres facteurs)
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    empreinteMachine?: string;

    /**
     * Type de blocage
     */
    @Column({
        type: 'varchar',
        length: 20,
        default: TypeBlocage.SPECIFIQUE
    })
    typeBlocage!: TypeBlocage;

    /**
     * Nombre de tentatives échouées
     */
    @Column({ type: 'int', default: 0 })
    nombreTentatives!: number;

    /**
     * Date de blocage (null si pas bloqué)
     */
    @Column({ type: 'timestamp', nullable: true })
    bloqueJusqua?: Date;

    /**
     * Date de dernière tentative
     */
    @Column({ type: 'timestamp' })
    derniereTentative!: Date;

    /**
     * Motif du blocage
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    motifBlocage?: string;

    /**
     * Nombre de déblocages automatiques (après expiration)
     */
    @Column({ type: 'int', default: 0 })
    nbDeblocagesAuto!: number;

    @CreateDateColumn()
    createdAt!: Date;

    /**
     * Vérifie si le blocage est actif
     */
    estBloque(): boolean {
        if (!this.bloqueJusqua) return false;
        return new Date() < this.bloqueJusqua;
    }

    /**
     * Calcule le temps restant en secondes
     */
    tempsRestantSecondes(): number {
        if (!this.bloqueJusqua) return 0;
        const diff = this.bloqueJusqua.getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 1000));
    }

    /**
     * Réinitialise les tentatives
     */
    reinitialiser(): void {
        this.nombreTentatives = 0;
        this.bloqueJusqua = undefined;
        this.motifBlocage = undefined;
    }

    /**
     * Incrémente les tentatives et bloque si nécessaire
     */
    incrementer(maxTentatives: number, dureeBlocageMinutes: number, motif?: string): boolean {
        this.nombreTentatives += 1;
        this.derniereTentative = new Date();

        if (this.nombreTentatives >= maxTentatives) {
            const bloqueJusqua = new Date();
            bloqueJusqua.setMinutes(bloqueJusqua.getMinutes() + dureeBlocageMinutes);
            this.bloqueJusqua = bloqueJusqua;
            this.motifBlocage = motif || `Blocage après ${maxTentatives} tentatives échouées`;
            return true; // Bloqué
        }

        return false; // Pas encore bloqué
    }
}
