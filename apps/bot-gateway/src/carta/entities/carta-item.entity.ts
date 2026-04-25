import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CartaCategory } from './carta-category.entity';
import type { DietaryInfo, PairingInfo, ItemVariant } from '@warike-business/types';

@Entity('carta_items')
export class CartaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category_id: string;

  @ManyToOne(() => CartaCategory)
  @JoinColumn({ name: 'category_id' })
  category: CartaCategory;

  @Column()
  restaurant_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: true })
  available: boolean;

  @Column({ default: 15 })
  prep_time_minutes: number;

  @Column({ default: false })
  is_chef_recommendation: boolean;

  @Column({ type: 'text', nullable: true })
  chef_note: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'jsonb', default: [] })
  allergens: string[];

  @Column({ type: 'jsonb', nullable: true })
  dietary: DietaryInfo;

  @Column({ type: 'jsonb', nullable: true })
  pairing: PairingInfo;

  @Column({ type: 'jsonb', default: [] })
  variants: ItemVariant[];

  @Column({ type: 'jsonb', default: [] })
  combo_ids: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
