import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurant_id: string;

  @Column()
  customer_name: string;

  @Column()
  customer_phone: string;

  @Column()
  party_size: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  session_id: string;

  @Column({ nullable: true })
  channel: string;

  @CreateDateColumn()
  created_at: Date;
}
