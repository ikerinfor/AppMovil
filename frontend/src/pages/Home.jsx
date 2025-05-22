import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>🏠 Bienvenido al Gestor de Obras</h1>
      <nav>
        <ul>
          <li><Link to="/obras">📌 Obras</Link></li>
          <li><Link to="/materiales">🛠 Materiales</Link></li>
          <li><Link to="/presupuesto">💰 Presupuesto</Link></li>
        </ul>
      </nav>
    </div>
  );
}
