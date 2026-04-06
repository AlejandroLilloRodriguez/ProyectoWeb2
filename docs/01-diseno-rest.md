# Diseño de la API REST

## Objetivo

La API proporciona acceso a información histórica y operativa de la NBA mediante una interfaz REST. El diseño define tres recursos principales relacionados entre sí:

- `teams`: equipos NBA.
- `players`: jugadores NBA.
- `games`: partidos NBA.

## Recursos principales

### Teams

Representa un equipo NBA.

Campos funcionales más relevantes:

- `name`
- `city`
- `abbreviation`
- `conference`
- `division`
- `foundedYear`
- `venue`

Relaciones:

- Un equipo tiene muchos jugadores.
- Un equipo participa en muchos partidos como local o visitante.

### Players

Representa un jugador de la NBA.

Campos funcionales más relevantes:

- `firstName`
- `lastName`
- `fullName`
- `position`
- `teamId`
- `heightCm`
- `weightKg`
- `jerseyNumber`
- `active`
- `debutYear`

Relaciones:

- Un jugador pertenece a un equipo.

### Games

Representa un partido NBA.

Campos funcionales más relevantes:

- `season`
- `date`
- `status`
- `phase`
- `homeTeamId`
- `awayTeamId`
- `homeScore`
- `awayScore`
- `winnerTeamId`
- `arena`

Relaciones:

- Un partido referencia a dos equipos.
- La colección `games` será la colección masiva del sistema, con al menos 1000 documentos.

## Rutas del servicio

### Teams

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/teams` | Lista equipos con filtros opcionales |
| POST | `/api/v1/teams` | Crea un equipo |
| GET | `/api/v1/teams/{teamId}` | Recupera un equipo |
| PUT | `/api/v1/teams/{teamId}` | Reemplaza un equipo |
| PATCH | `/api/v1/teams/{teamId}` | Actualiza parcialmente un equipo |
| DELETE | `/api/v1/teams/{teamId}` | Elimina un equipo |
| GET | `/api/v1/teams/{teamId}/players` | Lista los jugadores del equipo |
| GET | `/api/v1/teams/{teamId}/games` | Lista partidos del equipo |

Filtros previstos para `GET /teams`:

- `conference`
- `division`
- `city`
- `name`

## Players

### Players

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/players` | Lista jugadores con filtros y paginación |
| POST | `/api/v1/players` | Crea un jugador |
| GET | `/api/v1/players/{playerId}` | Recupera un jugador |
| PUT | `/api/v1/players/{playerId}` | Reemplaza un jugador |
| PATCH | `/api/v1/players/{playerId}` | Actualiza parcialmente un jugador |
| DELETE | `/api/v1/players/{playerId}` | Elimina un jugador |
| GET | `/api/v1/players/{playerId}/team` | Recupera el equipo del jugador |

Filtros previstos para `GET /players`:

- `teamId`
- `position`
- `active`
- `search` para nombre parcial
- `page`
- `limit`

## Games

### Games

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/games` | Lista partidos con filtros y paginación |
| POST | `/api/v1/games` | Crea un partido |
| GET | `/api/v1/games/{gameId}` | Recupera un partido |
| PUT | `/api/v1/games/{gameId}` | Reemplaza un partido |
| PATCH | `/api/v1/games/{gameId}` | Actualiza parcialmente un partido |
| DELETE | `/api/v1/games/{gameId}` | Elimina un partido |

Filtros previstos para `GET /games`:

- `season`
- `teamId`
- `status`
- `phase`
- `dateFrom`
- `dateTo`
- `winnerTeamId`
- `page`
- `limit`

Esta ruta cumple el requisito de filtrado y paginación sobre la colección con mayor volumen documental.

### Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/health` | Estado del servicio |

## Formato de mensajes

## JSON

Ejemplo de respuesta JSON de un partido:

```json
{
  "id": "6610b1e02c6a2f0012df4001",
  "season": 2024,
  "date": "2024-11-15T00:00:00.000Z",
  "status": "finished",
  "phase": "regular",
  "homeTeamId": "6610b1e02c6a2f0012df1001",
  "awayTeamId": "6610b1e02c6a2f0012df1002",
  "homeScore": 118,
  "awayScore": 110,
  "winnerTeamId": "6610b1e02c6a2f0012df1001",
  "arena": "Crypto.com Arena",
  "city": "Los Angeles"
}
```

## Paginación y filtrado

La paginación se aplica principalmente sobre `games`, aunque también se podrá usar en `players`.

Parámetros estándar:

- `page`: número de página, comenzando en 1.
- `limit`: número máximo de resultados por página.

Ejemplo:

```http
GET /api/v1/games?season=2024&teamId=6610b1e02c6a2f0012df1001&page=2&limit=25
```

Respuesta prevista:

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 25,
    "totalItems": 1280,
    "totalPages": 52,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## Esquemas JSON principales

Los esquemas completos están definidos en `docs/openapi.yaml`. A nivel funcional, los cuerpos principales son:

### TeamCreateRequest

```json
{
  "name": "Lakers",
  "city": "Los Angeles",
  "abbreviation": "LAL",
  "conference": "West",
  "division": "Pacific",
  "foundedYear": 1947,
  "venue": "Crypto.com Arena"
}
```

### PlayerCreateRequest

```json
{
  "firstName": "LeBron",
  "lastName": "James",
  "fullName": "LeBron James",
  "position": "F",
  "active": true,
  "teamId": "6610b1e02c6a2f0012df1001"
}
```

### GameCreateRequest

```json
{
  "season": 2024,
  "date": "2024-11-15T00:00:00.000Z",
  "status": "finished",
  "phase": "regular",
  "homeTeamId": "6610b1e02c6a2f0012df1001",
  "awayTeamId": "6610b1e02c6a2f0012df1002",
  "homeScore": 118,
  "awayScore": 110,
  "winnerTeamId": "6610b1e02c6a2f0012df1001",
  "arena": "Crypto.com Arena",
  "city": "Los Angeles"
}
```

## Códigos de estado

| Código | Significado |
|---|---|
| 200 | Operación correcta |
| 201 | Recurso creado |
| 204 | Recurso eliminado o actualización sin cuerpo |
| 400 | Petición inválida |
| 404 | Recurso no encontrado |
| 409 | Conflicto de integridad o duplicidad |
| 422 | Error de validación semántica |
| 500 | Error interno del servidor |
