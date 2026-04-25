import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartaItem } from './entities/carta-item.entity';
import { CartaCategory } from './entities/carta-category.entity';
import { CartaService } from './carta.service';
import { CartaController } from './carta.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartaItem, CartaCategory]), AuthModule],
  providers: [CartaService],
  controllers: [CartaController],
  exports: [CartaService],
})
export class CartaModule {}
