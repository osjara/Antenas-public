# MR7901 Node Service — Antenas CTAC

Servicio **NestJS + TypeScript** que actúa como servidor TCP para lectores RFID MR7901. Recibe datos de tags desde las antenas, los mantiene en memoria para consulta rápida, los persiste en una base de datos SQLite local y los reenvía a un endpoint HTTP configurable.

El protocolo MR7901 está reimplementado íntegramente en TypeScript puro (sin DLL del fabricante), por lo que funciona con cualquier versión moderna de Node.js en cualquier arquitectura.

## Arquitectura

```
Antena MR7901
    │ TCP :4600
    ▼
TcpServerService  ──► RfidProtocolService (protocol/)
                          ├── packet.util.ts      (framing + CRC16-CCITT)
                          ├── commands.util.ts    (ACK builders)
                          └── tlv-parser.util.ts  (parser de tags TLV)
    │
    ├── TagsService (tags/) — Map en memoria, últimas lecturas
    │
    ├── TagReadingsRepository (database/) — better-sqlite3 → data/tags.db
    │       └── tabla tag_readings (histórico + flag "consumed" para integración BTP)
    │
    ├── PurgeService (scheduler/, node-cron)
    │       └── purga semanal de registros consumidos (domingo 02:00)
    │
    ├── ForwardTagService (forwarding/) ──► FORWARD_TAG_URL (POST por cada tag leído)
    │
    └── HttpApiModule (Nest, Express adapter :8080)
            ├── GET    /api/health
            ├── GET    /api/stats
            ├── GET    /api/tags
            ├── DELETE /api/tags
            ├── GET    /api/tags/:id
            ├── GET    /api/tags/pending
            ├── POST   /api/tags/consume
            ├── DELETE /api/tags/consumed
            ├── GET    /api/db/tags
            ├── GET    /api/db/stats
            ├── POST   /api/query
            ├── GET    /docs          (Swagger UI, generado por @nestjs/swagger)
            ├── GET    /openapi.json
            └── GET    /manual        (formulario web)
```

Cada módulo de dominio (`protocol`, `database`, `tags`, `forwarding`, `scheduler`, `tcp-server`, `http-api`) vive bajo `src/` como un módulo Nest independiente, inyectado vía `AppModule`.

## Requisitos

- Node.js 18+
- Windows, Linux o macOS
- `better-sqlite3` es un módulo nativo (compilado en la instalación vía `npm install`); en Windows requiere las build tools de Node (`node-gyp`) si no hay binario prebuilt disponible para la versión de Node en uso.

## Instalación

```bash
npm install
```

```bash
copy .env.example .env
```

Editar `.env` según el entorno (ver tabla de variables más abajo).

## Uso

```bash
npm run build   # compila TypeScript a dist/
npm start       # node dist/main.js
```

Para desarrollo con recarga automática:

```bash
npm run start:dev
```

El servicio arranca dos servidores dentro del mismo proceso Nest:

- **TCP** en el puerto configurado (por defecto `4600`) — escucha conexiones de antenas (implementado como `net.Server` manual, no como microservicio Nest, ya que el protocolo MR7901 es binario propietario y no RPC).
- **HTTP** en el puerto configurado (por defecto `8080`) — expone la API REST y la UI, siempre en `0.0.0.0` independientemente del `HOST` configurado para el TCP.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript (`nest build`) a `dist/` |
| `npm start` / `npm run start:prod` | Ejecuta el build compilado (`node dist/main.js`) |
| `npm run start:dev` | Ejecuta con watch mode (`nest start --watch`) |
| `npm run lint` | ESLint (`--fix`) sobre `src/` y `test/` |
| `npm run format` | Prettier sobre `src/` y `test/` |
| `npm test` | Tests unitarios (Jest) |
| `npm run test:e2e` | Tests end-to-end (Jest + Supertest) contra la app completa |

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `4600` | Puerto TCP donde escuchan las antenas |
| `HOST` | `0.0.0.0` | Interfaz de red TCP |
| `HTTP_PORT` | `8080` | Puerto para la API HTTP y Swagger |
| `FORWARD_TAG_URL` | — | URL HTTP a la que se hace POST por cada tag leído |
| `TAG_HTTP_TIMEOUT_MS` | `5000` | Timeout en ms para el reenvío HTTP |
| `LOG_LEVEL` | `info` | Usar `silent` para suprimir logs de consola |
| `DB_PATH` | `./data/tags.db` | Ruta del archivo SQLite donde se persisten las lecturas (resuelta contra el directorio desde donde se arranca el proceso) |
| `DB_MAX_ROWS` | `100000` | Límite de referencia de filas en `tag_readings` (ver purga semanal) |

Estas variables se cargan mediante `@nestjs/config` (`src/config/configuration.ts`), con los mismos nombres y valores por defecto que la versión anterior del servicio.

## API HTTP

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Estado del servicio |
| `GET` | `/api/stats` | Contador de tags en memoria |
| `GET` | `/api/tags` | Lista de tags con filtros opcionales |
| `DELETE` | `/api/tags` | Limpia todos los tags de memoria |
| `GET` | `/api/tags/:id` | Busca un tag por key decimal o tagid (en memoria) |
| `POST` | `/api/query` | Consulta con filtros por body JSON (en memoria) |
| `GET` | `/api/tags/pending` | Lista tags de SQLite con `consumed = 0` (integración BTP) |
| `POST` | `/api/tags/consume` | Marca IDs como consumidos (body `{ "ids": [1,2,3] }`) |
| `DELETE` | `/api/tags/consumed` | Elimina de SQLite los registros ya consumidos |
| `GET` | `/api/db/tags` | Consulta paginada sobre la tabla `tag_readings` (histórico persistente) |
| `GET` | `/api/db/stats` | Totales, pendientes y consumidos en SQLite |

> Nota de implementación: todas las rutas `/api/tags*` viven en un único controller (`TagsController`) con el handler `:id` declarado al final, para que `/api/tags/pending` y `/api/tags/consumed` no sean capturadas por el matcher de `:id`.

### Filtros disponibles en `/api/tags`, `/api/query` y `/api/db/tags`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tagid` | string | Filtra por ID de tag (parcial) |
| `device` | string | Filtra por serial de antena (parcial) |
| `tlvtype` | string | Filtra por tipo TLV exacto |
| `entry` | integer | `1` = entró, `0` = salió |
| `staying` | integer | `1` = permanece, `0` = salió |
| `consumed` | integer | Solo en `/api/db/tags`: `1` = consumido, `0` = pendiente |
| `limit` | integer | Máximo de resultados (default `100`, máx `1000`) |
| `offset` | integer | Paginación |

### Interfaces web

- **Swagger UI:** `http://localhost:8080/docs` (generado automáticamente por `@nestjs/swagger` a partir de decoradores en los controllers/DTOs)
- **OpenAPI JSON:** `http://localhost:8080/openapi.json`
- **Formulario manual:** `http://localhost:8080/manual`

### Formato de errores

Los errores HTTP (`400`, `404`) usan el formato estándar de NestJS: `{ "statusCode": ..., "message": ..., "error": "..." }`.

## Payload de reenvío (FORWARD_TAG_URL)

Cada tag detectado genera un `POST` con `Content-Type: application/json`:

```json
{
  "serial":     "8616940...",
  "tagid":      "16100001",
  "tlvtype":    "0x8B01",
  "canal":      1,
  "intensidad": -55,
  "in_out":     1,
  "stay":       0,
  "hora":       "2024-01-15 10:30:00"
}
```

## Estructura del proyecto

```
antenas_ctac/
├── src/
│   ├── main.ts                 # Bootstrap Nest, Swagger, ValidationPipe, shutdown ordenado
│   ├── app.module.ts           # Módulo raíz
│   ├── config/
│   │   └── configuration.ts    # Lee variables de entorno (@nestjs/config)
│   ├── protocol/                # Protocolo MR7901 puro (framing, CRC16-CCITT, TLV, ACKs)
│   │   ├── rfid-protocol.service.ts
│   │   ├── packet.util.ts / commands.util.ts / tlv-parser.util.ts / crc.util.ts
│   │   └── packet-framing.error.ts   # PacketFramingError con .code (ej. -102 = CRC inválido)
│   ├── database/                # Persistencia SQLite (better-sqlite3)
│   │   ├── database.service.ts       # Conexión, pragmas, schema
│   │   └── tag-readings.repository.ts
│   ├── tags/                    # Store en memoria + orquestación de ingesta
│   │   ├── tags.service.ts
│   │   └── tag-ingestion.service.ts
│   ├── forwarding/
│   │   └── forward-tag.service.ts    # POST a FORWARD_TAG_URL
│   ├── scheduler/
│   │   └── purge.service.ts          # Purga semanal (node-cron)
│   ├── tcp-server/
│   │   └── tcp-server.service.ts     # net.Server manual (no microservicio Nest)
│   └── http-api/
│       └── controllers/              # Health, Tags, TagsQuery, TagReadings, Manual
├── test/
│   ├── app.e2e-spec.ts          # Tests end-to-end (Jest + Supertest)
│   └── jest-e2e.json
├── data/
│   └── tags.db                  # Base de datos SQLite (WAL), generada en runtime
├── .env.example                 # Plantilla de variables de entorno
├── nest-cli.json / tsconfig*.json / eslint.config.mjs / .prettierrc
├── package.json
└── README.md
```

## Almacenamiento y ciclo de vida de los datos

Cada tag leído se guarda en dos lugares simultáneamente:

- **Memoria (`TagsService`)**: indexado por `tagid` decimal, pensado para consultas rápidas (`/api/tags`, `/api/query`, `/api/tags/:id`) sobre las últimas lecturas. Si se supera el límite de 5.000 entradas, el store se limpia automáticamente. Para limpiar manualmente usar `DELETE /api/tags`.
- **SQLite (`data/tags.db`, tabla `tag_readings`, vía `TagReadingsRepository`)**: histórico persistente entre reinicios, con modo `WAL` habilitado. Cada fila incluye un flag `consumed` pensado para integraciones externas (p. ej. un proceso BTP) que consultan `GET /api/tags/pending`, procesan los registros y los marcan con `POST /api/tags/consume`.
- **Purga automática (`PurgeService`)**: todos los domingos a las 02:00 se ejecuta `clearConsumed()` + `VACUUM` sobre SQLite, eliminando los registros ya marcados como consumidos. También puede dispararse manualmente vía `DELETE /api/tags/consumed`.

Al recibir `SIGINT`/`SIGTERM`, la app cierra ordenadamente el servidor HTTP, el servidor TCP y la conexión SQLite (con un timeout de seguridad de 1.5s por si algún recurso no responde).
