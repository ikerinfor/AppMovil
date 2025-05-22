import { Link, useParams } from "react-router-dom";
export default function ObraDetalle() {
  const { id } = useParams(); // Obtener el ID de la obra desde la URL

  return (
    <div>
      <h1>🏗 Detalles de la Obra #{id}</h1>
      <nav>
        <ul>
          <li><Link to={`/obra/${id}/medidas`}>📏 Medidas</Link></li>
          <li><Link to={`/obra/${id}/horas`}>⏳ Horas</Link></li>
          <li><Link to={`/obra/${id}/materiales`}>🛠 Materiales</Link></li>
          <li><Link to={`/obra/${id}/presupuesto`}>💰 Presupuesto</Link></li>
        </ul>
      </nav>
    </div>
  );
}
