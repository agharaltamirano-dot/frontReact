import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './usuarios.css'
function Usuarios() {
  const navigate = useNavigate()

  // Datos de ejemplo
  const [roles, setRoles] = useState([
    {
      id: 1,
      nombre: 'admin.sistema',
      nombrePersona: 'Carlos Eduardo Mendoza López',
      rol: 'Administrador',
      estado: true,
      fechaCreacion: '2024-01-15',
      ultimoAcceso: '2024-12-20 14:30:00'
    },
    {
      id: 2,
      nombre: 'maria.secretaria',
      nombrePersona: 'María Fernanda Torres Guzmán',
      rol: 'Secretaria',
      estado: true,
      fechaCreacion: '2024-02-20',
      ultimoAcceso: '2024-12-20 09:15:00'
    },
    {
      id: 3,
      nombre: 'juan.secretaria',
      nombrePersona: 'Juan Pablo Ramírez Soto',
      rol: 'Secretaria',
      estado: false,
      fechaCreacion: '2024-03-10',
      ultimoAcceso: '2024-11-28 16:45:00'
    },
    {
      id: 4,
      nombre: 'ana.admin',
      nombrePersona: 'Ana Patricia Velasco Hernández',
      rol: 'Administrador',
      estado: true,
      fechaCreacion: '2024-04-05',
      ultimoAcceso: '2024-12-19 11:00:00'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [notification, setNotification] = useState(null)
  const [roleToDelete, setRoleToDelete] = useState(null)

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    nombrePersona: '',
    rol: 'Secretaria',
    estado: true
  })

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Toggle estado del rol
  const toggleEstado = (id) => {
    setRoles(roles.map(rol =>
      rol.id === id ? { ...rol, estado: !rol.estado } : rol
    ))
    const rolActualizado = roles.find(r => r.id === id)
    showNotification(
      `Estado de ${rolActualizado.nombrePersona} actualizado exitosamente`,
      'success'
    )
  }

  // Abrir modal para agregar
  const handleAddNew = () => {
    setFormData({
      nombre: '',
      nombrePersona: '',
      rol: 'Secretaria',
      estado: true
    })
    setEditingRole(null)
    setShowAddModal(true)
  }

  // Abrir modal para editar
  const handleEdit = (rol) => {
    setFormData({
      nombre: rol.nombre,
      nombrePersona: rol.nombrePersona,
      rol: rol.rol,
      estado: rol.estado
    })
    setEditingRole(rol.id)
    setShowAddModal(true)
  }

  // Guardar (crear o actualizar)
  const handleSave = (e) => {
    e.preventDefault()

    if (editingRole) {
      // Actualizar existente
      setRoles(roles.map(rol =>
        rol.id === editingRole
          ? { ...rol, ...formData }
          : rol
      ))
      showNotification('Usuario actualizado exitosamente')
    } else {
      // Crear nuevo
      const newRole = {
        id: roles.length + 1,
        ...formData,
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimoAcceso: 'Nunca'
      }
      setRoles([...roles, newRole])
      showNotification('Nuevo usuario creado exitosamente')
    }

    setShowAddModal(false)
    setEditingRole(null)
  }

  // Eliminar rol
  const handleDelete = (id) => {
    setRoleToDelete(id)
  }

  const confirmDelete = () => {
    if (roleToDelete) {
      const rolEliminado = roles.find(r => r.id === roleToDelete)
      setRoles(roles.filter(rol => rol.id !== roleToDelete))
      showNotification(`Usuario de ${rolEliminado.nombrePersona} eliminado`, 'error')
      setRoleToDelete(null)
    }
  }

  const cancelDelete = () => {
    setRoleToDelete(null)
  }

  // Filtrar roles
  const filteredRoles = roles.filter(rol =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.nombrePersona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.rol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="usuarios-view">
      {/* Notificación */}
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

      {/* Contenido de Usuarios */}
      <div className="content-card">
        {/* Barra de herramientas */}
        <div className="toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por usuario, persona o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={handleAddNew} className="add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Usuario
          </button>
        </div>

        {/* Tabla de Usuarios */}
        <div className="table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th style={{ minWidth: '250px' }}>Persona</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((rol) => (
                <tr key={rol.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {rol.nombrePersona.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span className="username">{rol.nombre}</span>
                    </div>
                  </td>
                  <td className="person-name">{rol.nombrePersona}</td>
                  <td>
                    <span className={`role-badge ${rol.rol.toLowerCase()}`}>
                      {rol.rol}
                    </span>
                  </td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={rol.estado}
                        onChange={() => toggleEstado(rol.id)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </td>
                  <td className="date-cell">{rol.ultimoAcceso}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(rol)}
                        className="action-btn edit-btn"
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(rol.id)}
                        className="action-btn delete-btn"
                        title="Eliminar"
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

          {filteredRoles.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron resultados</h3>
              <p>Intente con otros términos de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Agregar/Editar */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="input-group">
                <label className="input-label">Usuario</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.nombrePersona}
                  onChange={(e) => setFormData({ ...formData, nombrePersona: e.target.value })}
                  className="input-field"
                  placeholder="Nombre completo de la persona"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="input-field"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Secretaria">Secretaria</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Estado</label>
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

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingRole ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {roleToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content confirmation-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={cancelDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar este usuario? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions" style={{ marginTop: '0' }}>
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
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

export default Usuarios