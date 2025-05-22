import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_URL from "../../config"; // ✅ Importa la URL del backend

export default function Obras() {
  const [obras, setObras] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/obras`) // ✅ Usamos la URL completa del backend
      .then(response => setObras(response.data))
      .catch(error => console.error("Error obteniendo obras:", error));
  }, []);

  return (
    <div>
      <h1>📌 Obras</h1>
      <ul>
        {obras.length === 0 ? (
          <p>No hay obras registradas.</p>
        ) : (
          obras.map((obra) => (
            <li key={obra.id}>
              <strong>{obra.nombre}</strong> - {obra.direccion}
              <Link to={`/obra/${obra.id}`}> 🔍 Ver Detalles</Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
