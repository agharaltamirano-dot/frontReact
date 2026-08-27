import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './modulos/login/login'
import MainMenu from './modulos/mainMenu/mainMenu'
import Dashboard from './modulos/Dashborad/dashboard'
import Usuarios from './modulos/usuarios/usuarios'
import Clientes from './modulos/clientes/clientes'
import Conductores from './modulos/conductores/conductores'
import Vehiculos from './modulos/vehiculos/vehiculos'
import Horarios from './modulos/horarios/horarios'
import VentaPasajes from './modulos/horarios/VentaPasajes/ventaPasajes'
import ReporteIngresos from './modulos/reportes/reporteIngresos/reporteIngresos'
import Pasajes from './modulos/pasajes/pasajes'
import Encomiendas from './modulos/encomiendas/encomiendas'
import ReporteEncomiendas from './modulos/reportes/reporteEncomiendas/reporteEncomiendas'
import ReporteClientes from './modulos/reportes/reporteClientes/reporteClientes'
import ReportePasajes from './modulos/reportes/reportePasajes/reportePasajes'
import ReporteHorarios from './modulos/reportes/reporteHorarios/reporteHorarios'
import ReporteConductores from './modulos/reportes/reporteConductores/reporteConductores'
import Rutas from './modulos/rutas/rutas'
import Asientos from './modulos/distribucionAsientos/asientos'
import PuntoVenta from './modulos/puntoVenta/puntoVenta'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Main Menu layout wrapping child routes */}
        <Route path="/" element={<MainMenu />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="conductores" element={<Conductores />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="asientos" element={<Asientos />} />
          <Route path="rutas" element={<Rutas />} />
          <Route path="horarios" element={<Horarios />} />
          <Route path="horarios/venta/:id" element={<VentaPasajes />} />
          <Route path="pasajes" element={<Pasajes />} />
          <Route path="encomiendas" element={<Encomiendas />} />
          <Route path="reportes/encomiendas" element={<ReporteEncomiendas />} />
          <Route path="reportes/clientes" element={<ReporteClientes />} />
          <Route path="reportes/pasajes" element={<ReportePasajes />} />
          <Route path="reportes/horarios" element={<ReporteHorarios />} />
          <Route path="reportes/conductores" element={<ReporteConductores />} />
          <Route path="reportes/ingresos" element={<ReporteIngresos />} />

          <Route path="puntos-venta" element={<PuntoVenta />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
