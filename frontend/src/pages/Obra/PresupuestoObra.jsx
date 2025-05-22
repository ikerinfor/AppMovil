import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function PresupuestoObra() {
  const { id } = useParams();

  // Estados para el formulario de Presupuesto Inicial
  const [tipoConstruccion, setTipoConstruccion] = useState("");
  const [numPlacas, setNumPlacas] = useState(1);
  const [tipoPlaca, setTipoPlaca] = useState("");
  const [placasDisponibles, setPlacasDisponibles] = useState([]);
  const [tipoPerfileriaBasica, setTipoPerfileriaBasica] = useState("");
  const [tipoPerfileriaMontante, setTipoPerfileriaMontante] = useState("");
  const [tipoPerfileriaEspecial, setTipoPerfileriaEspecial] = useState("");
  const [montantesDisponibles, setMontantesDisponibles] = useState([]);
  const [medidasTexto, setMedidasTexto] = useState("");

  // Estado para el último presupuesto calculado (respuesta que incluye total_con_descuento y predio)
  const [presupuestoCalculado, setPresupuestoCalculado] = useState(null);
  // Lista para guardar TODOS los presupuestos calculados (se refresca automáticamente)
  const [presupuestosGuardados, setPresupuestosGuardados] = useState([]);
  // (Opcional) Datos ingresados para mostrarlos junto al cálculo
  const [datosPresupuestoInicial, setDatosPresupuestoInicial] = useState(null);

  // Estados para la sección de Presupuesto Final Detallado
  const [medicionesFinales, setMedicionesFinales] = useState([]);
  const [presupuestoTotal, setPresupuestoTotal] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/placas")
      .then((response) => setPlacasDisponibles(response.data))
      .catch((error) => console.error("Error obteniendo placas:", error));

    axios
      .get("http://localhost:5001/api/montantes")
      .then((response) => setMontantesDisponibles(response.data))
      .catch((error) => console.error("Error obteniendo montantes:", error));

    // Cargar las mediciones finales (si existen)
    obtenerPresupuestosFinal();
    // Refrescar la lista de presupuestos guardados
    obtenerPresupuestosGuardados();
  }, [id]);

  // 🔹 Función para calcular el presupuesto y guardarlo en la BD con el precio calculado
  const calcularPresupuesto = async () => {
    if (!tipoConstruccion || !tipoPlaca || !tipoPerfileriaBasica || !medidasTexto) {
      alert("Por favor, completa todos los campos");
      return;
    }

    const valores = medidasTexto.split("+").map(Number);
    const totalM2 = valores.reduce((acc, val) => acc + val, 0);

    try {
      // 🔹 Calcular el presupuesto utilizando los precios predefinidos en la BD
      const response = await axios.post("http://localhost:5001/api/calcular-presupuesto", {
        obra_id: id,
        metros: totalM2,
        tipoEstructura: tipoConstruccion,
        placaSeleccionada: tipoPlaca,
        numPlacas,
      });
      const precioCalculado = response.data.total_con_descuento; // Precio calculado con descuento

      // 🔹 Guardar el presupuesto en la BD con el precio calculado
      await axios.post("http://localhost:5001/api/guardar-presupuesto", {
        obra_id: id,
        tipo: tipoConstruccion,
        cantidad: totalM2,
        unidad: tipoConstruccion.includes("Viga") ? "ml" : "m²",
        num_placas: numPlacas,
        tipo_placa: tipoPlaca,
        tipo_perfileria_basica: tipoPerfileriaBasica,
        tipo_perfileria_montante: tipoPerfileriaMontante,
        tipo_perfileria_especial: tipoPerfileriaEspecial,
        total_presupuesto: precioCalculado,
      });

      // 🔹 Refrescar automáticamente la lista de presupuestos guardados
      obtenerPresupuestosGuardados();

      // 🔹 Guardar (opcional) los datos ingresados para mostrarlos en pantalla
      setDatosPresupuestoInicial({
        tipoConstruccion,
        numPlacas,
        tipoPlaca,
        tipoPerfileriaBasica,
        tipoPerfileriaMontante,
        tipoPerfileriaEspecial,
        medidasTexto,
      });
      setPresupuestoCalculado(response.data);

      // 🔹 Resetear el formulario
      setTipoConstruccion("");
      setNumPlacas(1);
      setTipoPlaca("");
      setTipoPerfileriaBasica("");
      setTipoPerfileriaMontante("");
      setTipoPerfileriaEspecial("");
      setMedidasTexto("");
    } catch (error) {
      console.error("Error calculando presupuesto:", error);
    }
  };

  // 🛠 Función para obtener los presupuestos guardados de la BD
  const obtenerPresupuestosGuardados = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/presupuestos-guardados/${id}`);
      setPresupuestosGuardados(response.data);
    } catch (error) {
      console.error("Error obteniendo presupuestos guardados:", error);
    }
  };

  // 🛠 Función para eliminar un presupuesto guardado
  const eliminarPresupuesto = async (presupuestoId) => {
    try {
      await axios.delete(`http://localhost:5001/api/eliminar-presupuesto/${presupuestoId}`);
      setPresupuestosGuardados(
        presupuestosGuardados.filter((presupuesto) => presupuesto.id !== presupuestoId)
      );
    } catch (error) {
      console.error("Error eliminando presupuesto:", error);
    }
  };

  // Función para obtener la lista de mediciones (Presupuesto Final)
  const obtenerPresupuestosFinal = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/presupuesto-final/${id}`);
      setMedicionesFinales(response.data);
    } catch (error) {
      console.error("Error obteniendo el presupuesto final:", error);
    }
  };

  // Función para eliminar una medición de la lista de presupuesto final
  const eliminarMedicionPresupuestoFinal = async (medicionId) => {
    try {
      await axios.delete(`http://localhost:5001/api/presupuesto-final/${medicionId}`);
      setMedicionesFinales(medicionesFinales.filter((medida) => medida.id !== medicionId));
    } catch (error) {
      console.error("Error eliminando medición:", error);
    }
  };

  // Función para calcular el total final del presupuesto
  const calcularPresupuestoFinal = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/calcular-presupuesto-final/${id}`);
      setPresupuestoTotal(response.data.total);
    } catch (error) {
      console.error("Error calculando presupuesto final:", error);
    }
  };

  // Función para guardar presupuesto (si se desea guardar nuevamente desde otra acción)
  const guardarPresupuesto = async () => {
    if (!presupuestoCalculado) {
      alert("Calcula el presupuesto antes de guardarlo.");
      return;
    }
    try {
      await axios.post("http://localhost:5001/api/guardar-presupuesto", {
        obra_id: id,
        tipo: tipoConstruccion,
        cantidad: medidasTexto.split("+").map(Number).reduce((acc, val) => acc + val, 0),
        unidad: tipoConstruccion.includes("Viga") ? "ml" : "m²",
        num_placas: numPlacas,
        tipo_placa: tipoPlaca,
        tipo_perfileria_basica: tipoPerfileriaBasica,
        tipo_perfileria_montante: tipoPerfileriaMontante,
        tipo_perfileria_especial: tipoPerfileriaEspecial,
        total_presupuesto: presupuestoCalculado.total_con_descuento,
      });
      alert("✅ Presupuesto guardado exitosamente.");
      obtenerPresupuestosGuardados();
    } catch (error) {
      console.error("Error guardando presupuesto:", error);
    }
  };

  return (
    <div className="p-4">
      <h1>💰 Presupuesto - Obra #{id}</h1>
      <h2>📌 Presupuesto Inicial</h2>
      <label>Tipo de construcción:</label>
      <select value={tipoConstruccion} onChange={(e) => setTipoConstruccion(e.target.value)}>
        <option value="">-- Selecciona --</option>
        <option value="Techo">Techo</option>
        <option value="Trasdosado">Trasdosado</option>
        <option value="Tabique">Tabique</option>
        <option value="Viga">Viga</option>
        <option value="Columna">Columna</option>
      </select>
      <br />
      <label>Número de placas:</label>
      <select value={numPlacas} onChange={(e) => setNumPlacas(Number(e.target.value))}>
        <option value="1">1 Placa</option>
        <option value="2">2 Placas</option>
      </select>
      <br />
      <label>Tipo de placa:</label>
      <select value={tipoPlaca} onChange={(e) => setTipoPlaca(e.target.value)}>
        <option value="">-- Selecciona --</option>
        {placasDisponibles.map((placa) => (
          <option key={placa.id} value={placa.nombre}>
            {placa.nombre}
          </option>
        ))}
      </select>
      <br />
      <label>Tipo de Perfilería:</label>
      <select value={tipoPerfileriaBasica} onChange={(e) => setTipoPerfileriaBasica(e.target.value)}>
        <option value="">-- Selecciona --</option>
        <option value="Ángulo">Ángulo</option>
        <option value="Canal de 48">Canal de 48</option>
        <option value="Canal de 70">Canal de 70</option>
      </select>
      <br />
      <label>Montantes:</label>
      <select value={tipoPerfileriaMontante} onChange={(e) => setTipoPerfileriaMontante(e.target.value)}>
        <option value="">-- Selecciona --</option>
        {montantesDisponibles.map((montante) => (
          <option key={montante.id} value={montante.nombre}>
            {montante.nombre}
          </option>
        ))}
      </select>
      <br />
      <label>Perfilería Especial:</label>
      <select value={tipoPerfileriaEspecial} onChange={(e) => setTipoPerfileriaEspecial(e.target.value)}>
        <option value="">-- Selecciona --</option>
        <option value="TC47/PH45">TC47 y PH45</option>
      </select>
      <br />
      <label>Medidas (Ej: 8+29+44+55+64):</label>
      <input
        type="text"
        placeholder="Ejemplo: 8+29+44+55+64"
        value={medidasTexto}
        onChange={(e) => setMedidasTexto(e.target.value)}
      />
      <br />
      <button onClick={calcularPresupuesto}>Calcular Presupuesto</button>
      {presupuestoCalculado !== null && (
        <div>
          <h2>📊 Presupuesto Calculado</h2>
          <p>
            <strong>Total estimado con descuento:</strong> {presupuestoCalculado.total_con_descuento} €
          </p>
          <p>
            <strong>Predio:</strong> {presupuestoCalculado.predio} €
          </p>
          {datosPresupuestoInicial && (
            <div>
              <h3>Detalles ingresados:</h3>
              <ul>
                <li>
                  <strong>Tipo de Construcción:</strong> {datosPresupuestoInicial.tipoConstruccion}
                </li>
                <li>
                  <strong>Número de Placas:</strong> {datosPresupuestoInicial.numPlacas}
                </li>
                <li>
                  <strong>Tipo de Placa:</strong> {datosPresupuestoInicial.tipoPlaca}
                </li>
                <li>
                  <strong>Perfilería:</strong> {datosPresupuestoInicial.tipoPerfileriaBasica}
                </li>
                <li>
                  <strong>Montantes:</strong> {datosPresupuestoInicial.tipoPerfileriaMontante}
                </li>
                <li>
                  <strong>Perfilería Especial:</strong> {datosPresupuestoInicial.tipoPerfileriaEspecial}
                </li>
                <li>
                  <strong>Medidas:</strong> {datosPresupuestoInicial.medidasTexto}
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
      {presupuestosGuardados.length > 0 && (
        <div className="mb-10 bg-white p-6 rounded-md shadow-md">
          <h2 className="text-3xl font-bold text-gray-700 text-center">📋 Presupuestos Guardados</h2>
          <table className="w-full border-collapse border border-gray-300 text-lg mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Tipo Construcción</th>
                <th className="p-3 border">Nº Placas</th>
                <th className="p-3 border">Tipo Placa</th>
                <th className="p-3 border">Perfilería</th>
                <th className="p-3 border">Total</th>
                <th className="p-3 border">Precio (€)</th>
                <th className="p-3 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestosGuardados.map((presupuesto, index) => (
                <tr key={index} className="text-center">
                  <td className="p-3 border">{presupuesto.tipo}</td>
                  <td className="p-3 border">{presupuesto.num_placas}</td>
                  <td className="p-3 border">{presupuesto.tipo_placa}</td>
                  <td className="p-3 border">{presupuesto.tipo_perfileria_basica}</td>
                  <td className="p-3 border">
                    {presupuesto.cantidad} {presupuesto.unidad}
                  </td>
                  <td className="p-3 border font-bold text-green-600">
                    {presupuesto.total_presupuesto} €
                  </td>
                  <td className="p-3 border">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => eliminarPresupuesto(presupuesto.id)}
                    >
                      ❌ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-10 bg-white p-6 rounded-md shadow-md mt-8">
        <h2 className="text-3xl font-bold text-gray-700 text-center">
          📋 Presupuesto Final Detallado
        </h2>
        {medicionesFinales.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-4">
            No hay mediciones registradas.
          </p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-lg mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Tipo</th>
                <th className="p-3 border">Doble Placa</th>
                <th className="p-3 border">Placa</th>
                <th className="p-3 border">Perfilería</th>
                <th className="p-3 border">Total</th>
                <th className="p-3 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {medicionesFinales.map((medida, index) => (
                <tr key={index} className="text-center">
                  <td className="p-3 border">{medida.tipo}</td>
                  <td className="p-3 border">{medida.doble_placa ? "Sí" : "No"}</td>
                  <td className="p-3 border">{medida.tipo_placa}</td>
                  <td className="p-3 border">
                    {medida.tipo_perfileria || medida.tipo_perfileria_basica}
                  </td>
                  <td className="p-3 border">
                    {medida.cantidad} {medida.unidad}
                  </td>
                  <td className="p-3 border">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => eliminarMedicionPresupuestoFinal(medida.id)}
                    >
                      ❌ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4 text-center">
          <button
            className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg hover:bg-blue-700"
            onClick={calcularPresupuestoFinal}
          >
            🧮 Calcular Presupuesto Final
          </button>
        </div>
        {presupuestoTotal !== null && (
          <p className="text-xl font-bold text-gray-700 text-center mt-4">
            💰 Total Presupuesto: {presupuestoTotal} €
          </p>
        )}
      </div>
    </div>
  );
}
