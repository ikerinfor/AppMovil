import { useEffect, useState } from "react";
import axios from "axios";

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);

  useEffect(() => {
    axios.get("/materiales")
      .then(response => setMateriales(response.data))
      .catch(error => console.error("Error obteniendo materiales:", error));
  }, []);

  return (
    <div>
      <h1>📦 Lista de Materiales</h1>
      <ul>
        {materiales.map(material => (
          <li key={material.id}>{material.nombre} - ${material.precio}</li>
        ))}
      </ul>
    </div>
  );
}
