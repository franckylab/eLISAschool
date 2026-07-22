import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { MembrePersonnel } from './personnel.entity';
import type { ContratPersonnel } from './contrat-personnel.entity';
import { Fonction } from '@modules/organisation/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('membres_fonctions')
@Index(['membrePersonnelId'])
@Index(['fonctionId'])
@Index(['contratId'])
@Index(['etablissementId'])
@Index(['membrePersonnelId', 'estPrincipale'])
export class MembreFonction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne('MembrePersonnel', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    fonctionId!: string;

    @ManyToOne(() => Fonction, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fonctionId' })
    fonction?: Fonction;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date | null;

    @Column({ type: 'boolean', default: false })
    estPrincipale!: boolean;

    @Column({ type: 'uuid', nullable: true })
    contratId?: string;

    @ManyToOne('ContratPersonnel', { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contratId' })
    contrat?: ContratPersonnel;

    @Column({ type: 'text', nullable: true })
    commentaire?: string | null;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
