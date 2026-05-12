require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Por si no tenemos archivo .env todavía, ponemos el puerto 3000 y una URI por defecto
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-api';

// Forzamos la URI en process.env por si no existe el archivo .env local
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = MONGODB_URI;
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}/api/v1`);
  });
}).catch(err => {
  console.error("Error al conectar a MongoDB:", err);
});
