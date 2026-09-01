import { useState, useEffect } from 'react'
import './vehiculos.css'
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo, getConductores } from './vehiculoService'
import { getDistribuciones } from './asientosService'

function getVehicleImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const separator = path.startsWith('/') ? '' : '/'
  return `http://localhost:5093/assets/vehiculos${separator}${path}`
}

function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [distribucionesList, setDistribucionesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [aseguradoraFilter, setAseguradoraFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [notification, setNotification] = useState(null)
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Archivo seleccionado y su previsualización para el vehículo
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  // Errores de validación en tiempo real (duplicados)
  const [placaError, setPlacaError] = useState('')
  const [movilError, setMovilError] = useState('')

  // Estado del Formulario
  const [formData, setFormData] = useState({
    movil: '',
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    tipo: '',
    soat: '',
    aseguradora: '',
    conductorId: null,
    propietarioId: null,
    distribucionId: distribucionesList[0]?.id || 5,
    estado: true,
    foto: ''
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── Validaciones de duplicados en tiempo real ────────────────────────────────
  const checkPlacaDuplicate = (value, currentId) => {
    const dup = vehiculos.some(v => (v.placa || '').trim().toLowerCase() === value.trim().toLowerCase() && v.id !== currentId)
    setPlacaError(value.trim() && dup ? `Ya existe un vehículo registrado con la placa "${value}"` : '')
  }

  const checkMovilDuplicate = (value, currentId) => {
    const dup = vehiculos.some(v => (v.movil || '').toString().trim().toLowerCase() === value.toString().trim().toLowerCase() && v.id !== currentId)
    setMovilError(value.toString().trim() && dup ? `Ya existe un vehículo registrado con el móvil "${value}"` : '')
  }

  // ── GET Conductores ('api/conductores') ─────────────────────────────────────
  const fetchConductores = async () => {
    try {
      const data = await getConductores()
      if (Array.isArray(data) && data.length > 0) setConductores(data)
    } catch (err) {
      console.log('Usando conductores locales para pruebas:', err.message)
    }
  }

  // ── GET Asientos ('api/asientos') ───────────────────────────────────────────
  const fetchDistribuciones = async () => {
    try {
      const data = await getDistribuciones()
      if (Array.isArray(data) && data.length > 0) setDistribucionesList(data)
    } catch (err) {
      console.log('Usando lista local de distribuciones para pruebas:', err.message)
    }
  }

  // ── GET Vehículos ('api/vehiculos') ─────────────────────────────────────────
  const fetchVehiculos = async () => {
    setLoading(true)
    try {
      const data = await getVehiculos()
      if (Array.isArray(data) && data.length > 0) setVehiculos(data)
      console.log('Vehículos obtenidos del backend:', data)
    } catch (err) {
      console.log('Usando lista local de vehículos para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConductores()
    fetchDistribuciones()
    fetchVehiculos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFilter, aseguradoraFilter, statusFilter, itemsPerPage])

  // Helper resolver conductor
  const getConductor = (id) => {
    const c = conductores.find(item => Number(item.id) === Number(id))
    if (!c) return { nombres: `Conductor #${id}`, apellidos: '', licencia: 'N/A' }
    return c
  }

  // Helper resolver distribución de asientos
  const getDistribucionObj = (id) => {
    const a = distribucionesList.find(item => Number(item.id) === Number(id))
    if (!a) return { nombre: `Distribución #${id}`, cantidad: '?' }
    return a
  }

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (vehicle) => {
    const nuevoEstado = !vehicle.estado
    setVehiculos(prev => prev.map(v => v.id === vehicle.id ? { ...v, estado: nuevoEstado } : v))

    try {
      await updateVehiculo(vehicle.id, { ...vehicle, estado: nuevoEstado })
    } catch (err) {
      console.log('PUT backend vehiculos no disponible:', err.message)
    }

    showNotification(`Estado del vehículo ${vehicle.movil} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

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
    setFormData(prev => ({ ...prev, foto: '' }))
  }

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    const firstCondId = conductores[0]?.id || 1
    const secondCondId = conductores[1]?.id || firstCondId
    const firstDistribucionId = distribucionesList[0]?.id || 5
    setFormData({
      movil: '',
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      tipo: '',
      soat: '',
      aseguradora: '',
      conductorId: firstCondId,
      propietarioId: secondCondId,
      distribucionId: firstDistribucionId,
      estado: true,
      foto: ''
    })
    setSelectedFile(null)
    setPreviewUrl(null)
    setPlacaError('')
    setMovilError('')
    setEditingVehicle(null)
    setShowAddModal(true)
  }

  const handleEdit = (vehicle) => {
    const vehicleFoto = vehicle.foto || vehicle.Foto || ''
    setFormData({
      movil: vehicle.movil || '',
      placa: vehicle.placa || '',
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      color: vehicle.color || '',
      tipo: vehicle.tipo || '',
      soat: vehicle.soat || vehicle.nroSoat || '',
      aseguradora: vehicle.aseguradora || '',
      conductorId: vehicle.conductorId || vehicle.conductor?.id || conductores[0]?.id || 1,
      propietarioId: vehicle.propietarioId || vehicle.propietario?.id || conductores[0]?.id || 1,
      distribucionId: vehicle.asientosId || vehicle.asientos?.id || vehicle.distribucion?.id || distribucionesList[0]?.id || 5,
      estado: vehicle.estado ?? true,
      foto: vehicleFoto
    })
    setSelectedFile(null)
    setPreviewUrl(vehicleFoto ? getVehicleImageUrl(vehicleFoto) : null)
    setPlacaError('')
    setMovilError('')
    setEditingVehicle(vehicle)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Validaciones cliente
    if (!formData.movil || !formData.placa || !formData.marca || !formData.modelo || !formData.color || !formData.tipo || !formData.soat || !formData.aseguradora || !formData.conductorId || !formData.propietarioId || !formData.distribucionId) {
      showNotification('Complete todos los campos obligatorios (*)', 'error')
      setSaving(false)
      return
    }

    if (placaError || movilError) {
      showNotification('Corrija los campos con datos duplicados antes de guardar', 'error')
      setSaving(false)
      return
    }

    if ((formData.color || '').length > 10) {
      showNotification('El campo Color no debe superar 10 caracteres', 'error')
      setSaving(false)
      return
    }

    if ((formData.aseguradora || '').length > 20) {
      showNotification('El campo Aseguradora no debe superar 20 caracteres', 'error')
      setSaving(false)
      return
    }

    if ((formData.soat || '').length > 20) {
      showNotification('El campo SOAT no debe superar 20 caracteres', 'error')
      setSaving(false)
      return
    }
    //validacion donde se revisa si tiene distribucionId asiganda sino devuelve error
    if (!formData.distribucionId) {
      showNotification('Seleccione una distribución de asientos para el vehículo', 'error')
      setSaving(false)
      return
    }
    // Crear FormData
    const fd = new FormData()
    fd.append('movil', formData.movil)
    fd.append('placa', formData.placa)
    fd.append('marca', formData.marca)
    fd.append('modelo', formData.modelo)
    fd.append('color', formData.color)
    fd.append('tipo', formData.tipo)
    fd.append('soat', formData.soat)
    fd.append('aseguradora', formData.aseguradora)
    fd.append('conductorId', formData.conductorId.toString())
    fd.append('propietarioId', formData.propietarioId.toString())
    fd.append('estado', formData.estado.toString())
    fd.append('distribucionId', formData.distribucionId.toString())
    fd.append('Foto', formData.foto || '')

    if (selectedFile) {
      fd.append('foto', selectedFile)
    }

    // Resolver objetos anidados locales por si falla el back o faltan en el response
    const conductorObj = conductores.find(c => Number(c.id) === Number(formData.conductorId)) || { nombres: `Conductor #${formData.conductorId}`, apellidos: '' }
    const propietarioObj = conductores.find(c => Number(c.id) === Number(formData.propietarioId)) || { nombres: `Propietario #${formData.propietarioId}`, apellidos: '' }
    const distribucionObj = distribucionesList.find(d => Number(d.id) === Number(formData.distribucionId)) || { nombre: `Distribución #${formData.distribucionId}` }

    try {
      if (editingVehicle) {
        let updatedVehicle = {
          id: editingVehicle.id,
          movil: formData.movil,
          placa: formData.placa,
          marca: formData.marca,
          modelo: formData.modelo,
          color: formData.color,
          tipo: formData.tipo,
          soat: formData.soat,
          aseguradora: formData.aseguradora,
          conductorId: Number(formData.conductorId),
          propietarioId: Number(formData.propietarioId),
          estado: Boolean(formData.estado),
          distribucionId: Number(formData.distribucionId),
          foto: formData.foto,
          conductor: conductorObj,
          propietario: propietarioObj,
          distribucion: distribucionObj
        }

        try {
          fd.append('id', editingVehicle.id)
          const data = await updateVehiculo(editingVehicle.id, fd)
          if (data && data.id) {
            updatedVehicle = data
          }
        } catch (err) {
          console.log('PUT backend vehiculos no disponible, actualizando local:', err.message)
        }

        setVehiculos(prev => prev.map(v => v.id === editingVehicle.id ? updatedVehicle : v))
        showNotification('Vehículo actualizado exitosamente')
      } else {
        const newId = Date.now()
        let newVehicle = {
          id: newId,
          movil: formData.movil,
          placa: formData.placa,
          marca: formData.marca,
          modelo: formData.modelo,
          color: formData.color,
          tipo: formData.tipo,
          soat: formData.soat,
          aseguradora: formData.aseguradora,
          conductorId: Number(formData.conductorId),
          propietarioId: Number(formData.propietarioId),
          estado: Boolean(formData.estado),
          distribucionId: Number(formData.distribucionId),
          foto: selectedFile ? URL.createObjectURL(selectedFile) : '',
          conductor: conductorObj,
          propietario: propietarioObj,
          distribucion: distribucionObj
        }

        try {
          const data = await createVehiculo(fd)
          if (data && data.id) {
            newVehicle = data
          }
        } catch (err) {
          console.log('POST backend vehiculos no disponible, agregando local:', err.message)
        }
        fetchVehiculos()
        // setVehiculos(prev => [newVehicle, ...prev])
        showNotification('Nuevo vehículo registrado exitosamente')
      }

      setShowAddModal(false)
      setEditingVehicle(null)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      showNotification('Error al guardar vehículo: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (vehicle) => setVehicleToDelete(vehicle)

  const confirmDelete = async () => {
    if (!vehicleToDelete) return
    // setVehiculos(prev => prev.filter(v => v.id !== vehicleToDelete.id))

    try {
      await deleteVehiculo(vehicleToDelete.id)
    } catch (err) {
      console.log('DELETE backend vehiculos no disponible:', err.message)
    }

    showNotification('Vehículo eliminado del sistema', 'error')
    setVehicleToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const normalize = (str) => (str || '').toString().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

  const filteredVehiculos = vehiculos.filter(v => {
    const _conductorFromGet = getConductor(v.conductorId || v.conductor?.id)
    const isPlaceholder = (c) => !c || !c.nombres || /^Conductor #/.test(String(c.nombres))
    const conductorObj = (!isPlaceholder(_conductorFromGet))
      ? _conductorFromGet
      : (v.conductor && (v.conductor.nombres || v.conductor.apellidos) ? v.conductor : { nombres: '', apellidos: '' })

    const _propFromGet = getConductor(v.propietarioId || v.propietario?.id)
    const propietarioObj = (!isPlaceholder(_propFromGet))
      ? _propFromGet
      : (v.propietario && (v.propietario.nombres || v.propietario.apellidos) ? v.propietario : { nombres: '', apellidos: '' })

    const textTarget = `${v.movil} ${v.marca} ${v.modelo} ${v.placa} ${conductorObj.nombres} ${conductorObj.apellidos} ${propietarioObj.nombres} ${propietarioObj.apellidos}`
    const matchesSearch = normalize(textTarget).includes(normalize(searchTerm))
    const matchesTipo = tipoFilter === 'todos' || v.tipo === tipoFilter
    const matchesAseguradora = aseguradoraFilter === 'todos' || v.aseguradora === aseguradoraFilter
    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && v.estado) ||
      (statusFilter === 'inactivos' && !v.estado)

    return matchesSearch && matchesTipo && matchesAseguradora && matchesStatus
  })
  // Paginación
  const totalItems = filteredVehiculos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVehiculos = filteredVehiculos.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="vehiculos-view">
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
                placeholder="Buscar vehículo por móvil, placa, marca o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Sedán">Sedán</option>
              <option value="Minibús">Minibús</option>
              <option value="Van">Van</option>
              <option value="Bus Cama">Bus Cama</option>
              <option value="Omnibús">Omnibús</option>
            </select>

            <select
              value={aseguradoraFilter}
              onChange={(e) => setAseguradoraFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Aseguradoras</option>
              <option value="La Boliviana">La Boliviana</option>
              <option value="Alianza Seguros">Alianza Seguros</option>
              <option value="BISA Seguros">BISA Seguros</option>
              <option value="Nacional Vida">Nacional Vida</option>
              <option value="Rímac Seguros">Rímac Seguros</option>
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
            */}
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Vehículo
          </button>
        </div>

        {/* Tabla de Vehículos */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando vehículos...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Móvil</th>
                  <th>Placa</th>
                  <th>Marca / Modelo</th>
                  <th>Color / Tipo</th>
                  <th>Conductor</th>
                  <th>Propietario</th>
                  <th>Distribución</th>
                  <th>SOAT / Seguro</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehiculos.map((v) => {
                  const cond = v.conductor //getConductor(v.conductorId || v.conductor?.id)
                  const prop = v.propietario //getConductor(v.propietarioId || v.propietario?.id)
                  const dist = v.distribucion //getDistribucionObj(v.distribucionId || v.distribucion?.id)
                  const vehicleFoto = v.foto || v.Foto

                  return (
                    <tr key={v.id}>
                      <td>
                        <div
                          className="user-avatar-small"
                          style={{ cursor: vehicleFoto ? 'pointer' : 'default' }}
                          onClick={vehicleFoto ? () => setFullscreenImage(getVehicleImageUrl(vehicleFoto)) : undefined}
                        >
                          {vehicleFoto ? (
                            <img src={getVehicleImageUrl(vehicleFoto)} alt="Vehículo" className="avatar-img" />
                          ) : (
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>Sin foto</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="movil-badge">{v.movil}</span>
                      </td>
                      <td>
                        <span className="placa-pill">{v.placa}</span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: 'var(--slate-900)' }}>{v.marca}</strong>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{v.modelo}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{v.tipo}</span>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{v.color}</span>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-driver-info">
                          <div className="vehicle-driver-avatar">
                            {cond.nombres ? cond.nombres[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--slate-900)' }}>
                              {cond.nombres} {cond.apellidos}
                            </span>
                            {cond.licencia && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Lic: {cond.licencia}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-driver-info">
                          <div className="vehicle-driver-avatar" style={{ background: '#fef3c7', color: '#b45309' }}>
                            {prop.nombres ? prop.nombres[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--slate-900)' }}>
                              {prop.nombres} {prop.apellidos}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="seats-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          </svg>
                          {dist.nombre}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
                            {v.soat || v.nroSoat}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            {v.aseguradora}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${v.estado !== false ? 'active' : 'inactive'}`}>
                          {v.estado !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          {/* <button
                            onClick={() => toggleEstado(v)}
                            className="action-btn edit-btn"
                            title={v.estado !== false ? 'Desactivar Vehículo' : 'Activar Vehículo'}
                            style={{ color: v.estado !== false ? '#10b981' : '#94a3b8' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                          </button> */}
                          <button
                            onClick={() => handleEdit(v)}
                            className="action-btn edit-btn"
                            title="Editar Vehículo"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="action-btn delete-btn"
                            title="Eliminar Vehículo"
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

          {!loading && filteredVehiculos.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron vehículos</h3>
              <p>Intente ajustando el término de búsqueda o los filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredVehiculos.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} vehículos
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

      {/* Modal Crear / Editar Vehículo */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="required-note">Los que tienen <span className="required">*</span> son campos obligatorios</div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">N° Móvil <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.movil}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, movil: value })
                      checkMovilDuplicate(value, editingVehicle?.id)
                    }}
                    className="input-field"
                    placeholder="Ej. 101"
                    required
                  />
                  {movilError && <span className="field-error" style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>{movilError}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Placa <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, placa: value })
                      checkPlacaDuplicate(value, editingVehicle?.id)
                    }}
                    className="input-field"
                    placeholder="Ej. ABC123"
                    required
                  />
                  {placaError && <span className="field-error" style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>{placaError}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Marca <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Toyota"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Modelo <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Corolla"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Color <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.color}
                    maxLength={10}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Rojo (máx 10 caracteres)"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Tipo de Vehículo <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Sedán, Minibús, Van..."
                    required
                  />
                </div>
              </div>

              {/* Selección de Conductor y Propietario desde 'api/conductores' */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Conductor Asignado</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({ ...formData, conductorId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} {c.licencia ? `(Lic: ${c.licencia})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Propietario</label>
                  <select
                    value={formData.propietarioId}
                    onChange={(e) => setFormData({ ...formData, propietarioId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de Asientos desde 'api/asientos' */}
              <div className="form-grid-2">
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Distribución de Asientos <span className="required">*</span></label>
                  <div className="distrib-carousel" role="list" style={{ width: '100%' }}>
                    {distribucionesList.map((d) => {
                      const maxFila = d.asientos && d.asientos.length > 0 ? Math.max(...d.asientos.map(s => s.fila)) : 1
                      const rows = maxFila
                      const cols = 3

                      return (
                        <div
                          key={d.id}
                          className={`dist-card ${Number(formData.distribucionId) === Number(d.id) ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, distribucionId: Number(d.id) })}
                          role="listitem"
                          tabIndex={0}
                        >
                          <div className="dist-card-title">{d.nombre}</div>
                          <div className="dist-seats-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                            {Array.from({ length: rows }).map((_, rIdx) => (
                              Array.from({ length: cols }).map((_, cIdx) => {
                                const fila = rIdx + 1
                                const columna = cIdx + 1
                                const seat = d.asientos?.find(s => Number(s.fila) === fila && Number(s.columna) === columna)
                                const filled = !!seat && seat.estado !== false
                                return (
                                  <div key={`${fila}-${columna}`} className={`seat ${filled ? 'filled' : ''}`} title={filled ? `Asiento ${seat?.numero || ''}` : ' '}></div>
                                )
                              })
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">SOAT</label>
                  <input
                    type="text"
                    value={formData.soat}
                    maxLength={20}
                    onChange={(e) => setFormData({ ...formData, soat: e.target.value })}
                    className="input-field"
                    placeholder="Ej. SOAT2026"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Aseguradora</label>
                  <input
                    type="text"
                    value={formData.aseguradora}
                    maxLength={20}
                    onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })}
                    className="input-field"
                    placeholder="Nombre de la aseguradora (máx 20 caracteres)"
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-group">
                  <label className="input-label">Foto del Vehículo (Opcional)</label>
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
                          <span>Sin foto</span>
                        </div>
                      )}
                    </div>
                    <div className="upload-btn-wrapper">
                      <input
                        type="file"
                        id="foto_vehiculo"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="foto_vehiculo" className="upload-file-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>{previewUrl ? 'Cambiar Foto' : 'Seleccionar Foto'}</span>
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
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando...' : (editingVehicle ? 'Actualizar' : 'Crear') + ' Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {vehicleToDelete && (
        <div className="modal-overlay" onClick={() => setVehicleToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setVehicleToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar el vehículo <strong>M-{vehicleToDelete.movil} ({vehicleToDelete.placa})</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setVehicleToDelete(null)}>
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

export default Vehiculos
