# Paso a paso — NBA Stats API (SW2, CEU)

> Guía de implementación completa para el grupo de 6 personas.  
> Objetivo: cumplir **todos** los requisitos del enunciado de la forma más simple y limpia posible.  
> Sigue el orden. Cada fase tiene checklist con tareas concretas y asignación sugerida.

---

## Índice

1. [Configuración inicial](#fase-0)
2. [Fase 1 — Datos: Kaggle → JSON](#fase-1)
3. [Fase 2 — Esqueleto del proyecto Node.js](#fase-2)
4. [Fase 3 — CRUD: Teams, Players, Games](#fase-3)
5. [Fase 4 — Funcionalidades avanzadas](#fase-4)
6. [Fase 5 — Pulido, pruebas y entrega final](#fase-5)
7. [División de trabajo sugerida](#division)
8. [Checklist final contra el enunciado](#checklist-final)

---

## Requisitos que hay que cumplir (resumen rápido)

Antes de empezar, tened claro lo que pide el enunciado:

- API en **Node.js** con operaciones **CRUD** sobre MongoDB
- **3 colecciones** relacionadas entre sí (teams, players, games)
- **1 colección con +1000 documentos** (games) con paginación y filtrado
- **Mensajes en JSON y XML** (al menos uno de cada en la API propia)
- **Schema XSD** asociado al mensaje XML
- **API externa** integrada: consume al menos 1 mensaje XML y 1 JSON, datos guardados en BD
- La API propia debe funcionar **aunque la API externa esté caída**
- **Script `npm run seed`** para cargar los datos automáticamente
- **Dataset en el repositorio** para inicializar las colecciones
- Documentación: diseño REST, OpenAPI, modelo de datos, README completo

Todo esto ya está pensado y diseñado. Las rutas están en `docs/openapi.yaml`. Solo hay que implementarlo.

---

<a name="fase-0"></a>
## Configuración inicial

### Tareas

- [ ] Verificar que todos tienen instalado:
  - Node.js v18 o superior (`node --version`)
  - MongoDB Community Edition en local (`mongod --version`)
  - Git configurado con la cuenta del repo (`git config --list`)
  - Un cliente MongoDB (recomendado: **MongoDB Compass** — es gratuito y visual)
- [ ] Clonar el repositorio: `git clone <url-repo>`
- [ ] Abrir el proyecto en VSCode con la extensión **MongoDB for VS Code** instalada
- [ ] Revisar juntos `docs/openapi.yaml` y `docs/01-diseno-rest.md` para que todos entiendan qué hay que construir
- [ ] Crear el archivo `.env` en local (no commitear) con:
  ```
  MONGODB_URI=mongodb://localhost:27017/nba-api
  PORT=3000
  ```

---

<a name="fase-1"></a>
## Fase 1 — Datos: Kaggle → JSON

> **FASE COMPLETADA** — Los JSON ya estan en el repo.

### 1.1 Descargar el dataset de Kaggle

- [x] Ir a [kaggle.com/datasets/wyattowalsh/basketball](https://www.kaggle.com/datasets/wyattowalsh/basketball)
- [x] Iniciar sesión en Kaggle (o crear cuenta gratis)
- [x] Descargar el dataset (botón "Download") — viene en zip con CSVs y/o SQLite
- [x] Descomprimir en una carpeta temporal **fuera del repo** (los archivos son grandes)

El dataset contiene tablas como `game.csv`, `player.csv`, `team.csv` y más. Hay datos desde la temporada 1946-47 hasta la actual.

### 1.2 Explorar los datos

- [x] Abrir el archivo `game.csv` o `basketball.sqlite` con:
  - **Excel / LibreOffice** para ver columnas a ojo
  - O **DB Browser for SQLite** (gratuito) si el dataset viene en `.sqlite`
- [x] Identificar las columnas que nos interesan en cada tabla:

  **teams** → `id`, `full_name`, `city`, `abbreviation`, `conference`, `division`, `year_founded`, `arena`

  **players** → `id`, `first_name`, `last_name`, `display_first_last`, `position`, `team_id`, `height`, `weight`, `jersey`, `is_active`, `from_year`

  **games** → `game_id`, `season_id`, `game_date`, `team_id_home`, `team_id_away`, `pts_home`, `pts_away`, `wl_home`, `arena_name`, `game_status_text` y similares

### 1.3 Convertir a JSON con Python

Python es la herramienta más rápida para esto. Si no tienes Python, instala la versión 3.x.

- [x] Instalar pandas si no lo tienes: `pip install pandas`
- [x] Crear un script de conversión `scripts/convert-data.py` con este contenido:

```python
import pandas as pd
import json
import math

def clean(val):
    """Convierte NaN y tipos numpy a tipos Python nativos."""
    if isinstance(val, float) and math.isnan(val):
        return None
    if hasattr(val, 'item'):
        return val.item()
    return val

# --- TEAMS ---
df_teams = pd.read_csv('ruta/a/team.csv')
teams = []
for _, row in df_teams.iterrows():
    teams.append({
        "name": clean(row.get('full_name') or row.get('nickname')),
        "city": clean(row.get('city')),
        "abbreviation": clean(row.get('abbreviation')),
        "conference": clean(row.get('conference')),
        "division": clean(row.get('division')),
        "foundedYear": clean(row.get('year_founded')),
        "venue": clean(row.get('arena')),
        "_kaggleId": clean(row.get('id') or row.get('team_id'))
    })

with open('data/teams.json', 'w', encoding='utf-8') as f:
    json.dump(teams, f, ensure_ascii=False, indent=2)
print(f"Teams: {len(teams)}")

# --- PLAYERS ---
df_players = pd.read_csv('ruta/a/player.csv')
players = []
for _, row in df_players.iterrows():
    players.append({
        "firstName": clean(row.get('first_name')),
        "lastName": clean(row.get('last_name')),
        "fullName": clean(row.get('display_first_last') or f"{row.get('first_name')} {row.get('last_name')}"),
        "position": clean(row.get('position')),
        "active": bool(row.get('is_active', False)),
        "debutYear": clean(row.get('from_year')),
        "_kaggleTeamId": clean(row.get('team_id'))
    })

with open('data/players.json', 'w', encoding='utf-8') as f:
    json.dump(players, f, ensure_ascii=False, indent=2)
print(f"Players: {len(players)}")

# --- GAMES (limitamos a los más recientes si hay demasiados) ---
df_games = pd.read_csv('ruta/a/game.csv')
games = []
for _, row in df_games.iterrows():
    home_pts = clean(row.get('pts_home'))
    away_pts = clean(row.get('pts_away'))
    wl_home = str(row.get('wl_home', '')).strip().upper()
    games.append({
        "season": int(str(clean(row.get('season_id', '0')))[1:5] or 0),
        "date": str(clean(row.get('game_date'))),
        "status": "finished",
        "phase": "regular",
        "homeScore": int(home_pts) if home_pts is not None else None,
        "awayScore": int(away_pts) if away_pts is not None else None,
        "arena": clean(row.get('arena_name')),
        "_kaggleHomeTeamId": clean(row.get('team_id_home')),
        "_kaggleAwayTeamId": clean(row.get('team_id_away')),
        "_kaggleWinnerHome": wl_home == 'W'
    })

with open('data/games.json', 'w', encoding='utf-8') as f:
    json.dump(games, f, ensure_ascii=False, indent=2)
print(f"Games: {len(games)}")
```

- [x] Ejecutar: `python scripts/convert-data.py`
- [x] Verificar que:
  - `data/teams.json` tiene ~30 equipos (30 generados)
  - `data/players.json` tiene cientos de jugadores (4831 generados)
  - `data/games.json` tiene **más de 1000 documentos** (65698 generados)

> **Nota**: Los archivos `data/*.json` **sí van al repo** — son el dataset que pide el enunciado para inicializar la BD.

### 1.4 Verificar la calidad del JSON

- [x] Abrir los archivos JSON en VSCode y revisar que los datos tienen sentido
- [x] Comprobar que no hay arrays completamente vacíos o campos con `null` en exceso

---

<a name="fase-2"></a>
## Fase 2 — Esqueleto del proyecto Node.js



### 2.1 Inicializar el proyecto

- [ ] Dentro de `ProyectoWeb2/`:
  ```bash
  npm init -y
  ```
- [ ] Instalar dependencias de producción:
  ```bash
  npm install express mongoose dotenv xml2js
  ```
- [ ] Instalar dependencias de desarrollo:
  ```bash
  npm install --save-dev nodemon
  ```
- [ ] Añadir scripts en `package.json`:
  ```json
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node scripts/seed.js"
  }
  ```
- [ ] Crear `.gitignore` con:
  ```
  node_modules/
  .env
  ```

### 2.2 Crear la estructura de carpetas

- [ ] Crear la siguiente estructura (en `ProyectoWeb2/`):
  ```
  src/
    server.js
    app.js
    config/
      db.js
    models/
      Team.js
      Player.js
      Game.js
    routes/
      teams.js
      players.js
      games.js
      health.js
    controllers/
      teamsController.js
      playersController.js
      gamesController.js
    middleware/
      xmlResponse.js
      errorHandler.js
    services/
      externalApi.js
  scripts/
    seed.js
  data/
    teams.json
    players.json
    games.json
  ```

### 2.3 Conexión a MongoDB

- [ ] Crear `src/config/db.js`:
  ```javascript
  const mongoose = require('mongoose');

  async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  }

  module.exports = connectDB;
  ```

### 2.4 Crear los modelos Mongoose

- [ ] Crear `src/models/Team.js`:
  ```javascript
  const { Schema, model } = require('mongoose');

  const teamSchema = new Schema({
    name:         { type: String, required: true },
    city:         { type: String, required: true },
    abbreviation: { type: String, required: true, unique: true, uppercase: true },
    conference:   { type: String, required: true, enum: ['East', 'West'] },
    division:     { type: String, required: true },
    foundedYear:  { type: Number },
    venue:        { type: String },
  });

  module.exports = model('Team', teamSchema);
  ```

- [ ] Crear `src/models/Player.js`:
  ```javascript
  const { Schema, model, Types } = require('mongoose');

  const playerSchema = new Schema({
    firstName:   { type: String, required: true },
    lastName:    { type: String, required: true },
    fullName:    { type: String, required: true },
    position:    { type: String },
    teamId:      { type: Types.ObjectId, ref: 'Team', required: true },
    heightCm:    { type: Number },
    weightKg:    { type: Number },
    jerseyNumber:{ type: Number },
    active:      { type: Boolean, required: true, default: true },
    debutYear:   { type: Number },
  });

  module.exports = model('Player', playerSchema);
  ```

- [ ] Crear `src/models/Game.js`:
  ```javascript
  const { Schema, model, Types } = require('mongoose');

  const gameSchema = new Schema({
    season:       { type: Number, required: true },
    date:         { type: Date, required: true },
    status:       { type: String, required: true, enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
    phase:        { type: String, required: true, enum: ['preseason', 'regular', 'playoff'], default: 'regular' },
    homeTeamId:   { type: Types.ObjectId, ref: 'Team', required: true },
    awayTeamId:   { type: Types.ObjectId, ref: 'Team', required: true },
    homeScore:    { type: Number },
    awayScore:    { type: Number },
    winnerTeamId: { type: Types.ObjectId, ref: 'Team' },
    arena:        { type: String },
    city:         { type: String },
    attendance:   { type: Number },
    externalSource: {
      provider:   String,
      externalId: String,
      syncedAt:   Date,
    },
  });

  module.exports = model('Game', gameSchema);
  ```

### 2.5 Crear el Express app

- [ ] Crear `src/app.js`:
  ```javascript
  const express = require('express');
  const app = express();

  app.use(express.json());

  const teamsRouter   = require('./routes/teams');
  const playersRouter = require('./routes/players');
  const gamesRouter   = require('./routes/games');
  const healthRouter  = require('./routes/health');
  const errorHandler  = require('./middleware/errorHandler');

  app.use('/api/v1/health',   healthRouter);
  app.use('/api/v1/teams',    teamsRouter);
  app.use('/api/v1/players',  playersRouter);
  app.use('/api/v1/games',    gamesRouter);

  app.use(errorHandler);

  module.exports = app;
  ```

- [ ] Crear `src/server.js`:
  ```javascript
  require('dotenv').config();
  const app = require('./app');
  const connectDB = require('./config/db');

  const PORT = process.env.PORT || 3000;

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}/api/v1`);
    });
  });
  ```

- [ ] Verificar que arranca: `npm run dev` → debe verse "MongoDB conectado" y "Servidor en..."

### 2.6 Script de seed

El seed carga los datos en este orden: primero teams, luego players (necesita IDs de teams), luego games (necesita IDs de teams).

- [ ] Crear `scripts/seed.js`:
  ```javascript
  require('dotenv').config();
  const mongoose = require('mongoose');
  const Team   = require('../src/models/Team');
  const Player = require('../src/models/Player');
  const Game   = require('../src/models/Game');
  const teamsData   = require('../data/teams.json');
  const playersData = require('../data/players.json');
  const gamesData   = require('../data/games.json');

  async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    await Team.deleteMany({});
    await Player.deleteMany({});
    await Game.deleteMany({});
    console.log('Colecciones limpiadas');

    // Insertar teams y guardar mapa kaggleId → ObjectId de Mongo
    const insertedTeams = await Team.insertMany(teamsData);
    const teamMap = {};
    insertedTeams.forEach((t, i) => {
      const kaggleId = teamsData[i]._kaggleId;
      if (kaggleId) teamMap[String(kaggleId)] = t._id;
    });
    console.log(`Teams insertados: ${insertedTeams.length}`);

    // Insertar players — sustituir _kaggleTeamId por ObjectId real
    const defaultTeamId = insertedTeams[0]._id;
    const playersToInsert = playersData.map(p => ({
      firstName:  p.firstName,
      lastName:   p.lastName,
      fullName:   p.fullName,
      position:   p.position,
      active:     p.active,
      debutYear:  p.debutYear,
      teamId:     teamMap[String(p._kaggleTeamId)] || defaultTeamId,
    }));
    const insertedPlayers = await Player.insertMany(playersToInsert, { ordered: false });
    console.log(`Players insertados: ${insertedPlayers.length}`);

    // Insertar games — sustituir _kaggleHomeTeamId / _kaggleAwayTeamId
    const gamesToInsert = gamesData
      .filter(g => teamMap[String(g._kaggleHomeTeamId)] && teamMap[String(g._kaggleAwayTeamId)])
      .map(g => {
        const homeId  = teamMap[String(g._kaggleHomeTeamId)];
        const awayId  = teamMap[String(g._kaggleAwayTeamId)];
        const winnerId = g._kaggleWinnerHome ? homeId : awayId;
        return {
          season:       g.season || 2000,
          date:         new Date(g.date || '2000-01-01'),
          status:       'finished',
          phase:        g.phase || 'regular',
          homeTeamId:   homeId,
          awayTeamId:   awayId,
          homeScore:    g.homeScore,
          awayScore:    g.awayScore,
          winnerTeamId: winnerId,
          arena:        g.arena,
        };
      });
    const insertedGames = await Game.insertMany(gamesToInsert, { ordered: false });
    console.log(`Games insertados: ${insertedGames.length}`);

    await mongoose.disconnect();
    console.log('Seed completado.');
  }

  seed().catch(err => { console.error(err); process.exit(1); });
  ```

- [ ] Ejecutar `npm run seed` y verificar en MongoDB Compass que las tres colecciones tienen datos
- [ ] Confirmar que `games` tiene más de 1000 documentos

---

<a name="fase-3"></a>
## Fase 3 — CRUD: Teams, Players, Games



### Patrón que hay que repetir (igual para los tres recursos)

Para cada recurso (teams, players, games) el flujo es siempre el mismo: definir la ruta, crear el controller con la logica, y usar el modelo de Mongoose para acceder a la base de datos.

### 3.1 Health (rápido, cualquiera lo puede hacer)

- [ ] Crear `src/routes/health.js`:
  ```javascript
  const router = require('express').Router();

  router.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'nba-api', timestamp: new Date() });
  });

  module.exports = router;
  ```

### 3.2 Error handler centralizado

- [ ] Crear `src/middleware/errorHandler.js`:
  ```javascript
  function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    res.status(status).json({
      error: {
        code:    err.code    || 'INTERNAL_ERROR',
        message: err.message || 'Error interno del servidor',
      }
    });
  }

  module.exports = errorHandler;
  ```

### 3.3 Teams — CRUD completo

- [ ] Crear `src/routes/teams.js`:
  ```javascript
  const router = require('express').Router();
  const ctrl = require('../controllers/teamsController');
  const xmlResponse = require('../middleware/xmlResponse');

  router.get('/',                    ctrl.listTeams);
  router.post('/',                   ctrl.createTeam);
  router.get('/:teamId',  xmlResponse, ctrl.getTeamById);
  router.put('/:teamId',             ctrl.replaceTeam);
  router.patch('/:teamId',           ctrl.patchTeam);
  router.delete('/:teamId',          ctrl.deleteTeam);
  router.get('/:teamId/players',     ctrl.listPlayersByTeam);
  router.get('/:teamId/games',       ctrl.listGamesByTeam);

  module.exports = router;
  ```

- [ ] Crear `src/controllers/teamsController.js` con estos handlers:
  - `listTeams`: filtra por `conference`, `division`, `city`, `name` si vienen en query
  - `createTeam`: `Team.create(req.body)`, devuelve 201
  - `getTeamById`: `Team.findById(teamId)`, devuelve 404 si no existe
  - `replaceTeam`: `Team.findByIdAndReplace(...)` 
  - `patchTeam`: `Team.findByIdAndUpdate(teamId, req.body, { new: true })`
  - `deleteTeam`: `Team.findByIdAndDelete(teamId)`, devuelve 204
  - `listPlayersByTeam`: `Player.find({ teamId })` con paginación básica
  - `listGamesByTeam`: `Game.find({ $or: [{ homeTeamId: id }, { awayTeamId: id }] })` con paginación

### 3.4 Players — CRUD completo

- [ ] Crear `src/routes/players.js` con las rutas de players (igual que teams)
- [ ] Crear `src/controllers/playersController.js`:
  - `listPlayers`: filtros `teamId`, `position`, `active`, busqueda por nombre (`search` busca coincidencias parciales en `fullName`), paginacion
  - `createPlayer`: validar que `teamId` existe antes de crear
  - `getPlayerById`: findById con 404
  - `replacePlayer`, `patchPlayer`, `deletePlayer`: igual que teams
  - `getTeamByPlayer`: busca el jugador, luego busca su `teamId`

### 3.5 Games — CRUD completo

- [ ] Crear `src/routes/games.js` con las rutas de games
- [ ] Crear `src/controllers/gamesController.js`:
  - `listGames`: filtros `season`, `teamId` (home o away), `status`, `phase`, `dateFrom`, `dateTo`, `winnerTeamId`, **paginación obligatoria**
  - `createGame`: validar que `homeTeamId` y `awayTeamId` existen
  - `getGameById`, `replaceGame`, `patchGame`, `deleteGame`: igual

### Paginación (patrón estándar para games y players)

Usar siempre este patrón en los listados paginados:

```javascript
async function listGames(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query); // construir filtro según query params

    const [data, totalItems] = await Promise.all([
      Game.find(filter).skip(skip).limit(limit),
      Game.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (err) {
    next(err);
  }
}
```

---

<a name="fase-4"></a>
## Fase 4 — Funcionalidades avanzadas



### 4.1 Soporte XML en GET /teams/:teamId

El enunciado pide **al menos un mensaje en XML con schema XSD asociado**. Lo implementamos en `GET /teams/:teamId`.

- [ ] Instalar `xml2js` (ya está instalado desde Fase 2)

- [ ] Crear `src/middleware/xmlResponse.js`:
  ```javascript
  const xml2js = require('xml2js');

  function xmlResponse(req, res, next) {
    const accept = req.headers['accept'] || '';
    if (!accept.includes('application/xml')) return next();

    // Guardamos referencia al método json original
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      const builder = new xml2js.Builder({ rootName: 'Team', xmldec: { version: '1.0', encoding: 'UTF-8' } });
      const xml = builder.buildObject(data);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    };

    next();
  }

  module.exports = xmlResponse;
  ```

- [ ] Crear `docs/team.xsd` — schema XSD del mensaje XML:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Team">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="id"           type="xs:string"/>
          <xs:element name="name"         type="xs:string"/>
          <xs:element name="city"         type="xs:string"/>
          <xs:element name="abbreviation" type="xs:string"/>
          <xs:element name="conference"   type="xs:string"/>
          <xs:element name="division"     type="xs:string"/>
          <xs:element name="foundedYear"  type="xs:integer" minOccurs="0"/>
          <xs:element name="venue"        type="xs:string"  minOccurs="0"/>
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>
  ```

- [ ] Probar con curl:
  ```bash
  curl -H "Accept: application/xml" http://localhost:3000/api/v1/teams/<teamId>
  ```

### 4.2 Integración con API externa (balldontlie)

El enunciado pide:
- Consumir al menos **1 mensaje en JSON** de la API externa
- Consumir al menos **1 mensaje en XML** de la API externa
- Los datos consumidos deben **guardarse en MongoDB**
- La API propia debe funcionar **aunque la externa esté caída** (los datos ya están en BD)

**balldontlie** es una API pública de estadísticas NBA. Ofrece datos en JSON. Para el requisito de XML usaremos otra fuente o convertimos internamente.

> Alternativa para XML externo: la API pública de **ESPN** devuelve algunos endpoints en XML. Otra opción es usar una API RSS de noticias deportivas. Lo más simple: consumir un endpoint de ESPN que devuelva XML.

#### Paso a paso:

- [ ] Crear `src/services/externalApi.js`:

```javascript
const https = require('https');

// Consume datos JSON de balldontlie
async function fetchTeamsFromBalldontlie() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.balldontlie.io',
      path: '/v1/teams',
      method: 'GET',
      headers: { 'Authorization': process.env.BALLDONTLIE_API_KEY || '' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

// Consume datos XML de ESPN (standings en XML como ejemplo)
async function fetchStandingsXML() {
  return new Promise((resolve, reject) => {
    https.get('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

module.exports = { fetchTeamsFromBalldontlie, fetchStandingsXML };
```

- [ ] Crear una ruta de sincronización `POST /api/v1/sync` (o incluirlo en el seed) que:
  1. Llama a `fetchTeamsFromBalldontlie()` → recibe JSON → guarda/actualiza teams en MongoDB
  2. Llama a `fetchStandingsXML()` → recibe XML → parsea con `xml2js` → guarda en MongoDB
  3. Si falla la llamada externa, captura el error y devuelve los datos que ya hay en BD (la API sigue funcionando)

- [ ] Guardar en los documentos de MongoDB el campo `externalSource` con `{ provider, externalId, syncedAt }` para acreditar que vienen de la API externa

- [ ] Añadir gestión de errores explícita para el caso de API externa caída:
  ```javascript
  try {
    const externalData = await fetchTeamsFromBalldontlie();
    // procesar y guardar...
  } catch (err) {
    console.warn('API externa no disponible, usando datos en BD:', err.message);
    // simplemente continuar — los datos ya están en MongoDB desde el seed
  }
  ```

> **Nota sobre la API key de balldontlie**: tienen un tier gratuito sin key para peticiones limitadas. Revisar su documentación en `balldontlie.io`. Añadir la key al `.env` si es necesario.

---

<a name="fase-5"></a>
## Fase 5 — Pulido, pruebas y entrega final



### 5.1 Pruebas manuales de todos los endpoints

Usar **Postman** o **Thunder Client** (extensión VSCode). Probar:

- [ ] `GET /api/v1/health` → `{ status: "ok", ... }`
- [ ] `POST /api/v1/teams` → 201 con el equipo creado
- [ ] `GET /api/v1/teams` → lista de equipos
- [ ] `GET /api/v1/teams?conference=West` → solo equipos del oeste
- [ ] `GET /api/v1/teams/:id` → 200 JSON
- [ ] `GET /api/v1/teams/:id` con header `Accept: application/xml` → 200 XML
- [ ] `PATCH /api/v1/teams/:id` → actualización parcial
- [ ] `DELETE /api/v1/teams/:id` → 204
- [ ] `GET /api/v1/players?active=true&page=1&limit=10` → lista paginada
- [ ] `GET /api/v1/games?season=2020&page=2&limit=25` → lista paginada con filtro
- [ ] `GET /api/v1/games?dateFrom=2020-01-01&dateTo=2020-12-31` → filtro por fecha
- [ ] `GET /api/v1/teams/:id/players` → jugadores del equipo
- [ ] `GET /api/v1/teams/:id/games` → partidos del equipo
- [ ] `GET /api/v1/players/:id/team` → equipo del jugador

### 5.2 Verificar manejo de errores

- [ ] `GET /api/v1/teams/id-que-no-existe` → 404 con `{ error: { code: "NOT_FOUND", ... } }`
- [ ] `POST /api/v1/games` sin campos obligatorios → 422
- [ ] `POST /api/v1/teams` con abbreviation duplicada → 409

### 5.3 README final

El README del repo debe incluir (es requisito del enunciado):

- [ ] Descripción del proyecto
- [ ] Integrantes del grupo
- [ ] Instrucciones para arrancar:
  1. `git clone ...`
  2. `cd ProyectoWeb2 && npm install`
  3. Crear `.env` con `MONGODB_URI` y `PORT`
  4. `npm run seed` (carga los datos)
  5. `npm run dev` (arranca el servidor)
- [ ] Enlace a la documentación: `docs/openapi.yaml` y `docs/01-diseno-rest.md`
- [ ] Credenciales o instrucciones de acceso a la API externa (balldontlie key si aplica)
- [ ] Modelo de datos (puede ser un diagrama simple o tabla)

### 5.4 Revisión final contra el enunciado

Ir al checklist de abajo y marcar todo antes de entregar.

---

<a name="division"></a>
## División de trabajo sugerida (6 personas)

| Persona | Tarea principal |
|---------|----------------|
| **Persona 1** | Fase 1 completa: descargar Kaggle, script Python de conversión, verificar JSONs |
| **Persona 2** | Fase 2 completa: estructura Node.js, modelos Mongoose, app.js, seed.js |
| **Persona 3** | Fase 3: CRUD de Teams + middleware XML + XSD |
| **Persona 4** | Fase 3: CRUD de Players con filtros y paginación |
| **Persona 5** | Fase 3: CRUD de Games con filtros y paginación |
| **Persona 6** | Fase 4: integración API externa (JSON + XML) + health + error handler + README |



---

<a name="checklist-final"></a>
## Checklist final contra el enunciado

Marca todo esto antes de la entrega. Si algo no está marcado, no está hecho.

### Requisitos obligatorios

- [ ] API programada en **Node.js**
- [ ] Base de datos **MongoDB**
- [ ] **3 colecciones** con datos: `teams`, `players`, `games`
- [ ] Las colecciones están **relacionadas entre sí** (teamId en players, homeTeamId/awayTeamId en games)
- [ ] CRUD completo sobre las 3 colecciones
- [ ] **Al menos un mensaje en JSON** en la API propia ✓ (todos los endpoints)
- [ ] **Al menos un mensaje en XML** en la API propia ✓ (`GET /teams/:teamId` con `Accept: application/xml`)
- [ ] El mensaje XML tiene un **schema XSD** asociado ✓ (`docs/team.xsd`)
- [ ] La colección `games` tiene **más de 1000 documentos**
- [ ] `GET /games` tiene **paginación** (`page`, `limit`, `totalItems`, `totalPages`, ...)
- [ ] `GET /games` tiene **filtrado** (`season`, `teamId`, `status`, `phase`, `dateFrom`, `dateTo`)
- [ ] **API externa integrada**: datos consumidos y guardados en MongoDB
- [ ] La API externa consume al menos **1 mensaje JSON**
- [ ] La API externa consume al menos **1 mensaje XML**
- [ ] La API propia **funciona aunque la externa esté caída** (try/catch + datos en BD)
- [ ] **Script `npm run seed`** que carga los datos automáticamente
- [ ] **Dataset en el repositorio** (`data/teams.json`, `data/players.json`, `data/games.json`)

### Documentación

- [ ] `docs/01-diseno-rest.md` — diseño funcional REST con ejemplos ✓ (ya hecho)
- [ ] `docs/openapi.yaml` — especificación OpenAPI 3.1 ✓ (ya hecho)
- [ ] `docs/team.xsd` — schema XSD del mensaje XML
- [ ] `README.md` — instrucciones completas para arrancar el proyecto
- [ ] `README.md` — lista de integrantes del grupo ✓
- [ ] Modelo de datos documentado (en README o en docs/)

