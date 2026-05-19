# NBA Stats API

API REST de estadísticas históricas de la NBA desarrollada en Node.js con MongoDB.

---

## Integrantes del grupo

- Víctor Vega Martínez
- Álvaro Íñiguez Disla
- Claudia Erguido Aguilar
- Alejandro Lillo Rodriguez
- Pablo Garay Pérez
- Lorenzo Sanz Trucharte

---

## Descripción

La API permite gestionar información histórica de la NBA: equipos, jugadores y partidos. Ofrece operaciones CRUD completas, filtrado y paginación sobre la colección de partidos (más de 65000 documentos).

---

## Requisitos previos

- Node.js v18 o superior
- MongoDB Community Edition en local

---

## Instrucciones de arranque

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/AlejandroLilloRodriguez/ProyectoWeb2.git
   cd ProyectoWeb2
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo `.env` en la raíz del proyecto (no está incluido en el repositorio):
   ```
   MONGODB_URI=mongodb://localhost:27017/nba-api
   PORT=3000
   ```

4. Cargar los datos en la base de datos:
   ```bash
   npm run seed
   ```

5. Arrancar el servidor:
   ```bash
   npm run dev
   ```

La API estará disponible en `http://localhost:3000/api/v1`.

La documentación interactiva (Swagger UI) estará disponible en `http://localhost:3000/api-docs`.

---

## Modelo de datos

### Teams (Equipos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | ObjectId | Identificador único |
| `name` | String | Nombre del equipo |
| `city` | String | Ciudad |
| `abbreviation` | String | Abreviatura (única) |
| `conference` | String | Conferencia: `East` o `West` |
| `division` | String | División |
| `foundedYear` | Number | Año de fundación |
| `venue` | String | Nombre del pabellón |

### Players (Jugadores)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | ObjectId | Identificador único |
| `firstName` | String | Nombre |
| `lastName` | String | Apellidos |
| `fullName` | String | Nombre completo |
| `position` | String | Posición (G, F, C...) |
| `teamId` | ObjectId | Referencia al equipo (Teams) |
| `heightCm` | Number | Altura en cm |
| `weightKg` | Number | Peso en kg |
| `jerseyNumber` | Number | Número de camiseta |
| `active` | Boolean | Si está activo |
| `debutYear` | Number | Año de debut |

### Games (Partidos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | ObjectId | Identificador único |
| `season` | Number | Temporada (año) |
| `date` | Date | Fecha del partido |
| `status` | String | `scheduled`, `live` o `finished` |
| `phase` | String | `preseason`, `regular` o `playoff` |
| `homeTeamId` | ObjectId | Equipo local (Teams) |
| `awayTeamId` | ObjectId | Equipo visitante (Teams) |
| `homeScore` | Number | Puntos del equipo local |
| `awayScore` | Number | Puntos del equipo visitante |
| `winnerTeamId` | ObjectId | Equipo ganador (Teams) |
| `arena` | String | Nombre del pabellón |
| `city` | String | Ciudad |

**Relaciones:**
- `Players.teamId` → `Teams._id`
- `Games.homeTeamId` → `Teams._id`
- `Games.awayTeamId` → `Teams._id`
- `Games.winnerTeamId` → `Teams._id`

---

## Dataset

El dataset proviene de [Kaggle — Basketball dataset](https://www.kaggle.com/datasets/wyattowalsh/basketball) y está incluido en el repositorio en la carpeta `data/`:

- `data/teams.json` — 30 equipos
- `data/players.json` — 4831 jugadores
- `data/games.json` — 65698 partidos

---

## Rutas principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/health` | Estado del servicio |
| GET | `/api/v1/teams` | Lista equipos (filtros: `conference`, `division`, `city`, `name`) |
| POST | `/api/v1/teams` | Crea un equipo |
| GET | `/api/v1/teams/:id` | Obtiene un equipo |
| PUT | `/api/v1/teams/:id` | Reemplaza un equipo |
| PATCH | `/api/v1/teams/:id` | Actualiza parcialmente un equipo |
| DELETE | `/api/v1/teams/:id` | Elimina un equipo |
| GET | `/api/v1/teams/:id/players` | Lista jugadores del equipo |
| GET | `/api/v1/teams/:id/games` | Lista partidos del equipo |
| GET | `/api/v1/players` | Lista jugadores (filtros: `teamId`, `position`, `active`, `search`, `page`, `limit`) |
| POST | `/api/v1/players` | Crea un jugador |
| GET | `/api/v1/players/:id` | Obtiene un jugador |
| PUT | `/api/v1/players/:id` | Reemplaza un jugador |
| PATCH | `/api/v1/players/:id` | Actualiza parcialmente un jugador |
| DELETE | `/api/v1/players/:id` | Elimina un jugador |
| GET | `/api/v1/players/:id/team` | Obtiene el equipo del jugador |
| GET | `/api/v1/games` | Lista partidos (filtros: `season`, `teamId`, `status`, `phase`, `dateFrom`, `dateTo`, `winnerTeamId`, `page`, `limit`) |
| POST | `/api/v1/games` | Crea un partido |
| GET | `/api/v1/games/:id` | Obtiene un partido |
| PUT | `/api/v1/games/:id` | Reemplaza un partido |
| PATCH | `/api/v1/games/:id` | Actualiza parcialmente un partido |
| DELETE | `/api/v1/games/:id` | Elimina un partido |

---

## Documentación

- `docs/01-diseno-rest.md` — Diseño funcional de la API REST con ejemplos de mensajes
- `docs/openapi.yaml` — Especificación OpenAPI 3.1
- `http://localhost:3000/api-docs` — Swagger UI interactivo (con el servidor en marcha)
