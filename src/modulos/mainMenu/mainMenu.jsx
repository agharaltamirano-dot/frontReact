import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './mainMenu.css'

function MainMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    navigate('/login')
  }

  // Dinámicamente obtener el título y subtítulo según la ruta actual
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/usuarios':
        return {
          title: 'Gestión de Usuarios',
          subtitle: 'Administre los usuarios y permisos del sistema'
        }
      case '/dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Resumen general del estado de la empresa'
        }
      case '/reportes':
        return {
          title: 'Reportes y Estadísticas',
          subtitle: 'Visualice el rendimiento y datos de boletos/encomiendas'
        }
      case '/configuracion':
        return {
          title: 'Configuración del Sistema',
          subtitle: 'Ajustes generales y preferencias de la aplicación'
        }
      default:
        return {
          title: 'Panel de Control',
          subtitle: 'Empresa de Transporte Río San Juan del Oro'
        }
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="sidebar-title">Panel Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span>Usuarios</span>
          </NavLink>
          <NavLink to="/reportes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>Reportes</span>
          </NavLink>
          <NavLink to="/configuracion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span>Configuración</span>
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="page-title">{headerInfo.title}</h1>
            <p className="page-subtitle">{headerInfo.subtitle}</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                <span>AD</span>
              </div>
              <div className="user-details">
                <span className="user-name">Admin Principal</span>
                <span className="user-role">Administrador</span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenedor donde se renderizarán las pantallas hijas */}
        <div className="main-content-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainMenu
