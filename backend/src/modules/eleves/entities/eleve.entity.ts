/**
 * ==================================
 * eLISAschool - Entités Élèves
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Utilisateur } from '@modules/utilisateurs/entities/utilisateur.entity';
import { SousSysteme, Etablissement } from '@modules/etablissement/entities';
import { Classe } from '@modules/classes/entities';
import { Genre } from '@shared/enums/statuts.enum';

/**
 * Statut workflow d'un dossier élève
 */
export enum StatutEleve {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    EXCLU = 'EXCLU',
    ABANDON = 'ABANDON',
    DIPLOME = 'DIPLOME',
}

/**
 * Type d'inscription
 */
export enum TypeInscription {
    COMPLET = 'COMPLET',
    INCOMPLET = 'INCOMPLET',
}

@Entity('eleves')
@Index(['utilisateurId'])
@Index(['matricule'])
@Index(['etablissementId'])
@Index(['nom', 'prenom'])
export class Eleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @OneToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    // ==================================
    // IDENTITÉ DE L'ÉLÈVE (CRITIQUE)
    // ==================================
    
    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100 })
    prenom!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    matricule!: string;

    @Column({ type: 'date' })
    dateNaissance!: Date;

    @Column({ type: 'varchar', length: 100 })
    lieuNaissance!: string;

    @Column({ type: 'varchar', length: 1 })
    sexe!: Genre;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nationalite?: string;

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE })
    sousSysteme!: SousSysteme;

    // ==================================
    // PARENTS / TUTEURS - INFORMATIONS DIRECTES
    // ==================================
    /**
     * @deprecated Utiliser ResponsableEleve à la place
     * Ces champs sont utilisés UNIQUEMENT pour les préinscriptions.
     * Lors de la conversion en inscription, les parents doivent être
     * migrés vers la table ResponsableEleve avec des comptes Utilisateur.
     * 
     * @see ParentsService.migrerDepuisChampsDirects()
     * @see ParentsService.getParentsInfo()
     * 
     * Sera supprimé dans la version 3.0
     */
    
    // ==================================
    // PÈRE
    // ==================================
    @Column({ type: 'varchar', length: 150, nullable: true })
    nomPere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    professionPere?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephonePere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    emailPere?: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    adressePere?: string;

    // ==================================
    // MÈRE
    // ==================================
    @Column({ type: 'varchar', length: 150, nullable: true })
    nomMere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    professionMere?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneMere?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    emailMere?: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    adresseMere?: string;

    // ==================================
    // TUTEUR LÉGAL
    // ==================================
    @Column({ type: 'varchar', length: 150, nullable: true })
    nomTuteur?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    lienParenteTuteur?: string; // 'ONCLE', 'TANTE', 'GRAND_PERE', etc.

    @Column({ type: 'varchar', length: 150, nullable: true })
    professionTuteur?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneTuteur?: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    emailTuteur?: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    adresseTuteur?: string;

    @Column({ type: 'date' })
    dateInscription!: Date;

    // ==================================
    // Champs d'identification additionnels (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 500, nullable: true })
    photo?: string;

    @Column({ type: 'varchar', length: 5, nullable: true })
    groupeSanguin?: string; // A+, A-, B+, B-, AB+, AB-, O+, O-

    @Column({ type: 'simple-json', nullable: true })
    allergies?: string[];

    @Column({ type: 'varchar', length: 200, nullable: true })
    nomContactUrgence?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneContactUrgence?: string;

    @Column({ type: 'text', nullable: true })
    adresseDomicile?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ville?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    quartier?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    ecoleProvenance?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    classeAnterieure?: string;

    @Column({ type: 'boolean', default: false })
    redoublement!: boolean;

    @Column({ type: 'boolean', default: false })
    boursier!: boolean;

    @Column({ type: 'boolean', default: false })
    regimeInterne!: boolean;

    // ==================================
    // CONTACT PRINCIPAL ET SERVICES
    // ==================================
    
    @Column({ type: 'varchar', length: 150, nullable: true })
    emailPrincipal?: string; // Email principal pour notifications

    @Column({ type: 'boolean', default: false })
    transportScolaire!: boolean;

    @Column({ type: 'boolean', default: false })
    cantine!: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    situationFamiliale?: string; // 'MARIES', 'DIVORCES', 'VEUF', etc.

    @Column({ type: 'varchar', length: 300, nullable: true })
    personneAutorisee?: string; // Personne autorisée à récupérer l'élève

    @Column({ type: 'varchar', length: 30, default: StatutEleve.ACTIF })
    statut!: StatutEleve;

    @Column({ type: 'varchar', length: 20, default: TypeInscription.INCOMPLET })
    etatDossier!: TypeInscription;

    // ==================================
    // Champs d'inscription et préinscription (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 20, nullable: true })
    typeInscription?: 'AUTO' | 'MANUELLE' | 'PORTAIL';

    @Column({ type: 'varchar', length: 30, default: 'COMPLET' })
    etatInscription!: 'BROUILLON' | 'COMPLET' | 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REFUSE';

    @Column({ type: 'boolean', default: false })
    estPreinscription!: boolean;

    @Column({ type: 'simple-json', nullable: true })
    documentsJustificatifs?: Array<{ url: string; type: string; dateUpload: string }>;

    @Column({ type: 'uuid', nullable: true })
    classeSouhaiteeId?: string;

    @ManyToOne(() => Classe, { nullable: true })
    @JoinColumn({ name: 'classeSouhaiteeId' })
    classeSouhaitee?: Classe;

    @Column({ type: 'text', nullable: true })
    commentaireRefus?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateTraitementInscription?: Date;

    @Column({ type: 'uuid', nullable: true })
    traitePar?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'traitePar' })
    traiteParUser?: Utilisateur;

    /**
     * Établissement de l'élève (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Index(['etablissementId', 'matricule'], { unique: true })

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
