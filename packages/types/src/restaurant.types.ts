export type BotTone = 'amigable' | 'formal' | 'divertido';
export type Currency = 'PEN' | 'USD';
export type BotLanguage = 'es-PE' | 'es' | 'en';

export interface BotPersona {
  name: string;
  tone: BotTone;
  language: BotLanguage;
  greeting: string;
}

export interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface ReservationConfig {
  enabled: boolean;
  max_party_size: number;
  min_advance_hours: number;
  max_advance_days: number;
  slots: string[];
}
