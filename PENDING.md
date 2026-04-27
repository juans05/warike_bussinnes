# Mesero Digital — Tareas Pendientes

**Fecha:** 2026-04-25

---

## Plan 2/3 — Dashboard Next.js 14 ⏳

**Directorio destino:** `apps/dashboard/`

- [ ] Scaffold Next.js 14 App Router + shadcn/ui + TanStack Query + Zustand
- [ ] Pantalla **Login** (reusa JWT de WARIKE_BACKEND, role: business)
- [ ] **Dashboard principal** — métricas y resumen de actividad
- [ ] **Carta editor** — CRUD de items + toggle de disponibilidad instantáneo
- [ ] **Reservas** — listado + confirmar / cancelar
- [ ] **Pedidos** — listado + cambio de estado
- [ ] **Feedback** — listado + resolver
- [ ] API Client que conecta al `bot-gateway` en puerto 3002

---

## Plan 3/3 — n8n AI Workflows ⏳

**VPS:** `38.242.252.183` — n8n self-hosted ya instalado

- [ ] `mesero-core` — orquestación principal + Claude Sonnet system prompt
- [ ] `mesero-pedidos` — flujo de toma de pedidos
- [ ] `mesero-reservas` — flujo de reservas
- [ ] `mesero-feedback` — flujo de feedback privado

---

## Infraestructura pendiente

- [ ] Desplegar `bot-gateway` en el VPS
- [ ] Crear schema `mesero_digital` en PostgreSQL y ejecutar migraciones
- [ ] Configurar header secreto en n8n para endpoints sin auth (`POST /reservas`, `POST /pedidos`, `POST /feedback`)
