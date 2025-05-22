import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Obras from "./pages/Obras";
import Materiales from "./pages/Materiales";
import Presupuesto from "./pages/Presupuesto";
import ObraDetalle from "./pages/Obra/ObraDetalle";
import Medidas from "./pages/Obra/Medidas";
import Horas from "./pages/Obra/Horas";
import MaterialesObra from "./pages/Obra/MaterialesObra";
import PresupuestoObra from "./pages/Obra/PresupuestoObra";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Página Principal */}
        <Route path="/" element={<Home />} />

        {/* Listado de Obras */}
        <Route path="/obras" element={<Obras />} />

        {/* NUEVA RUTA para evitar error si escribes /obras/:id */}
        <Route path="/obras/:id" element={<MaterialesObra />} />

        {/* Materiales y Presupuesto Generales */}
        <Route path="/materiales" element={<Materiales />} />
        <Route path="/presupuesto" element={<Presupuesto />} />

        {/* Detalles de cada Obra */}
        <Route path="/obra/:id" element={<ObraDetalle />} />
        <Route path="/obra/:id/medidas" element={<Medidas />} />
        <Route path="/obra/:id/horas" element={<Horas />} />
        <Route path="/obra/:id/materiales" element={<MaterialesObra />} />
        <Route path="/obra/:id/presupuesto" element={<PresupuestoObra />} />
      </Routes>
    </Router>
  );
}
