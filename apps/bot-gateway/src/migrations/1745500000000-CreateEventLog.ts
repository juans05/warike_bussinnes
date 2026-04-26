import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEventLog1745500000000 implements MigrationInterface {
  name = 'CreateEventLog1745500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event_log',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'gen_random_uuid()' },
          { name: 'event_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'restaurant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'entity_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'payload', type: 'jsonb', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
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
