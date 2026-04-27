# Event-Driven Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una capa event-driven al bot-gateway de NestJS para habilitar notificaciones al crear pedidos, auditoría de cambios en DB, y un endpoint SSE para el dashboard en tiempo real.

**Architecture:** Los servicios (PedidosService, ReservasService, FeedbackService) emiten eventos de dominio tipados vía `EventEmitter2`. Tres consumidores independientes escuchan esos eventos: `AuditListener` (escribe a tabla `event_log`), `NotificationsListener` (maneja pedido nuevo) y `DashboardService` (alimenta stream SSE con `Subject<ActivityEvent>`). El dashboard Next.js se conecta al endpoint SSE `/dashboard/stream/:restaurantId` para recibir updates en tiempo real.

**Tech Stack:** `@nestjs/event-emitter@^2.0.0`, `eventemitter2@^6.4.9`, NestJS SSE (`@Sse` + `Observable`), TypeORM migration para `event_log`, Jest para tests unitarios.

---

## Mapa de archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/bot-gateway/package.json` |
| Modificar | `apps/bot-gateway/src/app.module.ts` |
| **Crear** | `apps/bot-gateway/src/events/domain-events.ts` |
| Modificar | `apps/bot-gateway/src/pedidos/pedidos.service.ts` |
| Modificar | `apps/bot-gateway/src/reservas/reservas.service.ts` |
| Modificar | `apps/bot-gateway/src/feedback/feedback.service.ts` |
| **Crear** | `apps/bot-gateway/src/audit/audit-log.entity.ts` |
| **Crear** | `apps/bot-gateway/src/audit/audit.listener.ts` |
| **Crear** | `apps/bot-gateway/src/audit/audit.module.ts` |
| **Crear** | `apps/bot-gateway/src/migrations/1745500000000-CreateEventLog.ts` |
| **Crear** | `apps/bot-gateway/src/notifications/notifications.listener.ts` |
| **Crear** | `apps/bot-gateway/src/notifications/notifications.module.ts` |
| **Crear** | `apps/bot-gateway/src/dashboard/dashboard.service.ts` |
| **Crear** | `apps/bot-gateway/src/dashboard/dashboard.controller.ts` |
| **Crear** | `apps/bot-gateway/src/dashboard/dashboard.module.ts` |
| Modificar | `apps/bot-gateway/src/webhooks/webhooks.service.ts` |

---

## Task 1: Instalar @nestjs/event-emitter y registrar en AppModule

**Files:**
- Modify: `apps/bot-gateway/package.json`
- Modify: `apps/bot-gateway/src/app.module.ts`

- [ ] **Step 1.1: Agregar dependencia en package.json**

En `apps/bot-gateway/package.json`, dentro de `"dependencies"`, agregar después de la línea de `"rxjs"`:

```json
"@nestjs/event-emitter": "^2.0.0",
"eventemitter2": "^6.4.9",
```

- [ ] **Step 1.2: Instalar la dependencia**

Ejecutar desde la raíz del monorepo:

```bash
cd d:/Github/warike_business
pnpm install
```

Salida esperada: `Packages: +2 added` (o similar). Sin errores.

- [ ] **Step 1.3: Registrar EventEmitterModule en AppModule**

Reemplazar el contenido completo de `apps/bot-gateway/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { CartaModule } from './carta/carta.module';
import { ReservasModule } from './reservas/reservas.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', global: true }),
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
    AuditModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
```

- [ ] **Step 1.4: Verificar que compila**

```bash
cd d:/Github/warike_business
pnpm --filter bot-gateway build
```

Salida esperada: sin errores TypeScript. (Fallará si AuditModule/NotificationsModule/DashboardModule no existen aún — es normal, crear en tareas siguientes.)

- [ ] **Step 1.5: Commit**

```bash
git add apps/bot-gateway/package.json apps/bot-gateway/src/app.module.ts
git commit -m "feat(bot-gateway): install @nestjs/event-emitter and register EventEmitterModule"
```

---

## Task 2: Crear clases de eventos de dominio

**Files:**
- Create: `apps/bot-gateway/src/events/domain-events.ts`

- [ ] **Step 2.1: Crear el archivo de eventos**

Crear `apps/bot-gateway/src/events/domain-events.ts` con el siguiente contenido:

```typescript
import { PedidoLineItem } from '@warike-business/types';

export class PedidoCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly session_id: string,
    public readonly channel: string,
    public readonly items: PedidoLineItem[],
    public readonly total: number,
    public readonly created_at: Date,
  ) {}
}

export class PedidoStatusChangedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly old_status: string,
    public readonly new_status: string,
    public readonly changed_at: Date,
  ) {}
}

export class ReservaCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly customer_name: string,
    public readonly party_size: number,
    public readonly date: string,
    public readonly time: string,
    public readonly created_at: Date,
  ) {}
}

export class ReservaConfirmedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly customer_name: string,
    public readonly customer_phone: string,
    public readonly party_size: number,
    public readonly date: string,
    public readonly time: string,
    public readonly confirmed_at: Date,
  ) {}
}

export class ReservaCancelledEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly cancelled_at: Date,
  ) {}
}

export class FeedbackReceivedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly message: string,
    public readonly sentiment_score: number | null,
    public readonly channel: string,
    public readonly anonymous: boolean,
    public readonly received_at: Date,
  ) {}
}

export class FeedbackResolvedEvent {
  constructor(
    public readonly id: string,
    public readonly restaurant_id: string,
    public readonly resolved_at: Date,
  ) {}
}

export const EVENTS = {
  PEDIDO_CREATED: 'pedido.created',
  PEDIDO_STATUS_CHANGED: 'pedido.status_changed',
  RESERVA_CREATED: 'reserva.created',
  RESERVA_CONFIRMED: 'reserva.confirmed',
  RESERVA_CANCELLED: 'reserva.cancelled',
  FEEDBACK_RECEIVED: 'feedback.received',
  FEEDBACK_RESOLVED: 'feedback.resolved',
} as const;
```

- [ ] **Step 2.2: Commit**

```bash
git add apps/bot-gateway/src/events/
git commit -m "feat(bot-gateway): add typed domain event classes"
```

---

## Task 3: Emitir eventos desde PedidosService

**Files:**
- Modify: `apps/bot-gateway/src/pedidos/pedidos.service.ts`
- Test: `apps/bot-gateway/src/pedidos/pedidos.service.spec.ts`

- [ ] **Step 3.1: Escribir el test que falla**

Reemplazar el contenido de `apps/bot-gateway/src/pedidos/pedidos.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PedidosService } from './pedidos.service';
import { Pedido } from './entities/pedido.entity';
import { EVENTS, PedidoCreatedEvent, PedidoStatusChangedEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockEmitter = { emit: jest.fn() };

describe('PedidosService — events', () => {
  let service: PedidosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: getRepositoryToken(Pedido), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(PedidosService);
  });

  it('create() emits pedido.created with correct payload', async () => {
    const saved = {
      id: 'p-1', restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      items: [{ name: 'Lomo', price: 35, quantity: 1 }], total: 35,
      status: 'pending', created_at: new Date(), updated_at: new Date(),
    };
    mockRepo.create.mockReturnValue(saved);
    mockRepo.save.mockResolvedValue(saved);

    await service.create({
      restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      items: [{ name: 'Lomo', price: 35, quantity: 1 }], total: 35,
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EVENTS.PEDIDO_CREATED,
      expect.any(PedidoCreatedEvent),
    );
    const emitted: PedidoCreatedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(emitted.id).toBe('p-1');
    expect(emitted.restaurant_id).toBe('r-1');
    expect(emitted.total).toBe(35);
  });

  it('updateStatus() emits pedido.status_changed', async () => {
    const existing = { id: 'p-1', restaurant_id: 'r-1', status: 'pending', items: [], total: 35, created_at: new Date(), updated_at: new Date() };
    const updated = { ...existing, status: 'preparing' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue(updated);

    await service.updateStatus('p-1', 'r-1', 'preparing');

    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EVENTS.PEDIDO_STATUS_CHANGED,
      expect.any(PedidoStatusChangedEvent),
    );
    const emitted: PedidoStatusChangedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(emitted.old_status).toBe('pending');
    expect(emitted.new_status).toBe('preparing');
  });

  it('updateStatus() throws NotFoundException if pedido not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.updateStatus('x', 'r-1', 'preparing')).rejects.toThrow(NotFoundException);
    expect(mockEmitter.emit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3.2: Ejecutar el test para verificar que falla**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="pedidos.service" --no-coverage
```

Salida esperada: `FAIL` — "Cannot find module '../events/domain-events'" o similar.

- [ ] **Step 3.3: Implementar PedidosService con emisión de eventos**

Reemplazar `apps/bot-gateway/src/pedidos/pedidos.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { EVENTS, PedidoCreatedEvent, PedidoStatusChangedEvent } from '../events/domain-events';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepo.create({ ...dto, status: 'pending' });
    const saved = await this.pedidoRepo.save(pedido);
    this.emitter.emit(
      EVENTS.PEDIDO_CREATED,
      new PedidoCreatedEvent(
        saved.id, saved.restaurant_id, saved.session_id,
        saved.channel, saved.items, Number(saved.total), saved.created_at,
      ),
    );
    return saved;
  }

  findByRestaurant(restaurant_id: string): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      where: { restaurant_id },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: string, restaurant_id: string, status: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({ where: { id, restaurant_id } });
    if (!pedido) throw new NotFoundException('Pedido not found');
    const old_status = pedido.status;
    pedido.status = status;
    const saved = await this.pedidoRepo.save(pedido);
    this.emitter.emit(
      EVENTS.PEDIDO_STATUS_CHANGED,
      new PedidoStatusChangedEvent(saved.id, saved.restaurant_id, old_status, status, new Date()),
    );
    return saved;
  }
}
```

- [ ] **Step 3.4: Ejecutar el test para verificar que pasa**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="pedidos.service" --no-coverage
```

Salida esperada: `PASS` — 3 tests passed.

- [ ] **Step 3.5: Commit**

```bash
git add apps/bot-gateway/src/pedidos/ apps/bot-gateway/src/events/
git commit -m "feat(pedidos): emit PedidoCreatedEvent and PedidoStatusChangedEvent"
```

---

## Task 4: Emitir eventos desde ReservasService

**Files:**
- Modify: `apps/bot-gateway/src/reservas/reservas.service.ts`
- Test: `apps/bot-gateway/src/reservas/reservas.service.spec.ts`

- [ ] **Step 4.1: Escribir el test que falla**

Reemplazar `apps/bot-gateway/src/reservas/reservas.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { EVENTS, ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
const mockEmitter = { emit: jest.fn() };

const baseReserva = {
  id: 'rv-1', restaurant_id: 'r-1', customer_name: 'Juan', customer_phone: '999',
  party_size: 2, date: '2026-05-01', time: '19:00', status: 'pending',
  session_id: 's-1', channel: 'web_widget', created_at: new Date(),
};

describe('ReservasService — events', () => {
  let service: ReservasService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: getRepositoryToken(Reserva), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(ReservasService);
  });

  it('create() emits reserva.created', async () => {
    mockRepo.create.mockReturnValue(baseReserva);
    mockRepo.save.mockResolvedValue(baseReserva);

    await service.create({
      restaurant_id: 'r-1', customer_name: 'Juan', customer_phone: '999',
      party_size: 2, date: '2026-05-01', time: '19:00',
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CREATED, expect.any(ReservaCreatedEvent));
    const ev: ReservaCreatedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(ev.customer_name).toBe('Juan');
    expect(ev.party_size).toBe(2);
  });

  it('confirm() emits reserva.confirmed', async () => {
    const confirmed = { ...baseReserva, status: 'confirmed' };
    mockRepo.findOne.mockResolvedValue(baseReserva);
    mockRepo.save.mockResolvedValue(confirmed);

    await service.confirm('rv-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CONFIRMED, expect.any(ReservaConfirmedEvent));
  });

  it('cancel() emits reserva.cancelled', async () => {
    const cancelled = { ...baseReserva, status: 'cancelled' };
    mockRepo.findOne.mockResolvedValue(baseReserva);
    mockRepo.save.mockResolvedValue(cancelled);

    await service.cancel('rv-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.RESERVA_CANCELLED, expect.any(ReservaCancelledEvent));
  });

  it('confirm() throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.confirm('x', 'r-1')).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 4.2: Ejecutar el test para verificar que falla**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="reservas.service" --no-coverage
```

Salida esperada: `FAIL`.

- [ ] **Step 4.3: Implementar ReservasService con eventos**

Reemplazar `apps/bot-gateway/src/reservas/reservas.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import {
  EVENTS,
  ReservaCreatedEvent,
  ReservaConfirmedEvent,
  ReservaCancelledEvent,
} from '../events/domain-events';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreateReservaDto): Promise<Reserva> {
    const reserva = this.reservaRepo.create({ ...dto, status: 'pending' });
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CREATED,
      new ReservaCreatedEvent(
        saved.id, saved.restaurant_id, saved.customer_name,
        saved.party_size, saved.date, saved.time, saved.created_at,
      ),
    );
    return saved;
  }

  findByRestaurant(restaurant_id: string): Promise<Reserva[]> {
    return this.reservaRepo.find({
      where: { restaurant_id },
      order: { created_at: 'DESC' },
    });
  }

  async confirm(id: string, restaurant_id: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({ where: { id, restaurant_id } });
    if (!reserva) throw new NotFoundException('Reserva not found');
    reserva.status = 'confirmed';
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CONFIRMED,
      new ReservaConfirmedEvent(
        saved.id, saved.restaurant_id, saved.customer_name, saved.customer_phone,
        saved.party_size, saved.date, saved.time, new Date(),
      ),
    );
    return saved;
  }

  async cancel(id: string, restaurant_id: string): Promise<Reserva> {
    const reserva = await this.reservaRepo.findOne({ where: { id, restaurant_id } });
    if (!reserva) throw new NotFoundException('Reserva not found');
    reserva.status = 'cancelled';
    const saved = await this.reservaRepo.save(reserva);
    this.emitter.emit(
      EVENTS.RESERVA_CANCELLED,
      new ReservaCancelledEvent(saved.id, saved.restaurant_id, new Date()),
    );
    return saved;
  }
}
```

- [ ] **Step 4.4: Ejecutar el test para verificar que pasa**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="reservas.service" --no-coverage
```

Salida esperada: `PASS` — 4 tests passed.

- [ ] **Step 4.5: Commit**

```bash
git add apps/bot-gateway/src/reservas/
git commit -m "feat(reservas): emit ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent"
```

---

## Task 5: Emitir eventos desde FeedbackService

**Files:**
- Modify: `apps/bot-gateway/src/feedback/feedback.service.ts`
- Test: `apps/bot-gateway/src/feedback/feedback.service.spec.ts`

- [ ] **Step 5.1: Escribir el test que falla**

Reemplazar `apps/bot-gateway/src/feedback/feedback.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { EVENTS, FeedbackReceivedEvent, FeedbackResolvedEvent } from '../events/domain-events';
import { NotFoundException } from '@nestjs/common';

const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
const mockEmitter = { emit: jest.fn() };

const baseFeedback = {
  id: 'fb-1', restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
  message: 'El servicio estuvo mal', sentiment_score: 0.1,
  anonymous: false, customer_name: 'Ana', customer_phone: null,
  status: 'pending', created_at: new Date(),
};

describe('FeedbackService — events', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(FeedbackService);
  });

  it('create() emits feedback.received', async () => {
    mockRepo.create.mockReturnValue(baseFeedback);
    mockRepo.save.mockResolvedValue(baseFeedback);

    await service.create({
      restaurant_id: 'r-1', session_id: 's-1', channel: 'web_widget',
      message: 'El servicio estuvo mal', sentiment_score: 0.1,
      anonymous: false, customer_name: 'Ana',
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.FEEDBACK_RECEIVED, expect.any(FeedbackReceivedEvent));
    const ev: FeedbackReceivedEvent = mockEmitter.emit.mock.calls[0][1];
    expect(ev.anonymous).toBe(false);
    expect(ev.message).toBe('El servicio estuvo mal');
  });

  it('resolve() emits feedback.resolved', async () => {
    const resolved = { ...baseFeedback, status: 'resolved' };
    mockRepo.findOne.mockResolvedValue(baseFeedback);
    mockRepo.save.mockResolvedValue(resolved);

    await service.resolve('fb-1', 'r-1');

    expect(mockEmitter.emit).toHaveBeenCalledWith(EVENTS.FEEDBACK_RESOLVED, expect.any(FeedbackResolvedEvent));
  });

  it('resolve() throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.resolve('x', 'r-1')).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 5.2: Ejecutar el test para verificar que falla**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="feedback.service" --no-coverage
```

Salida esperada: `FAIL`.

- [ ] **Step 5.3: Implementar FeedbackService con eventos**

Reemplazar `apps/bot-gateway/src/feedback/feedback.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { EVENTS, FeedbackReceivedEvent, FeedbackResolvedEvent } from '../events/domain-events';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    private readonly emitter: EventEmitter2,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepo.create({ ...dto, status: 'pending' });
    const saved = await this.feedbackRepo.save(feedback);
    this.emitter.emit(
      EVENTS.FEEDBACK_RECEIVED,
      new FeedbackReceivedEvent(
        saved.id, saved.restaurant_id, saved.message,
        saved.sentiment_score ?? null, saved.channel, saved.anonymous, saved.created_at,
      ),
    );
    return saved;
  }

  findByRestaurant(restaurant_id: string, status?: string): Promise<Feedback[]> {
    const where: Record<string, string> = { restaurant_id };
    if (status) where['status'] = status;
    return this.feedbackRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async resolve(id: string, restaurant_id: string): Promise<Feedback> {
    const fb = await this.feedbackRepo.findOne({ where: { id, restaurant_id } });
    if (!fb) throw new NotFoundException('Feedback not found');
    fb.status = 'resolved';
    const saved = await this.feedbackRepo.save(fb);
    this.emitter.emit(
      EVENTS.FEEDBACK_RESOLVED,
      new FeedbackResolvedEvent(saved.id, saved.restaurant_id, new Date()),
    );
    return saved;
  }
}
```

- [ ] **Step 5.4: Ejecutar el test para verificar que pasa**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test -- --testPathPattern="feedback.service" --no-coverage
```

Salida esperada: `PASS` — 3 tests passed.

- [ ] **Step 5.5: Commit**

```bash
git add apps/bot-gateway/src/feedback/
git commit -m "feat(feedback): emit FeedbackReceivedEvent and FeedbackResolvedEvent"
```

---

## Task 6: Auditoría de cambios — AuditLog

**Files:**
- Create: `apps/bot-gateway/src/audit/audit-log.entity.ts`
- Create: `apps/bot-gateway/src/migrations/1745500000000-CreateEventLog.ts`
- Create: `apps/bot-gateway/src/audit/audit.listener.ts`
- Create: `apps/bot-gateway/src/audit/audit.module.ts`

- [ ] **Step 6.1: Crear la entidad AuditLog**

Crear `apps/bot-gateway/src/audit/audit-log.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('event_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_name: string;

  @Column()
  restaurant_id: string;

  @Column()
  entity_id: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 6.2: Crear la migración para event_log**

Crear `apps/bot-gateway/src/migrations/1745500000000-CreateEventLog.ts`:

```typescript
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
```

- [ ] **Step 6.3: Crear el AuditListener**

Crear `apps/bot-gateway/src/audit/audit.listener.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import {
  EVENTS,
  PedidoCreatedEvent, PedidoStatusChangedEvent,
  ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent,
  FeedbackReceivedEvent, FeedbackResolvedEvent,
} from '../events/domain-events';

type DomainEvent =
  | PedidoCreatedEvent | PedidoStatusChangedEvent
  | ReservaCreatedEvent | ReservaConfirmedEvent | ReservaCancelledEvent
  | FeedbackReceivedEvent | FeedbackResolvedEvent;

@Injectable()
export class AuditListener {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  private async log(eventName: string, entityId: string, restaurantId: string, payload: DomainEvent) {
    const entry = this.auditRepo.create({
      event_name: eventName,
      restaurant_id: restaurantId,
      entity_id: entityId,
      payload: payload as unknown as Record<string, unknown>,
    });
    await this.auditRepo.save(entry);
  }

  @OnEvent(EVENTS.PEDIDO_CREATED)
  onPedidoCreated(ev: PedidoCreatedEvent) {
    return this.log(EVENTS.PEDIDO_CREATED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.PEDIDO_STATUS_CHANGED)
  onPedidoStatusChanged(ev: PedidoStatusChangedEvent) {
    return this.log(EVENTS.PEDIDO_STATUS_CHANGED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CREATED)
  onReservaCreated(ev: ReservaCreatedEvent) {
    return this.log(EVENTS.RESERVA_CREATED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  onReservaConfirmed(ev: ReservaConfirmedEvent) {
    return this.log(EVENTS.RESERVA_CONFIRMED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.RESERVA_CANCELLED)
  onReservaCancelled(ev: ReservaCancelledEvent) {
    return this.log(EVENTS.RESERVA_CANCELLED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  onFeedbackReceived(ev: FeedbackReceivedEvent) {
    return this.log(EVENTS.FEEDBACK_RECEIVED, ev.id, ev.restaurant_id, ev);
  }

  @OnEvent(EVENTS.FEEDBACK_RESOLVED)
  onFeedbackResolved(ev: FeedbackResolvedEvent) {
    return this.log(EVENTS.FEEDBACK_RESOLVED, ev.id, ev.restaurant_id, ev);
  }
}
```

- [ ] **Step 6.4: Crear AuditModule**

Crear `apps/bot-gateway/src/audit/audit.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditListener } from './audit.listener';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditListener],
})
export class AuditModule {}
```

- [ ] **Step 6.5: Verificar que el módulo compila**

```bash
cd d:/Github/warike_business
pnpm --filter bot-gateway build
```

Salida esperada: build exitoso (AuditModule, NotificationsModule, DashboardModule pueden fallar aún si no existen — completar Tasks 7 y 8 antes de hacer build completo).

- [ ] **Step 6.6: Commit**

```bash
git add apps/bot-gateway/src/audit/ apps/bot-gateway/src/migrations/
git commit -m "feat(audit): AuditLog entity, migration, and AuditListener for all domain events"
```

---

## Task 7: Notificaciones al crear un pedido

**Files:**
- Create: `apps/bot-gateway/src/notifications/notifications.listener.ts`
- Create: `apps/bot-gateway/src/notifications/notifications.module.ts`

- [ ] **Step 7.1: Crear NotificationsListener**

Crear `apps/bot-gateway/src/notifications/notifications.listener.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS, PedidoCreatedEvent, ReservaConfirmedEvent, FeedbackReceivedEvent } from '../events/domain-events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  @OnEvent(EVENTS.PEDIDO_CREATED)
  handlePedidoCreated(ev: PedidoCreatedEvent) {
    // Punto de extensión: aquí se conecta SMS (Twilio), push (FCM), o email (SendGrid)
    this.logger.log(
      `[NOTIF] Nuevo pedido #${ev.id.slice(0, 8)} — Restaurant ${ev.restaurant_id} — S/. ${ev.total} — Canal: ${ev.channel}`,
    );
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  handleReservaConfirmed(ev: ReservaConfirmedEvent) {
    this.logger.log(
      `[NOTIF] Reserva confirmada #${ev.id.slice(0, 8)} — ${ev.customer_name} — ${ev.party_size} personas — ${ev.date} ${ev.time}`,
    );
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  handleFeedbackReceived(ev: FeedbackReceivedEvent) {
    this.logger.warn(
      `[NOTIF] Feedback recibido #${ev.id.slice(0, 8)} — Restaurant ${ev.restaurant_id} — Score: ${ev.sentiment_score ?? 'N/A'}`,
    );
  }
}
```

- [ ] **Step 7.2: Crear NotificationsModule**

Crear `apps/bot-gateway/src/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsListener } from './notifications.listener';

@Module({
  providers: [NotificationsListener],
})
export class NotificationsModule {}
```

- [ ] **Step 7.3: Commit**

```bash
git add apps/bot-gateway/src/notifications/
git commit -m "feat(notifications): NotificationsListener for pedido, reserva, and feedback events"
```

---

## Task 8: Dashboard en tiempo real con SSE

**Files:**
- Create: `apps/bot-gateway/src/dashboard/dashboard.service.ts`
- Create: `apps/bot-gateway/src/dashboard/dashboard.controller.ts`
- Create: `apps/bot-gateway/src/dashboard/dashboard.module.ts`

- [ ] **Step 8.1: Crear DashboardService**

Crear `apps/bot-gateway/src/dashboard/dashboard.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  EVENTS,
  PedidoCreatedEvent, PedidoStatusChangedEvent,
  ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent,
  FeedbackReceivedEvent,
} from '../events/domain-events';

export interface DashboardEvent {
  type: string;
  restaurant_id: string;
  id: string;
  summary: string;
  urgent: boolean;
  ts: string;
}

@Injectable()
export class DashboardService {
  private readonly stream$ = new Subject<DashboardEvent>();

  getStream(restaurant_id: string) {
    return this.stream$.pipe(filter(ev => ev.restaurant_id === restaurant_id));
  }

  private push(ev: DashboardEvent) {
    this.stream$.next(ev);
  }

  @OnEvent(EVENTS.PEDIDO_CREATED)
  onPedidoCreated(ev: PedidoCreatedEvent) {
    this.push({
      type: 'pedido.created',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Nuevo pedido S/. ${ev.total} — ${ev.channel}`,
      urgent: false,
      ts: ev.created_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.PEDIDO_STATUS_CHANGED)
  onPedidoStatusChanged(ev: PedidoStatusChangedEvent) {
    this.push({
      type: 'pedido.status_changed',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Pedido ${ev.id.slice(0, 8)}: ${ev.old_status} → ${ev.new_status}`,
      urgent: ev.new_status === 'cancelled',
      ts: ev.changed_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CREATED)
  onReservaCreated(ev: ReservaCreatedEvent) {
    this.push({
      type: 'reserva.created',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Nueva reserva — ${ev.customer_name} — ${ev.party_size} personas — ${ev.date} ${ev.time}`,
      urgent: true,
      ts: ev.created_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CONFIRMED)
  onReservaConfirmed(ev: ReservaConfirmedEvent) {
    this.push({
      type: 'reserva.confirmed',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Reserva confirmada — ${ev.customer_name} — ${ev.date} ${ev.time}`,
      urgent: false,
      ts: ev.confirmed_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.RESERVA_CANCELLED)
  onReservaCancelled(ev: ReservaCancelledEvent) {
    this.push({
      type: 'reserva.cancelled',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: `Reserva cancelada #${ev.id.slice(0, 8)}`,
      urgent: false,
      ts: ev.cancelled_at.toISOString(),
    });
  }

  @OnEvent(EVENTS.FEEDBACK_RECEIVED)
  onFeedbackReceived(ev: FeedbackReceivedEvent) {
    this.push({
      type: 'feedback.received',
      restaurant_id: ev.restaurant_id,
      id: ev.id,
      summary: ev.message.substring(0, 80) + (ev.message.length > 80 ? '...' : ''),
      urgent: true,
      ts: ev.received_at.toISOString(),
    });
  }
}
```

- [ ] **Step 8.2: Crear DashboardController con endpoint SSE**

Crear `apps/bot-gateway/src/dashboard/dashboard.controller.ts`:

```typescript
import { Controller, Get, Param, Sse, UseGuards } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { JwtBusinessGuard } from '../auth/jwt-business.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Sse('stream/:restaurantId')
  @UseGuards(JwtBusinessGuard)
  stream(@Param('restaurantId') restaurantId: string): Observable<MessageEvent> {
    return this.dashboardService
      .getStream(restaurantId)
      .pipe(map(ev => ({ data: ev }) as MessageEvent));
  }
}
```

- [ ] **Step 8.3: Crear DashboardModule**

Crear `apps/bot-gateway/src/dashboard/dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
```

- [ ] **Step 8.4: Build completo para verificar que todo compila**

```bash
cd d:/Github/warike_business
pnpm --filter bot-gateway build
```

Salida esperada: sin errores TypeScript. Si hay errores de tipo, corregirlos antes de continuar.

- [ ] **Step 8.5: Ejecutar todos los tests**

```bash
cd d:/Github/warike_business/apps/bot-gateway
pnpm test --no-coverage
```

Salida esperada: todos los tests en `PASS`.

- [ ] **Step 8.6: Commit**

```bash
git add apps/bot-gateway/src/dashboard/
git commit -m "feat(dashboard): SSE endpoint /dashboard/stream/:restaurantId for real-time events"
```

---

## Task 9: Conectar SSE al dashboard Next.js (instrucciones para el frontend)

Esta tarea no modifica bot-gateway. Es la integración en el Next.js dashboard (Plan 2/3).

- [ ] **Step 9.1: Agregar hook useEventStream en el dashboard**

En el proyecto Next.js del dashboard, crear `hooks/useEventStream.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';

export interface DashboardEvent {
  type: string;
  id: string;
  summary: string;
  urgent: boolean;
  ts: string;
}

export function useEventStream(restaurantId: string, token: string) {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_BOT_GATEWAY_URL}/dashboard/stream/${restaurantId}`;
    // EventSource no soporta headers custom — usar url con query param de token
    // Bot-gateway debe aceptar token por query param para SSE
    const es = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const ev: DashboardEvent = JSON.parse(e.data);
      setEvents(prev => [ev, ...prev].slice(0, 50));
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [restaurantId, token]);

  return events;
}
```

- [ ] **Step 9.2: Ajustar JwtBusinessGuard para aceptar token por query param en SSE**

Modificar `apps/bot-gateway/src/auth/jwt-business.strategy.ts` para extraer el JWT tanto del header como del query param `token`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtBusinessStrategy extends PassportStrategy(Strategy, 'jwt-business') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.query?.token as string ?? null,
      ]),
      secretOrKey: config.get<string>('JWT_SECRET'),
      audience: config.get<string>('JWT_AUDIENCE', 'warike-business'),
    });
  }

  validate(payload: { sub: string; role: string; restaurant_id: string }) {
    return payload;
  }
}
```

- [ ] **Step 9.3: Commit**

```bash
git add apps/bot-gateway/src/auth/jwt-business.strategy.ts
git commit -m "feat(auth): accept JWT via query param ?token= for SSE connections"
```

---

## Task 10: Verificación end-to-end local

- [ ] **Step 10.1: Levantar bot-gateway en dev**

```bash
cd d:/Github/warike_business/apps/bot-gateway
cp ../../.env.example .env
# Llenar .env con las credenciales reales
pnpm start:dev
```

- [ ] **Step 10.2: Obtener un JWT válido**

```bash
curl -X POST http://localhost:3002/auth/token \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id": "TU-RESTAURANT-UUID"}'
```

Guardar el token retornado en `TOKEN`.

- [ ] **Step 10.3: Abrir stream SSE en una terminal**

```bash
curl -N -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/dashboard/stream/TU-RESTAURANT-UUID
```

Debe quedar esperando (conexión abierta).

- [ ] **Step 10.4: Crear un pedido en otra terminal y verificar el evento SSE**

```bash
curl -X POST http://localhost:3002/pedidos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "TU-RESTAURANT-UUID",
    "session_id": "test-001",
    "channel": "web_widget",
    "items": [{"name": "Lomo saltado", "price": 35, "quantity": 1}],
    "total": 35
  }'
```

Verificar que en la terminal del SSE aparece:
```
data: {"type":"pedido.created","restaurant_id":"TU-...","summary":"Nuevo pedido S/. 35 — web_widget","urgent":false,"ts":"..."}
```

- [ ] **Step 10.5: Verificar en la DB que el evento quedó en event_log**

```bash
psql -h 38.242.252.183 -U <DB_USER> -d wuarike_db \
  -c "SELECT event_name, entity_id, created_at FROM mesero_digital.event_log ORDER BY created_at DESC LIMIT 5;"
```

Debe aparecer el registro `pedido.created`.

- [ ] **Step 10.6: Commit final**

```bash
git add .
git commit -m "feat: event-driven architecture complete — audit, notifications, SSE dashboard"
```

---

## Resumen de flujo completo

```
POST /pedidos (n8n o dashboard)
       │
       ▼
PedidosService.create()
       │
       ├─── emit('pedido.created', PedidoCreatedEvent)
       │           │
       │           ├── AuditListener      → INSERT INTO event_log
       │           ├── NotificationsListener → Logger.log (extensible a SMS/push)
       │           └── DashboardService   → Subject.next() → SSE stream
       │
       └─── return Pedido (HTTP response sin cambios)
```

