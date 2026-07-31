import { useState, useEffect } from 'react'
import './rutas.css'

const BASE_URL_RUTAS = 'http://localhost:5093/api/rutas'
const BASE_URL_PUNTOS = 'http://localhost:5093/api/puntos-venta'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const MOCK_PUNTOS_VENTA = [
  { id: 1, nombre: 'Tarija', direccion: 'tarija parada del norte caseta 4', telefono: '78784737' },
  { id: 2, nombre: 'El puente', direccion: 'El puente calle Anicento Arce y Belgrano', telefono: '76179676 - 78987877' },
  { id: 3, nombre: 'Tupiza', direccion: 'Av. 16 de Julio N° 45', telefono: '71239847' },
  { id: 4, nombre: 'Villazón', direccion: 'Calle Antofagasta esquina Bolivia', telefono: '68291049' }
]

export const MOCK_RUTAS = [
  { id: 1, origenId: 1, destinoId: 2, dias: 'Lunes,Martes,Viernes', estado: true, tarifa: 15 },
  { id: 2, origenId: 1, destinoId: 3, dias: 'Lunes,Miércoles,Viernes,Domingo', estado: true, tarifa: 45 },
  { id: 3, origenId: 2, destinoId: 4, dias: 'Martes,Jueves,Sábado', estado: true, tarifa: 30 },
  { id: 4, origenId: 3, destinoId: 4, dias: 'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo', estado: false, tarifa: 25 }
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

function Rutas() {
  const [rutas, setRutas] = useState(MOCK_RUTAS)
  const [puntosVenta, setPuntosVenta] = useState(MOCK_PUNTOS_VENTA)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [diaFilter, setDiaFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Modales y Notificaciones
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRuta, setEditingRuta] = useState(null)
  const [notification, setNotification] = useState(null)
  const [rutaToDelete, setRutaToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    origenId: MOCK_PUNTOS_VENTA[0].id,
    destinoId: MOCK_PUNTOS_VENTA[1]?.id || MOCK_PUNTOS_VENTA[0].id,
    dias: 'Lunes,Martes,Viernes',
    estado: true,
    tarifa: 15
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET Puntos de Venta ──────────────────────────────────────────────────────
  const fetchPuntosVenta = async () => {
    try {
      const res = await fetch(BASE_URL_PUNTOS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setPuntosVenta(data)
      }
    } catch (err) {
      console.log('Usando lista local de puntos de venta:', err.message)
    }
  }

  // ── GET Rutas ────────────────────────────────────────────────────────────────
  const fetchRutas = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL_RUTAS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setRutas(data)
      }
    } catch (err) {
      console.log('Usando lista local de rutas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPuntosVenta()
    fetchRutas()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, diaFilter, statusFilter, itemsPerPage])

  // Helper resolver punto de venta
  const getPunto = (id) => puntosVenta.find(p => Number(p.id) === Number(id)) || { nombre: `Punto #${id}`, telefono: 'Sin tel.' }

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (ruta) => {
    const nuevoEstado = !ruta.estado
    setRutas(prev => prev.map(r => r.id === ruta.id ? { ...r, estado: nuevoEstado } : r))

    try {
      await fetch(`${BASE_URL_RUTAS}/${ruta.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...ruta, estado: nuevoEstado })
      })
    } catch (err) {
      console.log('PUT backend rutas no disponible:', err.message)
    }

    const origenObj = getPunto(ruta.origenId || ruta.origen?.id)
    const destinoObj = getPunto(ruta.destinoId || ruta.destino?.id)
    showNotification(`Estado de ruta ${origenObj.nombre} → ${destinoObj.nombre} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    const defaultOrigen = puntosVenta[0]?.id || 1
    const defaultDestino = puntosVenta[1]?.id || puntosVenta[0]?.id || 2
    setFormData({
      origenId: defaultOrigen,
      destinoId: defaultDestino,
      dias: 'Lunes,Martes,Viernes',
      estado: true,
      tarifa: 15
    })
    setEditingRuta(null)
    setShowAddModal(true)
  }

  const handleEdit = (ruta) => {
    setFormData({
      origenId: ruta.origenId || ruta.origen?.id || puntosVenta[0]?.id || 1,
      destinoId: ruta.destinoId || ruta.destino?.id || puntosVenta[1]?.id || 2,
      dias: ruta.dias || 'Lunes',
      estado: ruta.estado ?? true,
      tarifa: ruta.tarifa ?? 0
    })
    setEditingRuta(ruta)
    setShowAddModal(true)
  }

  // Alternar días
  const toggleDia = (dia) => {
    const diasArray = formData.dias ? formData.dias.split(',').filter(Boolean) : []
    let updatedArray
    if (diasArray.includes(dia)) {
      updatedArray = diasArray.filter(d => d !== dia)
    } else {
      updatedArray = [...diasArray, dia]
    }
    setFormData(prev => ({
      ...prev,
      dias: updatedArray.join(',')
    }))
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()

    if (Number(formData.origenId) === Number(formData.destinoId)) {
      showNotification('El origen y el destino no pueden ser el mismo punto de venta', 'error')
      return
    }

    if (!formData.dias || formData.dias.trim() === '') {
      showNotification('Debe seleccionar al menos un día de operación', 'error')
      return
    }

    setSaving(true)

    const payload = {
      origenId: Number(formData.origenId),
      destinoId: Number(formData.destinoId),
      dias: formData.dias,
      estado: Boolean(formData.estado),
      tarifa: Number(formData.tarifa)
    }

    try {
      if (editingRuta) {
        try {
          await fetch(`${BASE_URL_RUTAS}/${editingRuta.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...payload, id: editingRuta.id })
          })
        } catch (err) {
          console.log('PUT backend rutas no disponible:', err.message)
        }

        setRutas(prev => prev.map(r => r.id === editingRuta.id ? { ...payload, id: editingRuta.id } : r))
        showNotification('Ruta actualizada exitosamente')
      } else {
        const newId = Date.now()
        const newRuta = { ...payload, id: newId }
        try {
          const res = await fetch(BASE_URL_RUTAS, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const data = await res.json()
            newRuta.id = data.id || newId
          }
        } catch (err) {
          console.log('POST backend rutas no disponible:', err.message)
        }

        setRutas(prev => [newRuta, ...prev])
        showNotification('Nueva ruta registrada exitosamente')
      }

      setShowAddModal(false)
      setEditingRuta(null)
    } catch (err) {
      showNotification('Error al guardar la ruta: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (ruta) => setRutaToDelete(ruta)

  const confirmDelete = async () => {
    if (!rutaToDelete) return
    setRutas(prev => prev.filter(r => r.id !== rutaToDelete.id))

    try {
      await fetch(`${BASE_URL_RUTAS}/${rutaToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch (err) {
      console.log('DELETE backend rutas no disponible:', err.message)
    }

    showNotification('Ruta eliminada del sistema', 'error')
    setRutaToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredRutas = rutas.filter(r => {
    const origenObj = getPunto(r.origenId || r.origen?.id)
    const destinoObj = getPunto(r.destinoId || r.destino?.id)

    const textTarget = `${origenObj.nombre} ${destinoObj.nombre} ${r.dias}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())

    const matchesDia = diaFilter === 'todos' || (r.dias && r.dias.includes(diaFilter))

    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && r.estado) ||
      (statusFilter === 'inactivos' && !r.estado)

    return matchesSearch && matchesDia && matchesStatus
  })

  // Paginación
  const totalItems = filteredRutas.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRutas = filteredRutas.slice(startIndex, startIndex + itemsPerPage)

  const selectedDiasList = formData.dias ? formData.dias.split(',').filter(Boolean) : []

  return (
    <div className="rutas-view">
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

      {/* Main Content Card */}
      <div className="content-card">
        {/* Toolbar Superior */}
        <div className="toolbar">
          <div className="filter-group">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por origen, destino o día de operación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={diaFilter}
              onChange={(e) => setDiaFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Días</option>
              {DIAS_SEMANA.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Ruta
          </button>
        </div>

        {/* Tabla */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando rutas...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Días de Operación</th>
                  <th>Tarifa</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRutas.map((ruta) => {
                  const origen = getPunto(ruta.origenId || ruta.origen?.id)
                  const destino = getPunto(ruta.destinoId || ruta.destino?.id)
                  const diasArray = ruta.dias ? ruta.dias.split(',').filter(Boolean) : []

                  return (
                    <tr key={ruta.id}>
                      <td>
                        <div>
                          <strong style={{ color: 'var(--slate-900)' }}>{origen.nombre}</strong>
                          <span className="pv-phone">Tel: {origen.telefono}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: 'var(--slate-900)' }}>{destino.nombre}</strong>
                          <span className="pv-phone">Tel: {destino.telefono}</span>
                        </div>
                      </td>
                      <td>
                        <div className="dias-badge-group">
                          {diasArray.map((dia, idx) => (
                            <span key={idx} className="dia-pill">
                              {dia}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="tarifa-badge">
                          Bs. {Number(ruta.tarifa).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${ruta.estado ? 'active' : 'inactive'}`}>
                          {ruta.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => toggleEstado(ruta)}
                            className="action-btn edit-btn"
                            title={ruta.estado ? 'Desactivar Ruta' : 'Activar Ruta'}
                            style={{ color: ruta.estado ? '#10b981' : '#94a3b8' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(ruta)}
                            className="action-btn edit-btn"
                            title="Editar Ruta"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(ruta)}
                            className="action-btn delete-btn"
                            title="Eliminar Ruta"
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
                  )
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredRutas.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron rutas registradas</h3>
              <p>Intente ajustando los términos de búsqueda o filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredRutas.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} rutas
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

      {/* Modal Crear / Editar Ruta */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Punto de Origen</label>
                  <select
                    value={formData.origenId}
                    onChange={(e) => setFormData({ ...formData, origenId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {puntosVenta.map(pv => (
                      <option key={pv.id} value={pv.id}>
                        {pv.nombre} - Tel: {pv.telefono}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Punto de Destino</label>
                  <select
                    value={formData.destinoId}
                    onChange={(e) => setFormData({ ...formData, destinoId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {puntosVenta.map(pv => (
                      <option key={pv.id} value={pv.id}>
                        {pv.nombre} - Tel: {pv.telefono}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Días de Operación */}
              <div className="input-group">
                <label className="input-label">Días de Operación</label>
                <div className="dias-selector">
                  {DIAS_SEMANA.map(dia => {
                    const isSelected = selectedDiasList.includes(dia)
                    return (
                      <button
                        type="button"
                        key={dia}
                        className={`dia-toggle-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleDia(dia)}
                      >
                        {dia}
                      </button>
                    )
                  })}
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                  Seleccionados: {formData.dias || 'Ninguno'}
                </span>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Tarifa (Bs.)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    className="input-field"
                    placeholder="Ej. 15.00"
                    value={formData.tarifa}
                    onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Estado Inicial</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: formData.estado ? '#10b981' : '#64748b' }}>
                      {formData.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
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
                  {saving ? 'Guardando...' : (editingRuta ? 'Actualizar' : 'Crear') + ' Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {rutaToDelete && (
        <div className="modal-overlay" onClick={() => setRutaToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setRutaToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro de que desea eliminar la ruta entre <strong>{getPunto(rutaToDelete.origenId || rutaToDelete.origen?.id).nombre}</strong> y <strong>{getPunto(rutaToDelete.destinoId || rutaToDelete.destino?.id).nombre}</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setRutaToDelete(null)}>
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

export default Rutas
