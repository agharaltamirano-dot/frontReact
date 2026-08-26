import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import RegistrarEncomienda from '../encomiendas/RegistrarEncomienda/registrarEncomienda'
import './mainMenu.css'

// ─── Mapa de íconos (valor del campo "icono" devuelto por el back) ─────────────
const ICON_SVG = {
  'user-people': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  'car': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 16v-1a3 3 0 013-3h8a3 3 0 013 3v1" />
      <path d="M19 16v-1a2 2 0 00-2-2H7a2 2 0 00-2 2v1" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M5 16V6a1 1 0 011-1h12a1 1 0 011 1v10" />
    </svg>
  ),
  'users': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  'user-check': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  'truck': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  'bus': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="15" rx="3" />
      <path d="M4 11h16" />
      <path d="M8 15h.01M16 15h.01" />
      <path d="M6 19v2M18 19v2" />
    </svg>
  ),
  'clock': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  'shield-lock': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2" /><path d="M12 13v2" />
    </svg>
  ),
  'eye': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  'plus': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  'edit': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  'trash': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  'house': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  'bar-chart': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  'gear': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  'route': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  ),
  'asientos': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  'storefront': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
      <path d="M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  'default': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

/** Devuelve el SVG del ícono o uno genérico */
const getIcon = (icono) => ICON_SVG[icono] ?? ICON_SVG['default']

/** Menús de respaldo en caso de que el backend aún no devuelva todos los módulos */
const DEFAULT_FALLBACK_MENUS = [
  { id: 'm-dash', nombre: 'Dashboard', rutaAccion: '/dashboard', icono: 'bar-chart', tipo: 'menu', padreId: null, orden: 0 },
  { id: 'm-usr', nombre: 'Usuarios', rutaAccion: '/usuarios', icono: 'users', tipo: 'menu', padreId: null, orden: 1 },
  { id: 'm-cli', nombre: 'Clientes', rutaAccion: '/clientes', icono: 'user-check', tipo: 'menu', padreId: null, orden: 2 },
  { id: 'm-cond', nombre: 'Conductores', rutaAccion: '/conductores', icono: 'user-people', tipo: 'menu', padreId: null, orden: 3 },
  { id: 'm-veh', nombre: 'Vehículos', rutaAccion: '/vehiculos', icono: 'car', tipo: 'menu', padreId: null, orden: 4 },
  { id: 'm-asi', nombre: 'Distribución de asientos', rutaAccion: '/asientos', icono: 'asientos', tipo: 'menu', padreId: null, orden: 5 },
  { id: 'm-rut', nombre: 'Rutas', rutaAccion: '/rutas', icono: 'route', tipo: 'menu', padreId: null, orden: 6 },
  { id: 'm-hor', nombre: 'Horarios', rutaAccion: '/horarios', icono: 'clock', tipo: 'menu', padreId: null, orden: 7 },
  { id: 'm-pas', nombre: 'Pasajes', rutaAccion: '/pasajes', icono: 'bar-chart', tipo: 'menu', padreId: null, orden: 8 },
  { id: 'm-enc', nombre: 'Encomiendas', rutaAccion: '/encomiendas', icono: 'truck', tipo: 'menu', padreId: null, orden: 9 },
  { id: 'm-pv', nombre: 'Puntos de Venta', rutaAccion: '/puntos-venta', icono: 'storefront', tipo: 'menu', padreId: null, orden: 10 }
]

/** Lee authData de sessionStorage de forma segura */
const getAuthData = () => {
  try {
    const raw = sessionStorage.getItem('authData')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Genera iniciales a partir del nombre de usuario */
const getInitials = (nombre = '') =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'US'

/** Ítems del dropdown de reportes (aún sin ruta funcional) */
const REPORTES_ITEMS = [
  { id: 'rep-clientes', nombre: 'Reporte de clientes' },
  { id: 'rep-horarios', nombre: 'Reporte de horarios' },
  { id: 'rep-pasajes', nombre: 'Reporte de pasajes' },
  { id: 'rep-encomiendas', nombre: 'Reporte de encomiendas' },
  { id: 'rep-conductores', nombre: 'Reporte de conductores' }
]

function MainMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportesOpen, setReportesOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState(null)

  // ── Sesión ────────────────────────────────────────────────────────────────────
  const authData = getAuthData()

  if (!authData) {
    navigate('/login', { replace: true })
    return null
  }

  const { usuario } = authData
  const nombreUsuario = usuario?.usuario1 ?? 'Usuario'
  const rol = usuario?.rol ?? {}
  const nombreRol = rol?.nombre ?? 'Administrador'

  const handleReporteClick = (item) => {
    const reportRoutes = {
      'rep-clientes': '/reportes/clientes',
      'rep-pasajes': '/reportes/pasajes',
      'rep-encomiendas': '/reportes/encomiendas',
      'rep-horarios': '/reportes/horarios',
      'rep-conductores': '/reportes/conductores'
    }
    const route = reportRoutes[item.id]
    if (!route) return
    // No cerrar el dropdown al seleccionar; marcar la opción y navegar
    setSelectedReporte(item.id)
    navigate(route)
  }

  // Sincronizar selección con la ruta actual (por ejemplo, al navegar directamente)
  useEffect(() => {
    const routeToId = {
      '/reportes/clientes': 'rep-clientes',
      '/reportes/pasajes': 'rep-pasajes',
      '/reportes/encomiendas': 'rep-encomiendas',
      '/reportes/horarios': 'rep-horarios',
      '/reportes/conductores': 'rep-conductores'
    }
    setSelectedReporte(routeToId[location.pathname] ?? null)
  }, [location.pathname])

  // Menús recibidos del servidor
  const serverMenus = (rol?.menus ?? []).filter((m) => m.tipo === 'menu' && m.padreId === null)

  // Combinar menús del server con fallbacks si faltan módulos para permitir navegación inmediata
  let menuItems = [...serverMenus]
  if (menuItems.length === 0) {
    menuItems = DEFAULT_FALLBACK_MENUS
  } else {
    // Si faltan conductores, vehiculos u horarios en serverMenus, añadirlos al menú
    DEFAULT_FALLBACK_MENUS.forEach(def => {
      if (!menuItems.some(m => m.rutaAccion === def.rutaAccion)) {
        menuItems.push(def)
      }
    })
  }

  menuItems.sort((a, b) => (a.orden || 0) - (b.orden || 0))

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    sessionStorage.removeItem('authData')
    navigate('/login')
  }

  // ── Título del header basado en menú activo ───────────────────────────────────
  const activeMenu = menuItems.find((m) => location.pathname === m.rutaAccion)
  const pageTitle = activeMenu?.nombre ?? 'Pasajes'
  const pageSubtitle = activeMenu
    ? `Gestión de ${activeMenu.nombre.toLowerCase()}`
    : `Bienvenido, ${nombreUsuario}`

  return (
    <div className="admin-layout">
      {/* Overlay oscuro para cerrar sidebar en móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="sidebar-title">Rio San Juan de Oro</h2>
        </div>

        <div className="sidebar-body">
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.rutaAccion}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {getIcon(item.icono)}
                <span>{item.nombre}</span>
              </NavLink>
            ))}
          </nav>

          {/* Dropdown de Reportes */}
          <div className="reportes-dropdown">
            <button
              className={`reportes-toggle${reportesOpen ? ' open' : ''}`}
              onClick={() => setReportesOpen(prev => !prev)}
              aria-expanded={reportesOpen}
            >
              <span className="reportes-toggle-left">
                {getIcon('bar-chart')}
                <span>Reportes</span>
              </span>
              <svg className="reportes-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {reportesOpen && (
              <div className="reportes-submenu">
                {REPORTES_ITEMS.map((r) => (
                  <button
                    key={r.id}
                    className={`reportes-subitem ${r.id === selectedReporte ? 'selected' : ''}`}
                    type="button"
                    onClick={() => handleReporteClick(r)}
                    style={r.id === selectedReporte ? { backgroundColor: '#2563eb', color: '#fff' } : {}}
                  >
                    {r.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Botón hamburguesa solo visible en móvil via CSS */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Abrir menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="page-title">{pageTitle}</h1>
              <p className="page-subtitle">{pageSubtitle}</p>
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
  onClick={() => setOpenRegisterModal(true)}
  style={{
    position: 'fixed',   // clave
    top: '20px',      // distancia desde abajo
    right: '200px',       // distancia desde la derecha
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '15px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
    transition: 'all 0.2s ease',
    zIndex: 1000         // asegura que quede encima
  }}
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
  <span>Encomienda</span>
</button>


            <div className="user-info">
              <div className="user-avatar">
                <span>{getInitials(nombreUsuario)}</span>
              </div>
              <div className="user-details">
                <span className="user-name">{nombreUsuario}</span>
                <span className="user-role">{nombreRol}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Modal independiente para Registrar Encomienda accesible desde cualquier lugar */}
        <RegistrarEncomienda
          open={openRegisterModal}
          onClose={() => setOpenRegisterModal(false)}
        />

        {/* Contenedor donde se renderizarán las pantallas hijas */}
        <div className="main-content-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainMenu
