import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { CartaModule } from './carta/carta.module';
import { ReservasModule } from './reservas/reservas.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE', 'wuarike_db'),
        schema: config.get('DB_SCHEMA', 'mesero_digital'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    CartaModule,
    ReservasModule,
    PedidosModule,
    FeedbackModule,
    WebhooksModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
