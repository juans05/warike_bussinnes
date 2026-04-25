import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('carta_categories')
export class CartaCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurant_id: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column({ default: '🍽️' })
  emoji: string;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: true })
  available: boolean;
}
