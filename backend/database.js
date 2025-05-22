const { Pool } = require('pg');

// Configuración de conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',          // ⚠ Reemplaza con tu usuario de PostgreSQL
    host: 'localhost',
    database: 'obra_gestor',     // Nombre de la base de datos
    password: 'Ikertrade1',   // ⚠ Reemplaza con tu contraseña de PostgreSQL
    port: 5432                   // Puerto por defecto de PostgreSQL
});

pool.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL'))
    .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

module.exports = pool;
