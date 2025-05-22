import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function MaterialesObra() {
  const { id } = useParams(); // ID de la obra
  const [materialesPorTipo, setMaterialesPorTipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5001/api/obra/${id}/materiales-completos`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los materiales completos");
        }
        return response.json();
      })
      .then((data) => {
        setMaterialesPorTipo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  return (
    <div>
      <h1>🛠 Materiales de la Obra #{id}</h1>

      <h2>📋 Materiales del Presupuesto</h2>
      {loading ? (
        <p>Cargando materiales...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : materialesPorTipo.length === 0 ? (
        <p>No se encontraron materiales.</p>
      ) : (
        materialesPorTipo.map((grupo, idx) => (
          <div key={idx}>
            <h3>🔹 {grupo.tipo}</h3>
            <table border="1" cellPadding="8" cellSpacing="0">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Unidad</th>
                  <th>Cant. por m²</th>
                  <th>Cant. necesaria</th>
                </tr>
              </thead>
              <tbody>
                {grupo.materiales.map((mat, index) => (
                  <tr key={index}>
                    <td>{mat.nombre}</td>
                    <td>{mat.unidad}</td>
                    <td>{mat.cantidad_por_m2}</td>
                    <td>{mat.cantidad_necesaria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      <h2>🧾 Materiales de Factura</h2>
      <p>Aquí se podrán escanear y registrar facturas de materiales usados.</p>
    </div>
  );
}
