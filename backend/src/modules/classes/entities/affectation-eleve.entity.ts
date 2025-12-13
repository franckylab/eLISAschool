/**
 * ==================================
 * eLISAschool - Entités Affectation Eleve
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Classe } from './classe.entity';
// Note: Eleve entity dependency handled via UUID to avoid circular dependency loop if defined there
// But logically Eleve module should be created. We'll use UUID for now as specified in relations.
// Wait, plan implies Eleve entity exists. But we assume we haven't implemented it yet. 
// However, to keep type safety, we usually link entities.
// I will create a loose coupling here or assume Eleve is coming next.
// I will define the relation without importing Eleve entity yet if it doesn't exist, OR standard way:
// Since Eleve module is next, I'll use UUID.

@Entity('affectations_eleves')
@Index(['eleveId'])
@Index(['classeId'])
@Index(['anneeScolaireId'])
export class AffectationEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;
    // @ManyToOne(() => Eleve) ... we'll add this when Eleve entity exists

    @Column({ type: 'uuid' })
    classeId!: string;

    @ManyToOne(() => Classe)
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @Column({ type: 'date' })
    dateAffectation!: Date;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
