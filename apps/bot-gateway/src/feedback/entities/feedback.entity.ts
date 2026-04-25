import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurant_id: string;

  @Column({ nullable: true })
  session_id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'float', nullable: true })
  sentiment_score: number;

  @Column({ nullable: true })
  channel: string;

  @Column({ default: false })
  anonymous: boolean;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_phone: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
