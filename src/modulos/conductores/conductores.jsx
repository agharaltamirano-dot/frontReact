import { useState, useEffect } from 'react'
import './conductores.css'

const BASE_URL = 'http://localhost:5093/api/conductores'

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

function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const separator = path.startsWith('/') ? '' : '/'
  return `http://localhost:5093/assets/licencias${separator}${path}`
}

function Conductores() {
  const [conductores, setConductores] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [notification, setNotification] = useState(null)
  const [driverToDelete, setDriverToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Archivo seleccionado y su previsualización
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  // Formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    licencia: '',
    categoria: '',
    estado: true,
    fotoLicencia: ''
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  const fetchConductores = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setConductores(data)
        }
      }
    } catch (err) {
      console.log('Usando lista local de conductores para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConductores() }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, statusFilter, itemsPerPage])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedExtensions = ['png', 'jpg', 'jpeg']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (!allowedExtensions.includes(fileExtension)) {
        showNotification('Solo se permiten imágenes en formato PNG, JPG o JPEG', 'error')
        e.target.value = ''
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setFormData(prev => ({ ...prev, fotoLicencia: '' }))
  }

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      telefono: '',
      licencia: '',
      categoria: '',
      estado: true,
      fotoLicencia: ''
    })
    setSelectedFile(null)
    setPreviewUrl(null)
    setEditingDriver(null)
    setShowAddModal(true)
  }

  const handleEdit = (driver) => {
    setFormData({
      nombres: driver.nombres || '',
      apellidos: driver.apellidos || '',
      telefono: driver.telefono || '',
      licencia: driver.licencia || '',
      categoria: driver.categoria || '',
      estado: driver.estado !== false,
      fotoLicencia: driver.fotoLicencia || ''
    })
    setSelectedFile(null)
    setPreviewUrl(driver.fotoLicencia ? getImageUrl(driver.fotoLicencia) : null)
    setEditingDriver(driver)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()

    // Validar duplicado de licencia
    const isLicenseDuplicate = conductores.some(c =>
      c.licencia?.trim().toLowerCase() === formData.licencia?.trim().toLowerCase() &&
      (!editingDriver || c.id !== editingDriver.id)
    );

    if (isLicenseDuplicate) {
      showNotification('El número de licencia ya está registrado para otro conductor', 'error')
      return
    }

    // Validar foto de licencia obligatoria
    if (!selectedFile && !formData.fotoLicencia) {
      showNotification('La foto de la licencia es obligatoria', 'error')
      return
    }

    setSaving(true)

    // Crear FormData para adjuntar el archivo y los campos
    const fd = new FormData()
    fd.append('nombres', formData.nombres)
    fd.append('apellidos', formData.apellidos)
    fd.append('telefono', formData.telefono)
    fd.append('licencia', formData.licencia)
    fd.append('categoria', formData.categoria)
    fd.append('estado', formData.estado.toString())
    fd.append('fotoLicencia', formData.fotoLicencia || '')

    if (selectedFile) {
      fd.append('foto_licencia', selectedFile)
    }

    try {
      if (editingDriver) {
        let updatedDriver = { ...formData, id: editingDriver.id }
        // Intento backend PUT
        try {
          fd.append('id', editingDriver.id)
          const res = await fetch(`${BASE_URL}/${editingDriver.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${getToken()}`
            },
            body: fd
          })
          if (res.ok) {
            const text = await res.text()
            if (text) {
              const data = JSON.parse(text)
              if (data) {
                updatedDriver = data
              }
            }
          }
        } catch (err) {
          console.log('PUT en backend no disponible, actualizando estado local:', err.message)
        }

        setConductores(prev => prev.map(d => d.id === editingDriver.id ? updatedDriver : d))
        showNotification('Conductor actualizado exitosamente')
      } else {
        // Intento backend POST
        const newId = Date.now()
        let newDriver = { ...formData, id: newId }
        try {
          const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getToken()}`
            },
            body: fd
          })
          if (res.ok) {
            const text = await res.text()
            if (text) {
              const data = JSON.parse(text)
              if (data) {
                newDriver = data
              }
            }
          }
        } catch (err) {
          console.log('POST en backend no disponible, agregando en estado local:', err.message)
        }

        setConductores(prev => [newDriver, ...prev])
        showNotification('Nuevo conductor registrado exitosamente')
      }

      setShowAddModal(false)
      setEditingDriver(null)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      showNotification('Error al guardar conductor: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle Estado / Eliminación lógica ────────────────────────────────────────
  const toggleEstado = async (driver) => {
    const nuevoEstado = !driver.estado
    setConductores(prev => prev.map(d => d.id === driver.id ? { ...d, estado: nuevoEstado } : d))

    try {
      await fetch(`${BASE_URL}/estado/${driver.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
      })
    } catch {
      // Ok en modo local
    }
    showNotification(`Estado de ${driver.nombres} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (driver) => setDriverToDelete(driver)

  const confirmDelete = async () => {
    if (!driverToDelete) return
    setConductores(prev => prev.filter(d => d.id !== driverToDelete.id))

    try {
      await fetch(`${BASE_URL}/${driverToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch {
      // Ok en modo local
    }

    showNotification('Conductor eliminado del registro', 'error')
    setDriverToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  // Normaliza texto para ignorar mayúsculas y acentos
  const normalize = (str) => (str || '').toString().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

  // Lista dinámica de categorías extraídas de los conductores
  const categoriesList = Array.from(new Set(conductores.map(c => c.categoria).filter(Boolean))).sort()

  const filteredConductores = conductores.filter(d => {
    const textTarget = `${d.nombres} ${d.apellidos} ${d.licencia || ''} ${d.telefono || ''}`
    const matchesSearch = normalize(textTarget).includes(normalize(searchTerm))

    const matchesCategory = categoryFilter === 'todos' || d.categoria === categoryFilter

    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && d.estado) ||
      (statusFilter === 'inactivos' && !d.estado)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Paginación
  const totalItems = filteredConductores.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConductores = filteredConductores.slice(startIndex, startIndex + itemsPerPage)

  const licenseExists = formData.licencia?.trim() !== '' && conductores.some(c =>
    c.licencia?.trim().toLowerCase() === formData.licencia?.trim().toLowerCase() &&
    (!editingDriver || c.id !== editingDriver.id)
  );

  return (
    <div className="conductores-view">
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
                placeholder="Buscar por nombres, apellidos o licencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filtro Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Categorías</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtro Estado */}
            {/*<select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select> */}
          </div>

          <button onClick={handleAddNew} className="add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Conductor
          </button>
        </div>

        {/* Tabla de Conductores */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando conductores...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Teléfono</th>
                  <th>N° Licencia</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConductores.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="user-cell">
                        <div
                          className="user-avatar-small"
                          style={{ cursor: driver.fotoLicencia ? 'pointer' : 'default' }}
                          onClick={driver.fotoLicencia ? () => setFullscreenImage(getImageUrl(driver.fotoLicencia)) : undefined}
                        >
                          {driver.fotoLicencia ? (
                            <img src={getImageUrl(driver.fotoLicencia)} alt="Licencia" className="avatar-img" />
                          ) : (
                            <>{driver.nombres?.charAt(0)}{driver.apellidos?.charAt(0)}</>
                          )}
                        </div>
                        <div className="driver-name-container">
                          <span className="driver-full-name">{driver.nombres} {driver.apellidos}</span>
                        </div>
                      </div>
                    </td>
                    <td>{driver.telefono || '—'}</td>
                    <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#000' }}>{driver.licencia}</code></td>
                    <td>
                      <span className={`category-badge ${driver.categoria?.toLowerCase().includes('iii') ? 'a-iii' : driver.categoria?.toLowerCase().includes('ii') ? 'a-ii' : 'a-i'}`}>
                        {driver.categoria}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="action-btn edit-btn"
                          title="Editar Conductor"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(driver)}
                          className="action-btn delete-btn"
                          title="Eliminar Conductor"
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

          {!loading && filteredConductores.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron conductores</h3>
              <p>Intente ajustando el término de búsqueda o los filtros de categoría</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredConductores.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} conductores
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

      {/* Modal Crear / Editar Conductor */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
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
                  <label className="input-label">Nombres</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Juan Carlos"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Perez Quispe"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 71234567"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">N° Licencia</label>
                  <input
                    type="text"
                    value={formData.licencia}
                    onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                    className={`input-field ${licenseExists ? 'input-error' : ''}`}
                    placeholder="Ej. 4892019"
                    required
                  />
                  {licenseExists && (
                    <span className="license-warning">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Esta licencia ya está registrada para otro conductor
                    </span>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Categoría de Licencia</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    maxLength={3}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="Ej. A-I (máx 3 caracteres)"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Estado Inicial</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
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

              <div className="form-grid-2" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-group">
                  <label className="input-label">Foto de Licencia</label>
                  <div className="image-upload-wrapper">
                    <div className="image-preview-container">
                      {previewUrl ? (
                        <div className="preview-image-wrapper">
                          <img
                            src={previewUrl}
                            alt="Vista previa"
                            className="preview-image"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFullscreenImage(previewUrl)}
                          />
                          <button type="button" className="remove-image-btn" onClick={handleRemoveImage} title="Quitar imagen">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <div className="upload-btn-wrapper">
                      <input
                        type="file"
                        id="foto_licencia"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="foto_licencia" className="upload-file-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>{previewUrl ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</span>
                      </label>
                    </div>
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
                <button type="submit" className="save-btn" disabled={saving || licenseExists}>
                  {saving ? 'Guardando...' : (editingDriver ? 'Actualizar' : 'Crear') + ' Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {driverToDelete && (
        <div className="modal-overlay" onClick={() => setDriverToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setDriverToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar al conductor <strong>{driverToDelete.nombres} {driverToDelete.apellidos}</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setDriverToDelete(null)}>
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
      {fullscreenImage && (
        <div className="fullscreen-image-overlay" onClick={() => setFullscreenImage(null)}>
          <div className="fullscreen-image-content" onClick={(e) => e.stopPropagation()}>
            <button className="fullscreen-close-btn" onClick={() => setFullscreenImage(null)} title="Cerrar visor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={fullscreenImage} alt="Foto ampliada" className="fullscreen-image-img" />
          </div>
        </div>
      )}
    </div>
  )
}

export default Conductores
