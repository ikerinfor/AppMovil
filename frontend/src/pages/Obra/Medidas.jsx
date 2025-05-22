import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Medidas() {
  const { id } = useParams();
  const [medidasPresupuesto, setMedidasPresupuesto] = useState([]);
  const [medidasFactura, setMedidasFactura] = useState([]);
  const [placasDisponibles, setPlacasDisponibles] = useState([]);
  const [montantesDisponibles, setMontantesDisponibles] = useState([]); // Nuevo estado para montantes
  const [numPlacas, setNumPlacas] = useState(1); // Nuevo estado para número de placas

  // 📌 Estados del Formulario (Solo para Factura)
  const [tipo, setTipo] = useState("");
  const [doblePlaca, setDoblePlaca] = useState(false);
  const [tipoPlaca, setTipoPlaca] = useState("");
  const [tipoPerfileriaBasica, setTipoPerfileriaBasica] = useState(""); // Renombrado para mayor consistencia
  const [tipoPerfileriaMontante, setTipoPerfileriaMontante] = useState("");
  const [tipoPerfileriaEspecial, setTipoPerfileriaEspecial] = useState("");
  const [medidasTexto, setMedidasTexto] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5001/api/placas")
      .then(response => setPlacasDisponibles(response.data))
      .catch(error => console.error("Error obteniendo placas:", error));

    // Suponiendo que los montantes se obtienen desde este endpoint
    axios.get("http://localhost:5001/api/montantes")
      .then(response => setMontantesDisponibles(response.data))
      .catch(error => console.error("Error obteniendo montantes:", error));

    obtenerMedidasPresupuesto();
    obtenerMedidasFactura();
  }, [id]);

  // 📌 Obtener Mediciones
  const obtenerMedidasPresupuesto = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/mediciones/presupuesto/${id}`);
      setMedidasPresupuesto(response.data);
    } catch (error) {
      console.error("Error obteniendo mediciones de presupuesto:", error);
    }
  };

  const obtenerMedidasFactura = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/mediciones/factura/${id}`);
      setMedidasFactura(response.data);
    } catch (error) {
      console.error("Error obteniendo mediciones de factura:", error);
    }
  };

  // 📌 Añadir Medida a Factura
  const agregarMedidaFactura = async () => {
    if (!tipo || !tipoPlaca || !tipoPerfileriaBasica || !medidasTexto) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    const valores = medidasTexto.split("+").map(Number);
    const totalM2 = valores.reduce((acc, val) => acc + val, 0);

    try {
      const response = await axios.post("http://localhost:5001/api/mediciones/factura", {
        obra_id: id,
        tipo,
        cantidad: totalM2,
        unidad: tipo.includes("Viga") ? "ml" : "m²",
        doble_placa: doblePlaca,
        tipo_placa: tipoPlaca,
        tipo_perfileria_basica: tipoPerfileriaBasica,
        tipo_perfileria_montante: tipoPerfileriaMontante,
        tipo_perfileria_especial: tipoPerfileriaEspecial,
        num_placas: numPlacas
      });

      setMedidasFactura([...medidasFactura, response.data]);
      resetFormulario();
    } catch (error) {
      console.error("Error añadiendo medición:", error);
    }
  };

  // 📌 Resetear Formulario
  const resetFormulario = () => {
    setTipo("");
    setDoblePlaca(false);
    setTipoPlaca("");
    setTipoPerfileriaBasica("");
    setTipoPerfileriaMontante("");
    setTipoPerfileriaEspecial("");
    setMedidasTexto("");
    setNumPlacas(1);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg">
      {/* Título principal */}
      <h1 className="text-5xl font-extrabold text-blue-800 text-center mb-10">
        📏 Medidas de la Obra #{id}
      </h1>

      {/* Medidas Presupuesto (Solo visualización) */}
      <div className="mb-10 bg-white p-6 rounded-md shadow-md">
        <h2 className="text-3xl font-bold text-gray-700 text-center">📋 Medidas Presupuesto</h2>
        {medidasPresupuesto.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-4">No hay mediciones registradas.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-lg mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Tipo</th>
                <th className="p-3 border">Doble Placa</th>
                <th className="p-3 border">Placa</th>
                <th className="p-3 border">Perfilería</th>
                <th className="p-3 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {medidasPresupuesto.map((medida, index) => (
                <tr key={index} className="text-center">
                  <td className="p-3 border">{medida.tipo}</td>
                  <td className="p-3 border">{medida.doble_placa ? "Sí" : "No"}</td>
                  <td className="p-3 border">{medida.tipo_placa}</td>
                  <td className="p-3 border">{medida.tipo_perfileria}</td>
                  <td className="p-3 border">{medida.cantidad} {medida.unidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Medidas Factura (Visualización) */}
      <div className="mb-10 bg-white p-6 rounded-md shadow-md">
        <h2 className="text-3xl font-bold text-gray-700 text-center">📋 Medidas Factura</h2>
        {medidasFactura.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-4">No hay mediciones registradas.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-lg mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Tipo</th>
                <th className="p-3 border">Doble Placa</th>
                <th className="p-3 border">Placa</th>
                <th className="p-3 border">Perfilería Básica</th>
                <th className="p-3 border">Perfilería Montante</th>
                <th className="p-3 border">Perfilería Especial</th>
                <th className="p-3 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {medidasFactura.map((medida, index) => (
                <tr key={index} className="text-center">
                  <td className="p-3 border">{medida.tipo}</td>
                  <td className="p-3 border">{medida.doble_placa ? "Sí" : "No"}</td>
                  <td className="p-3 border">{medida.tipo_placa}</td>
                  <td className="p-3 border">{medida.tipo_perfileria_basica}</td>
                  <td className="p-3 border">{medida.tipo_perfileria_montante}</td>
                  <td className="p-3 border">{medida.tipo_perfileria_especial}</td>
                  <td className="p-3 border">{medida.cantidad} {medida.unidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario para añadir Medida a Factura */}
      <div className="mb-10 bg-white p-6 rounded-md shadow-md">
        <h2 className="text-3xl font-bold text-gray-700 text-center">➕ Añadir Medida a Nueva Factura</h2>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Tipo de Construcción */}
          <div>
            <label className="block text-lg font-semibold">Tipo de Construcción:</label>
            <select className="w-full p-2 border rounded" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">-- Selecciona --</option>
              <option value="Techo">Techo</option>
              <option value="Trasdosado">Trasdosado</option>
              <option value="Tabique">Tabique</option>
              <option value="Viga">Viga</option>
              <option value="Columna">Columna</option>
              <option value="Aislante en Techo">Aislante en Techo</option>
              <option value="Aislante en Pared">Aislante en Pared</option>
            </select>
          </div>

          {/* Número de Placas */}
          <div>
            <label className="block text-lg font-semibold">Número de Placas:</label>
            <select className="w-full p-2 border rounded" value={numPlacas} onChange={(e) => setNumPlacas(Number(e.target.value))}>
              <option value="1">1 Placa</option>
              <option value="2">2 Placas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Tipo de Placa */}
          <div>
            <label className="block text-lg font-semibold">Tipo de Placa:</label>
            <select className="w-full p-2 border rounded" value={tipoPlaca} onChange={(e) => setTipoPlaca(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {placasDisponibles.map((placa) => (
                <option key={placa.id} value={placa.nombre}>{placa.nombre}</option>
              ))}
            </select>
          </div>

          {/* Doble Placa */}
          <div>
            <label className="block text-lg font-semibold">¿Doble Placa?</label>
            <input type="checkbox" className="w-6 h-6" checked={doblePlaca} onChange={(e) => setDoblePlaca(e.target.checked)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Perfilería Básica */}
          <div>
            <label className="block text-lg font-semibold">Perfilería Básica:</label>
            <select className="w-full p-2 border rounded" value={tipoPerfileriaBasica} onChange={(e) => setTipoPerfileriaBasica(e.target.value)}>
              <option value="">-- Selecciona --</option>
              <option value="Ángulo">Ángulo</option>
              <option value="Canal de 48">Canal de 48</option>
              <option value="Canal de 70">Canal de 70</option>
            </select>
          </div>

          {/* Perfilería Montante */}
          <div>
            <label className="block text-lg font-semibold">Perfilería Montante:</label>
            <select className="w-full p-2 border rounded" value={tipoPerfileriaMontante} onChange={(e) => setTipoPerfileriaMontante(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {montantesDisponibles.map((montante) => (
                <option key={montante.id} value={montante.nombre}>{montante.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Perfilería Especial */}
          <div>
            <label className="block text-lg font-semibold">Perfilería Especial:</label>
            <select className="w-full p-2 border rounded" value={tipoPerfileriaEspecial} onChange={(e) => setTipoPerfileriaEspecial(e.target.value)}>
              <option value="">-- Selecciona --</option>
              <option value="TC47">TC47</option>
              <option value="PH45">PH45</option>
            </select>
          </div>

          {/* Medidas */}
          <div>
            <label className="block text-lg font-semibold">Medidas (Ej: 8+29+44+55+64):</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Ejemplo: 8+29+44+55+64"
              value={medidasTexto}
              onChange={(e) => setMedidasTexto(e.target.value)}
            />
          </div>
        </div>

        {/* Botón para añadir medida */}
        <div className="mt-4 text-center">
          <button className="bg-green-600 text-white py-3 px-6 rounded-lg text-lg hover:bg-green-700" onClick={agregarMedidaFactura}>
            ➕ Añadir a Factura
          </button>
        </div>
      </div>
    </div>
  );
}
