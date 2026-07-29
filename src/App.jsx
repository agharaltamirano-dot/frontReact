import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './modulos/login/login'
import MainMenu from './modulos/mainMenu/mainMenu'
import Usuarios from './modulos/usuarios/usuarios'
import Conductores from './modulos/conductores/conductores'
import Vehiculos from './modulos/vehiculos/vehiculos'
import Horarios from './modulos/horarios/horarios'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Main Menu layout wrapping child routes */}
        <Route path="/" element={<MainMenu />}>
          <Route index element={<Navigate to="/usuarios" replace />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="conductores" element={<Conductores />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="horarios" element={<Horarios />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App