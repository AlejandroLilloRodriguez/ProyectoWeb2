const express = require('express');
const app = express();

app.use(express.json());

// Definiremos las rutas más adelante en la Fase 3
// const teamsRouter   = require('./routes/teams');
// const playersRouter = require('./routes/players');
// const gamesRouter   = require('./routes/games');
// const errorHandler  = require('./middleware/errorHandler');

// Ruta Health de prueba temporal
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', service: 'nba-api', timestamp: new Date() });
});

// app.use('/api/v1/teams',    teamsRouter);
// app.use('/api/v1/players',  playersRouter);
// app.use('/api/v1/games',    gamesRouter);
// app.use(errorHandler);

module.exports = app;
