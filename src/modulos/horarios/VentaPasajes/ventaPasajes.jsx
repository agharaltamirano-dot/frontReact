import React, { useEffect, useState, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Grid, Divider, Typography } from '@mui/material'
import { getHorarioById, postPasajesBatch, deletePasaje } from './ventaPasajesSevice'
import './ventaPasajes.css'

export default function VentaPasajes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [horario, setHorario] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [pasajesOpen, setPasajesOpen] = useState(false)

  const openPasajes = () => setPasajesOpen(true)
  const closePasajes = () => setPasajesOpen(false)

  const destinosOptions = (horario?.ruta?.destinos || []).map(d => {
    const pv = d.puntoVenta || {}
    return { id: pv.id || d.id || '', nombre: pv.nombre || pv || '' }
  })

  const formatDateLocal = (dateStr) => {
    if (!dateStr) return ''
    // if format YYYY-MM-DD, construct local date to avoid timezone shift
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    let dt
    if (m) {
      dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    } else {
      dt = new Date(dateStr)
    }
    try {
      return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(dt)
    } catch {
      return dt.toLocaleDateString()
    }
  }

  const toggleSelectSeat = (seat) => {
    if (!seat) return
    const exists = selectedSeats.find(s => Number(s.id) === Number(seat.id))
    if (exists) {
      setSelectedSeats(prev => prev.filter(s => Number(s.id) !== Number(seat.id)))
    } else {
      setSelectedSeats(prev => [...prev, { id: seat.id, numero: seat.numero, fila: seat.fila, columna: seat.columna, pasajero: '', monto: '', ci: '', telefono: '', destinoId: '' }])
    }
  }

  const removeSelected = (id) => setSelectedSeats(prev => prev.filter(s => Number(s.id) !== Number(id)))

  const updateSelectedField = (id, field, value) => {
    setSelectedSeats(prev => prev.map(s => Number(s.id) === Number(id) ? { ...s, [field]: value } : s))
  }

  const confirmSale = (id) => {
    const sel = selectedSeats.find(s => Number(s.id) === Number(id))
    if (!sel) return
    if (!sel.pasajero) {
      alert('Ingrese nombre del pasajero')
      return
    }
    const montoNum = parseFloat(String(sel.monto).replace(',', '.'))
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Ingrese un monto válido mayor a 0')
      return
    }
    // marcar asiento como vendido en el horario local
    const updated = { ...horario }
    const asientos = updated.vehiculo?.distribucion?.asientos || []
    const idx = asientos.findIndex(a => Number(a.id) === Number(id))
    if (idx >= 0) {
      const asiento = { ...asientos[idx], pasajes: { nombre: sel.pasajero, destinoId: sel.destinoId } }
      const newAsientos = [...asientos]
      newAsientos[idx] = asiento
      if (updated.vehiculo && updated.vehiculo.distribucion) {
        updated.vehiculo = { ...updated.vehiculo, distribucion: { ...updated.vehiculo.distribucion, asientos: newAsientos } }
      }
      setHorario(updated)
    }
    // quitar de seleccionados
    removeSelected(id)
  }

  const formatFechaHoraNow = () => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    return `${y}-${m}-${dd} ${hh}:${mi}:${ss}`
  }

  const getAuthUsuarioId = () => {
    try {
      const raw = sessionStorage.getItem('authData')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.usuario?.id ?? parsed?.usuarioId ?? null
    } catch {
      return null
    }
  }

  const getDestinoName = (destinoId) => {
    try {
      const dests = Array.isArray(horario?.ruta?.destinos) ? horario.ruta.destinos : []
      if (destinoId) {
        const found = dests.find(d => String(d.puntoVenta?.id || d.id) === String(destinoId))
        if (found) return found.puntoVenta?.nombre || found.nombre || ''
      }
      // fallback to final destino
      const sorted = [...dests].sort((a,b)=> (a.orden||0)-(b.orden||0))
      return sorted[sorted.length-1]?.puntoVenta?.nombre || ''
    } catch {
      return ''
    }
  }

  const handleAction = async (isReserva) => {
    if (!selectedSeats || selectedSeats.length === 0) {
      alert('No hay asientos seleccionados')
      return
    }

    // Validate and build items
    const items = []
    for (const s of selectedSeats) {
      if (!s.pasajero) {
        alert(`Ingrese nombre para asiento ${s.numero}`)
        return
      }
      const montoNum = parseFloat(String(s.monto).replace(',', '.'))
      if (isNaN(montoNum) || montoNum <= 0) {
        alert(`Monto inválido en asiento ${s.numero}`)
        return
      }
      const destinoName = getDestinoName(s.destinoId)
      const movil = horario?.vehiculo?.movil || ''
      const usuarioId = getAuthUsuarioId()
      const item = {
        fechaHora: formatFechaHoraNow(),
        monto: montoNum,
        movil: movil,
        estado: true,
        destino: destinoName,
        asientoId: s.id,
        reserva: !!isReserva,
        horarioId: horario?.id ?? id,
        usuarioId: usuarioId,
        cliente: {
          nombreCompleto: s.pasajero,
          ci: s.ci || null,
          telefono: s.telefono || null,
          estado: true
        }
      }
      items.push(item)
    }

    // Send to server
    try {
      // optional confirm
      const resp = await postPasajesBatch(items)
      // If server returns created pasajes, append them; otherwise, append our local items as pasajes
      const nuevos = Array.isArray(resp) ? resp : items
      // Normalize to horario.pasajes entries
      const existing = horario?.pasajes || []
      const merged = [...existing, ...nuevos]
      setHorario(prev => ({ ...prev, pasajes: merged }))
      // clear selected
      setSelectedSeats([])
      alert('Operación realizada con éxito')
    } catch (err) {
      console.error('Error enviando pasajes:', err)
      alert('Error al enviar los pasajes: ' + (err.message || ''))
    }
  }

  const handleAnular = async (pasajeId) => {
    if (!pasajeId) return
    if (!confirm('Confirma anular este pasaje?')) return
    try {
      await deletePasaje(pasajeId)
      // marcar localmente y luego refrescar horario desde el servidor (para reflejar cambios globales)
      setHorario(prev => {
        if (!prev) return prev
        const nuevos = (prev.pasajes || []).map(p => p.id === pasajeId ? { ...p, estado: false } : p)
        return { ...prev, pasajes: nuevos }
      })
      // refrescar horario desde API para obtener el estado definitivo (asientos limpios si aplica)
      try {
        const fresh = await getHorarioById(horario?.id ?? id)
        setHorario(fresh)
      } catch (fetchErr) {
        console.warn('No se pudo refrescar horario tras anular:', fetchErr)
      }
      alert('Pasaje anulado')
    } catch (err) {
      console.error('Error anulando pasaje', err)
      alert('Error al anular: ' + (err.message || ''))
    }
  }

  const renderSeatGrid = (horario) => {
    const asientos = horario?.vehiculo?.distribucion?.asientos || []
    const maxFila = asientos.reduce((m, a) => Math.max(m, a.fila || 0), 0) || 1
    const cols = 3
    const rows = []
    for (let r = 1; r <= maxFila; r++) {
      const colsArr = []
      for (let c = 1; c <= cols; c++) {
        const seat = asientos.find(a => Number(a.fila) === r && Number(a.columna) === c)
        if (!seat) {
          // If this grid position is the first row,col and there's no seat, show driver icon
          if (r === 1 && c === 1) {
            colsArr.push(
              <div key={`r${r}c${c}`} className="seat driver-empty" aria-hidden>
                <div className="driver-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" fill="#000"/>
                    <path d="M4 21c0-3.866 3.582-7 8-7s8 3.134 8 7v1H4v-1z" fill="#000" opacity="0.95"/>
                  </svg>
                </div>
              </div>
            )
          } else {
            colsArr.push(
              <div key={`r${r}c${c}`} className="seat empty-slot" />
            )
          }
        } else {
          // find if there's a pasaje for this asiento in horario.pasajes
          const pasaje = (horario.pasajes || []).find(p => Number(p.asiento?.id) === Number(seat.id) && p.estado === true)
          const occupied = !!pasaje || !!seat.pasajes || seat.estado === false
          const selected = selectedSeats.some(s => Number(s.id) === Number(seat.id))
          colsArr.push(
            <div
              key={seat.id}
              className={`seat ${occupied ? 'occupied' : selected ? 'selected' : 'available'}`}
              onClick={() => { if (!occupied) toggleSelectSeat(seat) }}
            >
              {pasaje ? (
                <>
                  {pasaje.reserva && (
                    <div className="reservation-badge" title="Reserva" aria-hidden>
                      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 3h10v13l-5-2-5 2V3z" fill="#f59e0b"/>
                      </svg>
                    </div>
                  )}
                  <div className="seat-info">
                    <div className="seat-name">{pasaje.cliente?.nombreCompleto || 'N/A'}</div>
                    <div className="seat-phone">{pasaje.cliente?.telefono || ''}</div>
                    <div className="seat-monto">Bs. {Number(pasaje.monto || 0).toFixed(2)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="seat-num">{seat.numero}</div>
                  {seat.pasajes && <div className="seat-pass">{seat.pasajes.nombre || 'VEND'}</div>}
                </>
              )}
            </div>
          )
        }
      }
      rows.push(<div key={`row-${r}`} className="seat-row">{colsArr}</div>)
    }
    return rows
  }

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      try {
        const data = await getHorarioById(id)
        console.log('Horario recibido en VentaPasajes:', data)
        setHorario(data)
      } catch (err) {
        console.error('Error al obtener horario:', err)
      }
    }
    fetchData()
  }, [id])

  return (
    <div className="venta-screen">
      {/* <div className="venta-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Venta de Pasajes</h2>
        <button className="close" onClick={() => navigate(-1)}>Volver</button>
      </div> */}

      <div className="venta-body">
        {!horario && <div>Cargando horario...</div>}
        {horario && (
          <>
            <div className="horario-row card">
              <div className="horario-item fecha"><strong>Fecha:</strong> {formatDateLocal(horario.fecha)}</div>
              <div className="horario-item hora"><strong>Hora:</strong> {horario.hora}</div>
              <div className="horario-item ruta"><strong>Ruta:</strong> {(() => {
                const dests = Array.isArray(horario.ruta?.destinos) ? [...horario.ruta.destinos].sort((a,b)=> (a.orden||0)-(b.orden||0)) : []
                const o = dests[0]?.puntoVenta?.nombre || ''
                const d = dests[dests.length-1]?.puntoVenta?.nombre || ''
                return `${o} → ${d}`
              })()}</div>
              <div className="horario-item tarifa"><strong>Tarifa:</strong> Bs. {Number(horario.ruta?.tarifa || 0).toFixed(2)}</div>
            </div>
            <div className="venta-columns">
            <div className="card sell-card">
              <h3>Pasajes</h3>
              <div className="selected-list">
                {selectedSeats.length === 0 && <div className="empty">No hay asientos seleccionados</div>}
                {selectedSeats.map(s => (
                  <div className="selected-item" key={s.id}>
                    <div className="seat-badge">{s.numero}</div>
                    <div className="selected-meta">
                      <input
                        type="text"
                        placeholder="Nombre del pasajero (obligatorio)"
                        value={s.pasajero || ''}
                        onChange={(e) => updateSelectedField(s.id, 'pasajero', e.target.value)}
                        className="input-small"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Monto (Bs.) - obligatoria"
                        value={s.monto || ''}
                        onChange={(e) => updateSelectedField(s.id, 'monto', e.target.value)}
                        className="input-small"
                      />
                      <input
                        type="text"
                        placeholder="CI (opcional)"
                        value={s.ci || ''}
                        onChange={(e) => updateSelectedField(s.id, 'ci', e.target.value)}
                        className="input-small"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono (opcional)"
                        value={s.telefono || ''}
                        onChange={(e) => updateSelectedField(s.id, 'telefono', e.target.value)}
                        className="input-small"
                      />
                      <select value={s.destinoId || ''} onChange={(e) => updateSelectedField(s.id, 'destinoId', e.target.value)} className="input-small">
                        <option value="">Seleccionar destino</option>
                        {destinosOptions.map(d => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="selected-actions">
                      <button onClick={() => confirmSale(s.id)} className="confirm-btn">Vender</button>
                      <button onClick={() => removeSelected(s.id)} className="remove-btn">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card map-card">
              <h3 className="asientos-title"> <span className="asientos-meta movil-meta">{(() => {
                const movil = horario?.vehiculo?.movil || horario?.vehiculo?.movil
                const conductor = horario?.vehiculo?.conductor ? `${horario.vehiculo.conductor.nombres || ''} ${horario.vehiculo.conductor.apellidos || ''}`.trim() : ''
                return (
                  <>
                    <span className="movil-label">Móvil</span>{' '}
                    <span className="movil-badge">{movil || '-'}</span>
                    {' — '}
                    <span className="conductor-name">{conductor || '-'}</span>
                  </>
                )
              })()}</span></h3>
              <div className="seat-grid">
                {renderSeatGrid(horario)}
              </div>
              <div className="legend">
                <span className="legend-item"><span className="dot available"/> Disponible</span>
                <span className="legend-item"><span className="dot occupied"/> Vendido</span>
                <span className="legend-item"><span className="dot empty"/> Vacío</span>
                <span className="legend-item"><span className="dot selected"/> Seleccionado</span>
                <span className="legend-item"><span className="res-icon"/> Reservas</span>
              </div>
            </div>
            </div>
            <Box className="venta-actions" role="region" aria-label="Acciones de venta" sx={{position: 'sticky', bottom: 0, bgcolor: 'background.paper', py:1}}>
              <Stack direction="row" spacing={2} sx={{width:'100%', alignItems: 'center', justifyContent: 'space-between'}}>
                <Stack direction="row" spacing={1} sx={{display:'flex', alignItems:'center'}}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleAction(false)}
                    startIcon={(
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M21 7H3v10a2 2 0 002 2h14a2 2 0 002-2V7z" fill="#10b981"/>
                        <path d="M8 12l2 2 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  >
                    Pagado
                  </Button>

                  <Button
                    variant="contained"
                    sx={{background:'#f59e0b','&:hover':{background:'#d97706'}}}
                    onClick={() => handleAction(true)}
                    startIcon={(
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 2h9l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V2z" fill="#f59e0b"/>
                        <path d="M8 7h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                        <path d="M8 11h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    )}
                  >
                    Reservar
                  </Button>
                </Stack>

                <Box>
                      <Button onClick={openPasajes} variant="outlined" color="primary" sx={{textTransform:'none'}} startIcon={(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 6h18M3 12h18M3 18h18" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}>
                    Pasajes
                  </Button>
                </Box>
              </Stack>
            </Box>
            
                {/* Dialog de Pasajes */}
                <Dialog open={pasajesOpen} onClose={closePasajes} maxWidth="md" fullWidth>
                  <DialogTitle sx={{textAlign:'center', fontWeight:700,color: 'black'}}>PASAJES</DialogTitle>
                  <DialogContent dividers>
                    <List>
                      {(horario?.pasajes || []).map(p => (
                        <Fragment key={p.id}>
                          <ListItem alignItems="flex-start" sx={{py:1}}>
                            <ListItemAvatar>
                              <Avatar sx={{bgcolor: p.estado===false ? 'grey.500' : p.reserva ? '#f59e0b' : 'primary.main'}}>
                                {p.estado===false ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 6l12 12M6 18L18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ) : p.reserva ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="#fff" opacity="0.12"/>
                                    <path d="M7 10h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                                  </svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="5" fill="#fff"/>
                                  </svg>
                                )}
                              </Avatar>
                            </ListItemAvatar>

                            <Box sx={{flex: 1}}>
                              <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                                <Box sx={{flex: '1 1 66.666%', minWidth: 0}}>
                                  <Typography variant="subtitle1" sx={{fontWeight:700}}>{p.cliente?.nombreCompleto || 'N/D'}</Typography>
                                  <Typography variant="body2" color="text.secondary">Asiento: {p.asiento?.numero || p.asientoId || '-'}</Typography>
                                </Box>
                                <Box sx={{flex: '0 0 33.333%', minWidth: 0, textAlign: { xs: 'left', sm: 'right' }}}>
                                  <Typography variant="subtitle1" sx={{fontWeight:700}}>Bs. {Number(p.monto||0).toFixed(2)}</Typography>
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{mt:1, flexWrap:'wrap'}}>
                                {p.reserva && <Chip label="Reserva" size="small" sx={{bgcolor:'#f59e0b', color:'#fff', fontWeight:600}} />}
                                {p.estado === false && <Chip label="ANULADO" size="small" color="default" sx={{bgcolor:'grey.600', color:'#fff', fontWeight:700}} />}
                                {p.cliente?.telefono && <Chip label={`Tel: ${p.cliente.telefono}`} size="small" />}
                                {p.cliente?.ci && <Chip label={`CI: ${p.cliente.ci}`} size="small" />}
                              </Stack>
                            </Box>

                            <Box sx={{ml:2, display:'flex', gap:1}}>
                              <Button variant="outlined" size="small" onClick={() => alert('Reimprimir no implementado')} sx={{textTransform:'none'}}>Reimprimir</Button>
                              <Button variant="contained" color="error" size="small" onClick={() => handleAnular(p.id)} disabled={p.estado===false} sx={{textTransform:'none'}}>Anular</Button>
                            </Box>
                        </ListItem>
                        <Divider component="li" />
                    </Fragment>
                  ))}
                    </List>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={closePasajes}>Cerrar</Button>
                  </DialogActions>
                </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
