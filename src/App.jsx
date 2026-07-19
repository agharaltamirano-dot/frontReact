import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './modulos/login/login'
import MainMenu from './modulos/mainMenu/mainMenu'
import Usuarios from './modulos/usuarios/usuarios'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Main Menu layout wrapping other routes */}
        <Route path="/" element={<MainMenu />}>
          <Route index element={<Navigate to="/usuarios" replace />} />
          <Route path="usuarios" element={<Usuarios />} />
          {/* Aquí puedes agregar más rutas como /dashboard, /reportes, etc. */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App