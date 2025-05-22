const express = require('express');
const cors = require('cors');
const pool = require('./database'); // Conexión a PostgreSQL
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// 📌 Conectar las rutas ANTES de iniciar el servidor
app.use('/api', routes);

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('🚀 Servidor funcionando correctamente');
});

const PORT = 5001;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
