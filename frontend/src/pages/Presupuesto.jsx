import { useState } from "react";
import axios from "axios";

export default function Presupuesto() {
  const [metros, setMetros] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcularPresupuesto = () => {
    axios.post("/calcular-presupuesto", { metros: parseFloat(metros) })
      .then(response => setResultado(response.data))
      .catch(error => console.error("Error calculando presupuesto:", error));
  };

  return (
    <div>
      <h1>💰 Calcular Presupuesto</h1>
      <input
        type="number"
        placeholder="Metros cuadrados"
        value={metros}
        onChange={(e) => setMetros(e.target.value)}
      />
      <button onClick={calcularPresupuesto}>Calcular</button>
      
      {resultado && (
        <div>
          <h2>Resultado</h2>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
