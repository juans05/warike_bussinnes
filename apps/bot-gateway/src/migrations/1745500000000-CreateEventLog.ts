import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEventLog1745500000000 implements MigrationInterface {
  name = 'CreateEventLog1745500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event_log',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'event_name', type: 'varchar', length: '100' },
          { name: 'restaurant_id', type: 'varchar', length: '36' },
          { name: 'entity_id', type: 'varchar', length: '36' },
          { name: 'payload', type: 'jsonb' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          { columnNames: ['restaurant_id', 'created_at'] },
          { columnNames: ['event_name'] },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('event_log');
  }
}
