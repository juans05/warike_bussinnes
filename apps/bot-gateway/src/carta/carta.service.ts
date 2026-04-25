import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartaItem } from './entities/carta-item.entity';
import { CartaCategory } from './entities/carta-category.entity';
import { CreateCartaItemDto } from './dto/create-carta-item.dto';
import { UpdateCartaItemDto } from './dto/update-carta-item.dto';

@Injectable()
export class CartaService {
  constructor(
    @InjectRepository(CartaItem)
    private readonly itemRepo: Repository<CartaItem>,
    @InjectRepository(CartaCategory)
    private readonly categoryRepo: Repository<CartaCategory>,
  ) {}

  findAllByRestaurant(restaurant_id: string): Promise<CartaItem[]> {
    return this.itemRepo.find({ where: { restaurant_id }, relations: ['category'] });
  }

  findOne(id: string, restaurant_id: string): Promise<CartaItem | null> {
    return this.itemRepo.findOne({ where: { id, restaurant_id } });
  }

  create(restaurant_id: string, dto: CreateCartaItemDto): Promise<CartaItem> {
    const item = this.itemRepo.create({ ...dto, restaurant_id, available: true });
    return this.itemRepo.save(item);
  }

  async update(id: string, restaurant_id: string, dto: UpdateCartaItemDto): Promise<CartaItem> {
    const item = await this.itemRepo.findOne({ where: { id, restaurant_id } });
    if (!item) throw new NotFoundException('CartaItem not found');
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async toggleAvailability(id: string, restaurant_id: string): Promise<CartaItem> {
    const item = await this.itemRepo.findOne({ where: { id, restaurant_id } });
    if (!item) throw new NotFoundException('CartaItem not found');
    item.available = !item.available;
    return this.itemRepo.save(item);
  }

  async remove(id: string, restaurant_id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id, restaurant_id } });
    if (!item) throw new NotFoundException('CartaItem not found');
    await this.itemRepo.delete(id);
  }

  findCategories(restaurant_id: string): Promise<CartaCategory[]> {
    return this.categoryRepo.find({
      where: { restaurant_id },
      order: { sort_order: 'ASC' },
    });
  }

  createCategory(restaurant_id: string, name: string, emoji: string, sort_order: number): Promise<CartaCategory> {
    const cat = this.categoryRepo.create({ restaurant_id, name, emoji, sort_order });
    return this.categoryRepo.save(cat);
  }
}
