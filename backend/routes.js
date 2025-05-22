const express = require('express');
const pool = require('./database'); // Conexión a PostgreSQL
const router = express.Router();

// 📌 1️⃣ Ruta de prueba para verificar conexión con PostgreSQL
router.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: '🚀 PostgreSQL conectado correctamente', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 2️⃣ Obtener todas las obras
router.get('/obras', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM obras');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo las obras' });
  }
});

// 📌 3️⃣ Obtener todas las placas disponibles
router.get('/placas', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM materiales_precios WHERE nombre LIKE 'Placa%';");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo placas' });
  }
});

// 📌 4️⃣ Agregar medición a una obra (incluye tipo de placa, doble placa y tipo de perfilería)
router.post('/mediciones', async (req, res) => {
  try {
    const { obra_id, tipo, cantidad, unidad, tipo_placa, doble_placa, tipo_perfileria, tipo_medicion } = req.body;

    console.log("📩 Datos recibidos en /mediciones:", req.body);

    if (!obra_id || !tipo || !cantidad || !unidad) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const result = await pool.query(
      `INSERT INTO mediciones 
         (obra_id, tipo, cantidad, unidad, tipo_placa, doble_placa, tipo_perfileria, tipo_medicion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [obra_id, tipo, cantidad, unidad, tipo_placa || null, doble_placa || false, tipo_perfileria || null, tipo_medicion]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error añadiendo medición:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 📌 5️⃣ Obtener Mediciones de Presupuesto
router.get('/mediciones/presupuesto/:obra_id', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM mediciones WHERE obra_id = $1 AND tipo_medicion = 'presupuesto'",
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo medidas de presupuesto' });
  }
});

// 📌 6️⃣ Obtener Mediciones de Factura
router.get('/mediciones/factura/:obra_id', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM mediciones WHERE obra_id = $1 AND tipo_medicion = 'factura'",
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo medidas de factura' });
  }
});

// 📌 7️⃣ Guardar Mediciones de Factura Manualmente
router.post('/mediciones/factura', async (req, res) => {
  const { obra_id, tipo, cantidad, unidad, tipo_placa, doble_placa, tipo_perfileria } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mediciones 
         (obra_id, tipo, cantidad, unidad, tipo_placa, doble_placa, tipo_perfileria, tipo_medicion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'factura') RETURNING *`,
      [obra_id, tipo, cantidad, unidad, tipo_placa || null, doble_placa || false, tipo_perfileria || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error añadiendo medición de factura' });
  }
});

// 📌 8️⃣ Calcular Presupuesto y Guardar Mediciones de Presupuesto
router.post('/calcular-presupuesto', async (req, res) => {
  try {
    let { obra_id, metros, tipoEstructura, placaSeleccionada, doblePlaca, tipoPerfileria } = req.body;

    metros = parseFloat(metros);
    doblePlaca = doblePlaca === "true" || doblePlaca === true;

    if (isNaN(metros) || !tipoEstructura || !placaSeleccionada) {
      return res.status(400).json({ error: "Faltan datos o valores incorrectos para calcular el presupuesto" });
    }

    // Guardamos la medición en "Medidas Presupuesto"
    const insertarMedicion = `
      INSERT INTO mediciones (obra_id, tipo, cantidad, unidad, tipo_placa, doble_placa, tipo_perfileria, tipo_medicion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'presupuesto')
      RETURNING *;
    `;
    await pool.query(insertarMedicion, [
      obra_id,
      tipoEstructura,
      metros,
      tipoEstructura.includes("Viga") ? "ml" : "m²",
      placaSeleccionada,
      doblePlaca,
      tipoPerfileria
    ]);

    // Calculamos el presupuesto (consulta de ejemplo)
    const queryPresupuesto = `
      SELECT 
        c.nombre AS Tipo_Estructura,
        CAST($1 AS NUMERIC) AS Metros_Cuadrados,
        pv.precio_m2 AS Precio_Base,
        COALESCE(
          (SELECT precio FROM materiales_precios WHERE nombre = $2) 
          - (SELECT precio FROM materiales_precios WHERE nombre = 'Placa 13N x 2500'), 0
        ) AS Suplemento_Placa,
        CASE 
          WHEN $3 = TRUE THEN 
            (SELECT precio FROM materiales_precios WHERE nombre = $2) 
          ELSE 0 
        END AS Suplemento_Doble_Placa,
        (pv.precio_m2 + 
         COALESCE(
           (SELECT precio FROM materiales_precios WHERE nombre = $2) 
           - (SELECT precio FROM materiales_precios WHERE nombre = 'Placa 13N x 2500'), 0
         ) +
         CASE 
           WHEN $3 = TRUE THEN 
             (SELECT precio FROM materiales_precios WHERE nombre = $2) 
           ELSE 0 
         END) AS Precio_Final,
        (CAST($1 AS NUMERIC) * (pv.precio_m2 + COALESCE(
          (SELECT precio FROM materiales_precios WHERE nombre = $2) 
          - (SELECT precio FROM materiales_precios WHERE nombre = 'Placa 13N x 2500'), 0
        ) +
        CASE WHEN $3 = TRUE THEN (SELECT precio FROM materiales_precios WHERE nombre = $2) ELSE 0 END)) 
        AS Total_Presupuesto
      FROM precios_venta pv
      JOIN categorias c ON pv.categoria_id = c.id
      WHERE c.nombre = $4;
    `;
    const result = await pool.query(queryPresupuesto, [metros, placaSeleccionada, doblePlaca, tipoEstructura]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al calcular el presupuesto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 📌 9️⃣ Nuevo endpoint: Guardar Presupuesto
router.post('/guardar-presupuesto', async (req, res) => {
  try {
    const { obra_id, tipo, cantidad, unidad, num_placas, tipo_placa, tipo_perfileria_basica, tipo_perfileria_montante, tipo_perfileria_especial } = req.body;

    if (!obra_id || !tipo || !cantidad || !unidad || !num_placas || !tipo_placa) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Consulta el precio de la placa (opcional)
    const precioPlacaResult = await pool.query(
      "SELECT precio FROM materiales_precios WHERE nombre = $1",
      [tipo_placa]
    );
    const precioPlaca = precioPlacaResult.rows[0]?.precio || 0;

    // Calcula el total (por ejemplo, cantidad * precio)
    const total_presupuesto = cantidad * precioPlaca;

    // Guarda el presupuesto
    const result = await pool.query(
      `INSERT INTO presupuestos 
         (obra_id, tipo, cantidad, unidad, num_placas, tipo_placa, tipo_perfileria_basica, tipo_perfileria_montante, tipo_perfileria_especial, total_presupuesto)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [obra_id, tipo, cantidad, unidad, num_placas, tipo_placa, tipo_perfileria_basica, tipo_perfileria_montante, tipo_perfileria_especial, total_presupuesto]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error guardando presupuesto:", error);
    res.status(500).json({ error: "Error interno al guardar presupuesto" });
  }
});

// 📌 🔟 Nuevo endpoint: Obtener Presupuestos Guardados para una obra
router.get('/presupuestos-guardados/:obra_id', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM presupuestos WHERE obra_id = $1", [req.params.obra_id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo presupuestos guardados:", error);
    res.status(500).json({ error: "Error obteniendo presupuestos guardados" });
  }
});

// 📌 1️⃣1️⃣ Nuevo endpoint: Eliminar un Presupuesto Guardado
router.delete('/eliminar-presupuesto/:id', async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM presupuestos WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error eliminando presupuesto:", error);
    res.status(500).json({ error: "Error eliminando presupuesto" });
  }
});

// 📌 1️⃣2️⃣ Nuevo endpoint: Obtener Materiales del Presupuesto
router.get('/presupuestos/:id/materiales', async (req, res) => {
  try {
    const presupuestoId = req.params.id;
    
    // 1. Obtener el presupuesto (cantidad y tipo)
    const presupuestoResult = await pool.query(
      `SELECT cantidad, tipo FROM presupuestos WHERE id = $1`,
      [presupuestoId]
    );
    if (presupuestoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    const { cantidad, tipo } = presupuestoResult.rows[0];
    
    // 2. Obtener el ID de la categoría, relacionando el tipo con el nombre en categorias
    const categoriaResult = await pool.query(
      `SELECT id FROM categorias WHERE nombre = $1`,
      [tipo]
    );
    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada para este presupuesto' });
    }
    const { id: categoria_id } = categoriaResult.rows[0];
    
    // 3. Consultar y calcular los materiales necesarios para el presupuesto
    const materialesResult = await pool.query(
      `SELECT 
         mp.nombre,
         mpt.cantidad_por_m2,
         (p.cantidad * mpt.cantidad_por_m2) AS cantidad_requerida,
         mp.precio,
         (mp.precio * (p.cantidad * mpt.cantidad_por_m2)) AS costo_total,
         mp.precio_descuento,
         CASE 
           WHEN mp.precio_descuento IS NOT NULL THEN 
             mp.precio_descuento * (p.cantidad * mpt.cantidad_por_m2)
           ELSE
             mp.precio * (p.cantidad * mpt.cantidad_por_m2)
         END AS costo_total_final,
         pv.precio_m2,
         (pv.precio_m2 * p.cantidad) AS costo_presupuesto
       FROM presupuestos p
       JOIN categorias c ON c.nombre = p.tipo
       JOIN materiales_por_tipo mpt ON mpt.categoria_id = c.id
       JOIN materiales_precios mp ON mpt.material_id = mp.id
       JOIN precios_venta pv ON c.id = pv.categoria_id
       WHERE p.id = $1`,
      [presupuestoId]
    );
    if (materialesResult.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron materiales para este presupuesto' });
    }
    res.json(materialesResult.rows);
  } catch (error) {
    console.error("Error al obtener materiales del presupuesto:", error);
    res.status(500).json({ error: "Error al obtener materiales del presupuesto" });
  }
});

// 📌 1️⃣3️⃣ Obtener todos los montantes disponibles
router.get('/montantes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM materiales_precios WHERE nombre LIKE 'Montante%';");
    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo montantes:", error);
    res.status(500).json({ error: 'Error obteniendo montantes' });
  }
});

// 📌 1️⃣4️⃣ Nuevo endpoint: Materiales por tipo para toda la obra
router.get('/obra/:obra_id/materiales-completos', async (req, res) => {
  try {
    const obraId = req.params.obra_id;
    const presupuestos = await pool.query(
      `SELECT id, tipo, cantidad FROM presupuestos WHERE obra_id = $1`,
      [obraId]
    );
    if (presupuestos.rows.length === 0) {
      return res.status(404).json({ error: 'No hay presupuestos para esta obra' });
    }
    const materialesPorTipo = [];
    for (const presupuesto of presupuestos.rows) {
      const { tipo, cantidad } = presupuesto;
      const categoriaResult = await pool.query(
        `SELECT id FROM categorias WHERE nombre = $1`,
        [tipo]
      );
      if (categoriaResult.rows.length === 0) continue;
      const categoria_id = categoriaResult.rows[0].id;
      const materialesResult = await pool.query(
        `SELECT 
           mp.nombre,
           'm²' AS unidad,
           mpt.cantidad_por_m2,
           ROUND($1 * mpt.cantidad_por_m2, 2) AS cantidad_necesaria,
           ROUND(($1 * mpt.cantidad_por_m2) * mp.precio, 2) AS total
         FROM materiales_por_tipo mpt
         JOIN materiales_precios mp ON mpt.material_id = mp.id
         WHERE mpt.categoria_id = $2`,
        [cantidad, categoria_id]
      );
      materialesPorTipo.push({
        tipo,
        materiales: materialesResult.rows
      });
    }
    res.json(materialesPorTipo);
  } catch (error) {
    console.error('Error obteniendo materiales completos:', error);
    res.status(500).json({ error: 'Error interno al obtener materiales' });
  }
});

// 📌 1️⃣5️⃣ Endpoint: Materiales agrupados totales para la obra (suma de cantidades por material)
// Se utiliza una consulta SQL con GROUP BY para recolectar y sumar los datos directamente desde la BD.
router.get('/obra/:obra_id/materiales-totales', async (req, res) => {
  try {
    const obraId = req.params.obra_id;
    const query = `
      SELECT 
        mp.nombre AS material,
        'm²' AS unidad,
        ROUND(SUM(CAST(p.cantidad AS numeric) * mpt.cantidad_por_m2)::numeric, 2) AS cantidad_total
      FROM presupuestos p
      JOIN categorias c ON c.nombre = p.tipo
      JOIN materiales_por_tipo mpt ON mpt.categoria_id = c.id
      JOIN materiales_precios mp ON mpt.material_id = mp.id
      WHERE p.obra_id = $1
      GROUP BY mp.nombre
      ORDER BY mp.nombre;
    `;
    const result = await pool.query(query, [obraId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron materiales para esta obra' });
    }

    const materiales = result.rows.map(row => ({
      nombre: row.material,
      unidad: row.unidad,
      cantidad_total: parseFloat(row.cantidad_total)
    }));

    const grandTotal = materiales.reduce((sum, mat) => sum + mat.cantidad_total, 0);

    res.json({ materiales, total: Math.round(grandTotal * 100) / 100 });
  } catch (error) {
    console.error("Error obteniendo materiales totales:", error);
    res.status(500).json({ error: "Error interno al calcular totales" });
  }
});

module.exports = router;
