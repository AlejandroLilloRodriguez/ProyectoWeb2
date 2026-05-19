const express = require('express');
const app = express();

app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Servir la carpeta public como estática para el Dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de Swagger
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log("No se pudo cargar docs/openapi.yaml. Asegúrate de que el archivo exista.");
}

// Definiremos las rutas más adelante en la Fase 3e
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const gamesRouter = require('./routes/games');
const healthRouter = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

app.use('/api/v1/health', healthRouter);

app.use('/api/v1/teams', teamsRouter);
app.use('/api/v1/players', playersRouter);
app.use('/api/v1/games', gamesRouter);

app.use(errorHandler);

module.exports = app;
