# Deploy — Mesero Digital Plan 3/3

## Paso 1: Subir bot-gateway a Railway

### 1.1 Instalar Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 1.2 Deploy desde la raíz del proyecto
```bash
cd d:/Github/warike_business
railway init
railway up
```

### 1.3 Agregar PostgreSQL en Railway
En el dashboard de Railway:
- New → Database → PostgreSQL
- Railway conecta automáticamente las variables `DATABASE_URL`

### 1.4 Configurar variables de entorno en Railway
En Railway → tu proyecto → Variables, agregar:

```
JWT_SECRET=una_clave_larga_muy_segura_20
JWT_AUDIENCE=warike-business
DB_SCHEMA=mesero_digital
DB_SSL=true
N8N_WEBHOOK_SECRET=warike-n8n-secret-2026
BOT_GATEWAY_PORT=${{PORT}}
```

> Railway genera automáticamente: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
> desde el add-on de PostgreSQL. Solo necesitas agregar las de arriba.

### 1.5 Copiar la URL pública de Railway
Después del deploy, Railway te da una URL como:
`https://bot-gateway-production.up.railway.app`

Guárdala — la necesitas para n8n.

---

## Paso 2: Configurar n8n

Abre n8n en `http://38.242.252.183:5678`

### 2.1 Agregar variables de entorno en n8n
Settings → Environment Variables:

```
ANTHROPIC_API_KEY=TU_ANTHROPIC_API_KEY
BOT_GATEWAY_URL=https://bot-gateway-production.up.railway.app
N8N_WEBHOOK_SECRET=warike-n8n-secret-2026
```

### 2.2 Importar los 4 workflows
En n8n → Workflows → Import from File

Importar en este orden:
1. `workflows/mesero-feedback.json`
2. `workflows/mesero-pedidos.json`
3. `workflows/mesero-reservas.json`
4. `workflows/mesero-core.json`  ← este último (depende de los otros 3)

Activar cada workflow con el toggle ON.

---

## Paso 3: Probar que todo funciona

```bash
curl -X POST https://TU-N8N.com/webhook/chat \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: warike-n8n-secret-2026" \
  -d '{
    "session_id": "test-001",
    "restaurant_id": "TU-RESTAURANT-UUID",
    "channel": "web_widget",
    "message": "Hola, que tienen de entrada?"
  }'
```

Respuesta esperada:
```json
{
  "message": "Hola! Tenemos... S/. ...",
  "session_id": "test-001",
  "intent": "consulta_carta"
}
```

---

## URL del webhook para conectar al canal

```
POST https://TU-N8N.com/webhook/chat
Header: x-webhook-secret: warike-n8n-secret-2026
Body: { session_id, restaurant_id, channel, message, customer_name? }
```

Esta URL es la que se conecta a WhatsApp, web widget, o la app Wuarike.
