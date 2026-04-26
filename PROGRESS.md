# Mesero Digital — Progress Report

**Proyecto:** `warike_business` — Monorepo B2B para restaurantes (Wuarike Ecosystem)
**Directorio:** `d:/Github/warike_business/`
**Fecha de último avance:** 2026-04-25
**Repositorio GitHub:** https://github.com/juans05/warike_bussinnes

---

## Estado General

| Plan | Descripción | Estado |
|------|-------------|--------|
| Plan 1/3 | Foundation: Monorepo + Types + Bot-Gateway | ✅ COMPLETO |
| Extra | Arquitectura dirigida por eventos (Event-Driven) | ✅ COMPLETO |
| Plan 2/3 | Dashboard: Next.js 14 + shadcn/ui | ⏳ Pendiente |
| Plan 3/3 | n8n AI Workflows (4 flujos) | ⏳ Pendiente |
| Deploy | Railway (bot-gateway) + n8n workflows | ⏳ Pendiente |

---

## Plan 1/3 — Foundation (COMPLETO)

### Commits realizados

| Commit | Descripción |
|--------|-------------|
| `9fa67af` | init monorepo |
| `ab32224` | init monorepo (con packages/) |
| `e6d8b70` | fix: turbo pipeline, pnpm@9.15.0, .gitignore |
| `51d4e54` | feat(types): shared TypeScript interfaces |
| `9481d7f` | fix(types): dist entry points + declarationMap + Channel type |
| `de74edd` | feat(bot-gateway): NestJS scaffold + TypeORM + ValidationPipe |
| `23a5fa1` | feat(bot-gateway): JWT business guard |
| `e829c0d` | feat(bot-gateway): TypeORM entities (6 tablas) |
| `73ed220` | feat(bot-gateway): todos los módulos — Plan 1 completo |

### Tareas completadas

- [x] **Task 1** — Monorepo Turborepo + pnpm@9.15.0 + workspace config
- [x] **Task 2** — `packages/types` — 5 archivos de interfaces TypeScript compartidas
- [x] **Task 3** — `apps/bot-gateway` — NestJS 11 scaffolded, TypeORM, ConfigModule, ValidationPipe global
- [x] **Task 4** — Auth Guard JWT — valida `role: business | admin` + `audience: warike-business`
- [x] **Task 5** — Entidades TypeORM: `restaurants`, `carta_categories`, `carta_items`, `reservas`, `pedidos`, `feedback`
- [x] **Task 6** — Módulo `carta`: CRUD completo + toggle de disponibilidad instantáneo
- [x] **Task 7** — Módulo `reservas`: create / confirm / cancel
- [x] **Task 8** — Módulo `pedidos`: create / list / updateStatus
- [x] **Task 9** — Módulo `feedback`: privado — sin endpoint de publicación a reseñas públicas
- [x] **Task 10** — Módulo `webhooks`: polling de actividad reciente para el dashboard (30s)
- [x] **Task 11** — 4 test suites, 13 tests — todos pasan ✅

### Tests

```
Test Suites: 4 passed, 4 total
Tests:       13 passed, 13 total
```

Módulos con tests: `JwtBusinessGuard`, `CartaService`, `ReservasService`, `FeedbackService`

---

## Estructura del proyecto

```
d:/Github/warike_business/
├── package.json              (pnpm@9.15.0, Turborepo)
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
│
├── packages/
│   └── types/                (@warike-business/types)
│       └── src/
│           ├── restaurant.types.ts  (BotPersona, WeekSchedule, Channel, ...)
│           ├── carta.types.ts       (CartaItem, DietaryInfo, ...)
│           ├── reserva.types.ts     (CreateReservaPayload, Reserva)
│           ├── pedido.types.ts      (CreatePedidoPayload, Pedido)
│           ├── feedback.types.ts    (CreateFeedbackPayload, Feedback)
│           └── index.ts
│
└── apps/
    └── bot-gateway/          (NestJS 11, port 3002)
        └── src/
            ├── app.module.ts
            ├── main.ts
            ├── data-source.ts
            ├── auth/          (JwtBusinessGuard + Strategy)
            ├── restaurants/   (entidad)
            ├── carta/         (CRUD + toggle)
            ├── reservas/      (create/confirm/cancel)
            ├── pedidos/       (create/list/status)
            ├── feedback/      (privado — sin endpoint público)
            └── webhooks/      (GET /webhooks/events/:restaurantId)
```

---

## API Endpoints del bot-gateway (port 3002)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/auth/verify` | JWT Business | Verificar token |
| GET | `/carta/:restaurantId` | JWT Business | Listar items |
| GET | `/carta/:restaurantId/categories` | JWT Business | Listar categorías |
| POST | `/carta/:restaurantId` | JWT Business | Crear item |
| PATCH | `/carta/:restaurantId/items/:id` | JWT Business | Actualizar item |
| PATCH | `/carta/:restaurantId/items/:id/toggle` | JWT Business | Toggle disponibilidad |
| DELETE | `/carta/:restaurantId/items/:id` | JWT Business | Eliminar item |
| POST | `/reservas` | Sin auth (n8n) | Crear reserva |
| GET | `/reservas/:restaurantId` | JWT Business | Listar reservas |
| PATCH | `/reservas/:restaurantId/:id/confirm` | JWT Business | Confirmar reserva |
| PATCH | `/reservas/:restaurantId/:id/cancel` | JWT Business | Cancelar reserva |
| POST | `/pedidos` | Sin auth (n8n) | Crear pedido |
| GET | `/pedidos/:restaurantId` | JWT Business | Listar pedidos |
| PATCH | `/pedidos/:restaurantId/:id/status/:status` | JWT Business | Cambiar estado |
| POST | `/feedback` | Sin auth (n8n) | Crear feedback privado |
| GET | `/feedback/:restaurantId` | JWT Business | Listar feedback |
| PATCH | `/feedback/:restaurantId/:id/resolve` | JWT Business | Resolver feedback |
| GET | `/webhooks/events/:restaurantId` | JWT Business | Actividad reciente (polling 30s) |

---

## Arquitectura Event-Driven (COMPLETO)

### Objetivo
Agregar event-driven architecture al bot-gateway para soportar:
- Notificaciones al crear pedidos / reservas / feedback
- Auditoría de cambios (`event_log` en PostgreSQL)
- Dashboard en tiempo real vía SSE (Server-Sent Events)

### Commits realizados

| Commit | Descripción |
|--------|-------------|
| `cc7909c` | feat(bot-gateway): install @nestjs/event-emitter y registrar EventEmitterModule |
| `093b0b6` | chore: update lockfile y fix types package name (@warike-business/types) |
| `0dbcdfa` | feat(bot-gateway): add typed domain event classes |
| `84815c1` | feat(pedidos): emit PedidoCreatedEvent y PedidoStatusChangedEvent |
| `7b1d453` | feat(reservas): emit ReservaCreatedEvent, ReservaConfirmedEvent, ReservaCancelledEvent |
| `cfa2293` | feat(feedback): emit FeedbackReceivedEvent y FeedbackResolvedEvent |
| `a660c95` | feat(audit): AuditLog entity, migration y AuditListener para todos los eventos |
| `5eef307` | feat(dashboard): SSE endpoint y NotificationsListener para eventos en tiempo real |
| `9b02352` | fix: address code review issues (audit listener, dashboard controller, migration) |
| `dfe61fb` | feat(auth): accept JWT via ?token= query param para SSE connections |
| `099000e` | chore: replace hardcoded API key con placeholder en DEPLOY.md |

### Tareas completadas

- [x] **Task 1** — Instalar `@nestjs/event-emitter` + registrar `EventEmitterModule.forRoot()`
- [x] **Task 2** — 7 clases de eventos de dominio tipados + constante `EVENTS`
- [x] **Task 3** — `PedidosService` emite `PedidoCreatedEvent` y `PedidoStatusChangedEvent`
- [x] **Task 4** — `ReservasService` emite `ReservaCreatedEvent`, `ReservaConfirmedEvent`, `ReservaCancelledEvent`
- [x] **Task 5** — `FeedbackService` emite `FeedbackReceivedEvent` y `FeedbackResolvedEvent`
- [x] **Task 6** — Entidad `AuditLog` + migración PostgreSQL (tabla `event_log`)
- [x] **Task 7** — `AuditListener`: persiste los 7 eventos en `event_log` (no-blocking con `.catch()`)
- [x] **Task 8** — `NotificationsListener`: extensión para SMS/push/email (Logger por ahora)
- [x] **Task 9** — `DashboardService` (RxJS `Subject`) + `DashboardController` (`@Sse` endpoint)
- [x] **Task 10** — JWT dual extraction: header Bearer + `?token=` query param para EventSource API

### Flujo de eventos

```
POST /pedidos → PedidosService.create()
  ├── AuditListener      → INSERT en event_log (PostgreSQL)
  ├── NotificationsListener → Logger (extensible a SMS/push/email)
  └── DashboardService   → Subject.next() → SSE → Frontend dashboard
```

### Nuevo endpoint SSE

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/dashboard/stream/:restaurantId` | JWT (`?token=`) | Stream SSE en tiempo real |

### Tests

```
Test Suites: 5 passed, 5 total
Tests:       15 passed, 15 total
```

### GitHub

Código publicado en: https://github.com/juans05/warike_bussinnes (rama `master`)

---

## Próximos pasos

### Plan 2/3 — Dashboard Next.js 14

**Directorio destino:** `apps/dashboard/`

- Next.js 14 App Router + shadcn/ui + TanStack Query + Zustand
- Pantallas: Login, Dashboard principal, Carta editor, Reservas, Pedidos, Feedback
- Auth: reusa tokens JWT de WARIKE_BACKEND (role: business)
- API Client que llama a `bot-gateway` en puerto 3002

### Plan 3/3 — n8n AI Workflows

**VPS:** `38.242.252.183` — n8n self-hosted ya instalado

4 workflows JSON listos para importar en n8n (`workflows/`):
1. `mesero-core.json` — orquestación principal + Claude claude-sonnet-4-6 system prompt
2. `mesero-pedidos.json` — flujo de toma de pedidos
3. `mesero-reservas.json` — flujo de reservas
4. `mesero-feedback.json` — flujo de feedback privado

Ver instrucciones completas en [DEPLOY.md](DEPLOY.md)

### Deploy — Railway + n8n

- [ ] `railway init` + `railway up` desde `d:/Github/warike_business`
- [ ] Agregar PostgreSQL add-on en Railway
- [ ] Configurar variables de entorno en Railway (ver DEPLOY.md §1.4)
- [ ] Copiar URL pública de Railway para usarla en n8n
- [ ] Importar 4 workflows en n8n (`http://38.242.252.183:5678`)
- [ ] Activar cada workflow con toggle ON
- [ ] Test end-to-end con `curl` (ver DEPLOY.md §3)

---

## Notas técnicas

- **JWT Strategy**: tokens emitidos por WARIKE_BACKEND, validados por bot-gateway con `audience: warike-business`
- **Feedback invariante**: no existe ningún endpoint que publique feedback a reseñas públicas de Wuarike
- **n8n endpoints sin auth**: `POST /reservas`, `POST /pedidos`, `POST /feedback` — n8n se autentica por header secreto (configurar en n8n)
- **Base de datos**: PostgreSQL `wuarike_db` — **misma DB que WARIKE_BACKEND**, schema separado `mesero_digital`
- **Conexión**: Solo acepta desde localhost (VPS). En local se necesita tunnel SSH: `ssh -L 5433:localhost:5432 user@38.242.252.183`
- **Migración pendiente**: Crear schema y ejecutar migraciones cuando bot-gateway esté desplegado en VPS
