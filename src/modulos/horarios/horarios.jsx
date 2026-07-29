import { useState, useEffect } from 'react'
import './horarios.css'

const BASE_URL = 'http://localhost:5093/api/horarios'

export const MOCK_HORARIOS = [
  { id: 1, hora: '06:00 AM', desplazamiento: 'Tarija - Tupiza' },
  { id: 2, hora: '08:30 AM', desplazamiento: 'Tupiza - Villazón' },
  { id: 3, hora: '12:00 PM', desplazamiento: 'Potosí - Tupiza' },
  { id: 4, hora: '14:30 PM', desplazamiento: 'Tarija - Villazón' },
  { id: 5, hora: '18:00 PM', desplazamiento: 'Sucre - Potosí' },
  { id: 6, hora: '21:30 PM', desplazamiento: 'Tupiza - Tarija (Nocturno)' },
  { id: 7, hora: '23:00 PM', desplazamiento: 'Villazón - Potosí (Nocturno)' }
]

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

function Horarios() {
  const [horarios, setHorarios] = useState(MOCK_HORARIOS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [routeFilter, setRouteFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHorario, setEditingHorario] = useState(null)
  const [notification, setNotification] = useState(null)
  const [horarioToDelete, setHorarioToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    hora: '',
    desplazamiento: ''
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  const fetchHorarios = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setHorarios(data)
        }
      }
    } catch (err) {
      console.log('Usando datos locales de horarios para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHorarios() }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, routeFilter, itemsPerPage])

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      hora: '08:00 AM',
      desplazamiento: ''
    })
    setEditingHorario(null)
    setShowAddModal(true)
  }

  const handleEdit = (horario) => {
    setFormData({
      hora: horario.hora || '',
      desplazamiento: horario.desplazamiento || ''
    })
    setEditingHorario(horario)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingHorario) {
        try {
          await fetch(`${BASE_URL}/${editingHorario.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...formData, id: editingHorario.id })
          })
        } catch {
          console.log('PUT backend horarios no disponible')
        }

        setHorarios(prev => prev.map(h => h.id === editingHorario.id ? { ...formData, id: editingHorario.id } : h))
        showNotification('Horario actualizado exitosamente')
      } else {
        const newId = Date.now()
        const newHorario = { ...formData, id: newId }
        try {
          const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
          })
          if (res.ok) {
            const data = await res.json()
            newHorario.id = data.id || newId
          }
        } catch {
          console.log('POST backend horarios no disponible')
        }

        setHorarios(prev => [newHorario, ...prev])
        showNotification('Nuevo horario creado exitosamente')
      }

      setShowAddModal(false)
      setEditingHorario(null)
    } catch (err) {
      showNotification('Error al guardar horario: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (horario) => setHorarioToDelete(horario)

  const confirmDelete = async () => {
    if (!horarioToDelete) return
    setHorarios(prev => prev.filter(h => h.id !== horarioToDelete.id))

    try {
      await fetch(`${BASE_URL}/${horarioToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch {
      // local
    }

    showNotification('Horario eliminado correctamente', 'error')
    setHorarioToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredHorarios = horarios.filter(h => {
    const textTarget = `${h.hora} ${h.desplazamiento}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())
    const matchesRoute = routeFilter === 'todos' || h.desplazamiento.toLowerCase().includes(routeFilter.toLowerCase())

    return matchesSearch && matchesRoute
  })

  // Paginación
  const totalItems = filteredHorarios.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHorarios = filteredHorarios.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="horarios-view">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {notification.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="content-card">
        {/* Barra de Herramientas y Filtros */}
        <div className="toolbar">
          <div className="filter-group">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por hora o ruta de desplazamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filtro por Ruta/Desplazamiento */}
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Rutas</option>
              <option value="Tupiza">Rutas con Tupiza</option>
              <option value="Tarija">Rutas con Tarija</option>
              <option value="Potosí">Rutas con Potosí</option>
              <option value="Villazón">Rutas con Villazón</option>
            </select>
          </div>

          <button onClick={handleAddNew} className="add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Horario
          </button>
        </div>

        {/* Tabla de Horarios */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando horarios...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Hora de Salida / Llegada</th>
                  <th>Desplazamiento / Ruta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHorarios.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#64748b' }}>
                        #{h.id}
                      </code>
                    </td>
                    <td>
                      <div className="time-pill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{h.hora}</span>
                      </div>
                    </td>
                    <td>
                      <div className="route-chip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span>{h.desplazamiento}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(h)}
                          className="action-btn edit-btn"
                          title="Editar Horario"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(h)}
                          className="action-btn delete-btn"
                          title="Eliminar Horario"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredHorarios.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron horarios</h3>
              <p>Intente con otro término de búsqueda o ruta</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredHorarios.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} horarios
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="pagination-size-select"
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                « Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Horario */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ width: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHorario ? 'Editar Horario' : 'Nuevo Horario'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="input-group">
                <label className="input-label">Hora (Formato HH:MM AM/PM)</label>
                <input
                  type="text"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="input-field"
                  placeholder="Ej. 08:30 AM"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Desplazamiento / Ruta</label>
                <input
                  type="text"
                  value={formData.desplazamiento}
                  onChange={(e) => setFormData({ ...formData, desplazamiento: e.target.value })}
                  className="input-field"
                  placeholder="Ej. Tarija - Tupiza"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando...' : (editingHorario ? 'Actualizar' : 'Crear') + ' Horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {horarioToDelete && (
        <div className="modal-overlay" onClick={() => setHorarioToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setHorarioToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar el horario <strong>{horarioToDelete.hora} ({horarioToDelete.desplazamiento})</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setHorarioToDelete(null)}>
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Horarios
