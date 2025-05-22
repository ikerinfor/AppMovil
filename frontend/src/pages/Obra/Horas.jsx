import { useParams } from "react-router-dom";

export default function Horas() {  // 👈 Asegúrate de que esta línea esté presente
  const { id } = useParams(); // Obtener el ID de la obra desde la URL

  return (
    <div>
      <h1>⏳ Registro de Horas - Obra #{id}</h1>
      <p>Aquí se podrá registrar y visualizar las horas trabajadas en la obra.</p>
    </div>
  );
}
