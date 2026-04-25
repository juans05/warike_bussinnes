import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { BotPersona, WeekSchedule, ReservationConfig } from '@warike-business/types';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  wuarike_place_id: string;

  @Column()
  owner_user_id: string;

  @Column({ default: 'PEN' })
  currency: string;

  @Column({ default: 'America/Lima' })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  bot_persona: BotPersona;

  @Column({ type: 'jsonb', nullable: true })
  schedule: WeekSchedule;

  @Column({ type: 'jsonb', nullable: true })
  reservations_config: ReservationConfig;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
