import  { useEffect, useState, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemAvatar, Avatar, Chip, Divider, Typography, Snackbar, Alert, TextField, Select, MenuItem, FormControl, InputLabel, Autocomplete } from '@mui/material'
import { getHorarioById, postPasajesBatch, deletePasaje, getHojaRuta, putPasaje } from './ventaPasajesSevice'
import { getClientes } from '../../encomiendas/registrarEncomienda/registrarEncomiendaService'
import './ventaPasajes.css'

export default function VentaPasajes() {
  const { id } = useParams()
  const [horario, setHorario] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [clientesList, setClientesList] = useState([])
  const [pasajesOpen, setPasajesOpen] = useState(false)

  const openPasajes = () => setPasajesOpen(true)
  const closePasajes = () => setPasajesOpen(false)

  // Snackbar / Alert state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message: message || '', severity })
  }
  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }))

  // Confirmación para anular pasaje
  const [confirmAnular, setConfirmAnular] = useState({ open: false, pasajeId: null })
  const requestAnular = (pasajeId) => setConfirmAnular({ open: true, pasajeId })
  const cancelAnular = () => setConfirmAnular({ open: false, pasajeId: null })

  // Modal editar pasaje
  const [editPasaje, setEditPasaje] = useState({ open: false, pasaje: null })
  const [editForm, setEditForm] = useState({
    pasajero: '', ci: '', telefono: '', monto: '', destinoId: '', asientoId: '', asientoNumero: ''
  })
  const [editClienteObj, setEditClienteObj] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const openEditPasaje = (p) => {
    const asientoNum = p.asiento?.numero || p.asientoId || ''
    setEditForm({
      pasajero: p.cliente?.nombreCompleto || '',
      ci: p.cliente?.ci || '',
      telefono: p.cliente?.telefono || '',
      monto: String(p.monto || ''),
      destinoId: p.destino ? (() => {
        const found = (horario?.ruta?.destinos || []).find(d => d.puntoVenta?.nombre === p.destino)
        return found ? String(found.puntoVenta?.id || '') : ''
      })() : '',
      asientoId: String(p.asiento?.id || p.asientoId || ''),
      asientoNumero: String(asientoNum)
    })
    setEditClienteObj(null)
    setEditPasaje({ open: true, pasaje: p })
  }

  const closeEditPasaje = () => {
    setEditPasaje({ open: false, pasaje: null })
    setEditClienteObj(null)
    setSavingEdit(false)
  }

  const handleEditSelectCliente = (event, newValue) => {
    if (typeof newValue === 'string') {
      setEditClienteObj(null)
      setEditForm(prev => ({ ...prev, pasajero: newValue }))
    } else if (newValue && newValue.id) {
      setEditClienteObj(newValue)
      setEditForm(prev => ({
        ...prev,
        pasajero: newValue.nombreCompleto || '',
        ci: newValue.ci || '',
        telefono: newValue.telefono || ''
      }))
    } else {
      setEditClienteObj(null)
      setEditForm(prev => ({ ...prev, pasajero: '' }))
    }
  }

  // Asientos disponibles para editar (libres + el actual del pasaje)
  const getAsientosDisponibles = (pasaje) => {
    const asientos = horario?.vehiculo?.distribucion?.asientos || []
    const pasajes = horario?.pasajes || []
    return asientos.filter(a => {
      if (Number(a.id) === Number(pasaje?.asiento?.id || pasaje?.asientoId)) return true // el asiento actual siempre disponible
      const ocupado = pasajes.find(p => Number(p.asiento?.id) === Number(a.id) && p.estado === true)
      return !ocupado && a.estado !== false
    })
  }

  const handleSaveEditPasaje = async () => {
    const pasaje = editPasaje.pasaje
    if (!pasaje) return
    if (!editForm.pasajero.trim()) {
      showSnackbar('Ingrese el nombre del pasajero', 'warning')
      return
    }
    if (!editForm.destinoId) {
      showSnackbar('Seleccione el destino', 'warning')
      return
    }
    const montoNum = parseFloat(String(editForm.monto).replace(',', '.'))
    if (isNaN(montoNum) || montoNum <= 0) {
      showSnackbar('Ingrese un monto válido mayor a 0', 'warning')
      return
    }
    if (!editForm.asientoId) {
      showSnackbar('Seleccione un asiento', 'warning')
      return
    }
    setSavingEdit(true)
    try {
      const destinoName = getDestinoName(editForm.destinoId)
      const usuarioId = getAuthUsuarioId()
      const payload = {
        fechaHora: pasaje.fechaHora || formatFechaHoraNow(),
        monto: montoNum,
        movil: pasaje.movil || horario?.vehiculo?.movil || '',
        estado: pasaje.estado !== false,
        destino: destinoName,
        asientoId: Number(editForm.asientoId),
        reserva: pasaje.reserva || false,
        horarioId: pasaje.horarioId || horario?.id,
        usuarioId: usuarioId,
        cliente: editClienteObj && editClienteObj.id
          ? undefined
          : {
              nombreCompleto: editForm.pasajero.trim(),
              ci: editForm.ci.trim() || null,
              telefono: editForm.telefono.trim() || null,
              estado: true
            },
        clienteId: editClienteObj && editClienteObj.id ? editClienteObj.id : undefined
      }
      // Limpiar claves undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
      await putPasaje(pasaje.id, payload)
      showSnackbar('Pasaje editado con éxito', 'success')
      closeEditPasaje()
      setTimeout(async () => {
        try {
          const fresh = await getHorarioById(horario?.id ?? id)
          setHorario(fresh)
        } catch (err) {
          console.warn('No se pudo refrescar horario tras editar pasaje:', err)
        }
      }, 100)
    } catch (err) {
      console.error('Error editando pasaje', err)
      showSnackbar('Error al editar: ' + (err.message || ''), 'error')
    } finally {
      setSavingEdit(false)
    }
  }


  const destinosOptions = (horario?.ruta?.destinos || []).map(d => {
    const pv = d.puntoVenta || {}
    return {
      id: pv.id || d.id || '',
      nombre: pv.nombre || pv || '',
      tarifa: d.tarifa ?? horario?.ruta?.tarifa ?? 0,
      visiblePasajes: !!pv.visiblePasajes
    }
  })
  const selectDestinos = destinosOptions.filter(d => !d.visiblePasajes)
  const quickDestinos = destinosOptions.filter(d => d.visiblePasajes )

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
      // default monto to tarifa for this horario's route
      const tarifaDefault = horario?.ruta?.tarifa ?? ''
      setSelectedSeats(prev => [...prev, { id: seat.id, numero: seat.numero, fila: seat.fila, columna: seat.columna, pasajero: '', monto: tarifaDefault, ci: '', telefono: '', destinoId: '' }])
    }
  }

  const removeSelected = (id) => setSelectedSeats(prev => prev.filter(s => Number(s.id) !== Number(id)))

  const updateSelectedField = (id, field, value) => {
    setSelectedSeats(prev => prev.map(s => Number(s.id) === Number(id) ? { ...s, [field]: value } : s))
  }

  const selectDestino = (id, destino) => {
    if (!destino) return
    setSelectedSeats(prev => prev.map(s => Number(s.id) === Number(id) ? { ...s, destinoId: destino.id, monto: destino.tarifa } : s))
  }

  const confirmSale = (id) => {
    const sel = selectedSeats.find(s => Number(s.id) === Number(id))
    if (!sel) return
    if (!sel.pasajero) {
      showSnackbar('Ingrese nombre del pasajero', 'warning')
      return
    }
    if (!sel.destinoId) {
      showSnackbar('Seleccione el destino para el pasajero', 'warning')
      return
    }
    const montoNum = parseFloat(String(sel.monto).replace(',', '.'))
    if (isNaN(montoNum) || montoNum <= 0) {
      showSnackbar('Ingrese un monto válido mayor a 0', 'warning')
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

  const getAuthToken = () => {
    try {
      const raw = sessionStorage.getItem('authData')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.token || parsed?.accessToken || parsed?.authToken || null
    } catch {
      return null
    }
  }

  const reimprimirPasaje = async (pasajeId) => {
    if (!pasajeId) return showSnackbar('ID de pasaje inválido', 'warning')
    showSnackbar('Generando ticket...', 'info')
    try {
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer <${token}>` } : {}
      const resp = await fetch(`http://localhost:5093/api/ticket/${pasajeId}`, { method: 'GET', headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Cargar el PDF en un iframe oculto y abrir SOLO el diálogo de impresión
      showSnackbar('Preparando ticket para imprimir...', 'info')
      try {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.style.opacity = '0'
        iframe.src = blobUrl
        iframe.onload = () => {
          try {
            // Algunos navegadores requieren foco y un pequeño retraso
            iframe.contentWindow.focus()
            setTimeout(() => {
              try { iframe.contentWindow.print() } catch (e) { console.warn('print() en iframe falló:', e) }
              // limpiar
              setTimeout(() => {
                try { document.body.removeChild(iframe) } catch (_) {}
                try { URL.revokeObjectURL(blobUrl) } catch (_) {}
              }, 900)
            }, 500)
          } catch (e) {
            console.warn('Error al invocar print en iframe:', e)
            // fallback: abrir en nueva pestaña para que el usuario imprima manualmente
            const a = document.createElement('a')
            a.href = blobUrl
            a.target = '_blank'
            a.rel = 'noopener'
            a.click()
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
          }
        }
        document.body.appendChild(iframe)
      } catch (e) {
        console.error('No se pudo crear iframe para imprimir:', e)
        // fallback: navegar a la URL del blob en la misma pestaña
        window.location.href = blobUrl
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      }
    } catch (err) {
      console.error('Error reimprimiendo pasaje', err)
      showSnackbar('Error al generar ticket: ' + (err.message || ''), 'error')
    }
  }

  const openHojaRuta = async () => {
    if (!horario?.id) return showSnackbar('Horario inválido', 'warning')
    showSnackbar('Generando hoja de ruta...', 'info')
    try {
      const blob = await getHojaRuta(horario.id)
      const blobUrl = URL.createObjectURL(blob)
      showSnackbar('Preparando hoja para imprimir...', 'info')
      try {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.style.opacity = '0'
        iframe.src = blobUrl
        iframe.onload = () => {
          try {
            iframe.contentWindow.focus()
            setTimeout(() => {
              try { iframe.contentWindow.print() } catch (e) { console.warn('print() en iframe falló:', e) }
              setTimeout(() => {
                try { document.body.removeChild(iframe) } catch (_) {}
                try { URL.revokeObjectURL(blobUrl) } catch (_) {}
              }, 900)
            }, 500)
          } catch (e) {
            console.warn('Error al invocar print en iframe:', e)
            const a = document.createElement('a')
            a.href = blobUrl
            a.target = '_blank'
            a.rel = 'noopener'
            a.click()
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
          }
        }
        document.body.appendChild(iframe)
      } catch (e) {
        console.error('No se pudo crear iframe para imprimir hoja:', e)
        window.location.href = blobUrl
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      }
    } catch (err) {
      console.error('Error generando hoja de ruta', err)
      showSnackbar('Error al generar hoja: ' + (err.message || ''), 'error')
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
      showSnackbar('No hay asientos seleccionados', 'warning')
      return
    }

    // Validate and build items
    const items = []
    for (const s of selectedSeats) {
      if (!s.pasajero) {
        showSnackbar(`Ingrese nombre para asiento ${s.numero}`, 'warning')
        return
      }
      if (!s.destinoId) {
        showSnackbar(`Seleccione destino para asiento ${s.numero}`, 'warning')
        return
      }
      const montoNum = parseFloat(String(s.monto).replace(',', '.'))
      if (isNaN(montoNum) || montoNum <= 0) {
        showSnackbar(`Monto inválido en asiento ${s.numero}`, 'warning')
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
      showSnackbar('Operación realizada con éxito', 'success')
      // small delay to allow snackbar to be visible, then refresh horario from API
      setTimeout(async () => {
        try {
          const fresh = await getHorarioById(horario?.id ?? id)
          setHorario(fresh)
        } catch (err) {
          console.warn('No se pudo refrescar horario tras crear pasajes:', err)
        }
      }, 100)
    } catch (err) {
      console.error('Error enviando pasajes:', err)
      showSnackbar('Error al enviar los pasajes: ' + (err.message || ''), 'error')
    }
  }

  const performAnular = async () => {
    const pasajeId = confirmAnular.pasajeId
    if (!pasajeId) return cancelAnular()
    try {
      await deletePasaje(pasajeId)
      setHorario(prev => {
        if (!prev) return prev
        const nuevos = (prev.pasajes || []).map(p => p.id === pasajeId ? { ...p, estado: false } : p)
        return { ...prev, pasajes: nuevos }
      })
      try {
        const fresh = await getHorarioById(horario?.id ?? id)
        setHorario(fresh)
      } catch (fetchErr) {
        console.warn('No se pudo refrescar horario tras anular:', fetchErr)
      }
      showSnackbar('Pasaje anulado', 'success')
    } catch (err) {
      console.error('Error anulando pasaje', err)
      showSnackbar('Error al anular: ' + (err.message || ''), 'error')
    } finally {
      cancelAnular()
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
                  <div className="seat-info" style={{display:'flex', flexDirection:'column', gap:1}}>
                    <div className="seat-name">{pasaje.cliente?.nombreCompleto || 'N/A'}</div>
                    <div className="seat-phone">{pasaje.cliente?.telefono || ''}</div>
                    <div className="seat-monto">Bs. {Number(pasaje.monto || 0).toFixed(2)}</div>
                    <div className="seat-destino" style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" stroke="#0f172a" strokeWidth="1.2" fill="none"/>
                        <circle cx="12" cy="9" r="2" fill="#0f172a"/>
                      </svg>
                      <span className="destino-name" style={{fontSize:'0.85rem', color:'#374151'}}>{pasaje.destino || (seat.pasajes?.destinoId ? getDestinoName(seat.pasajes.destinoId) : '')}</span>
                    </div>
                  </div>
                  <button
                    className="seat-print-btn"
                    title="Reimprimir recibo"
                    aria-label="Reimprimir recibo"
                    onClick={(e) => { e.stopPropagation(); reimprimirPasaje(pasaje.id) }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="4" y="9" width="16" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M6 14h12v7H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
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
        const [horarioData, clientesData] = await Promise.all([
          getHorarioById(id),
          getClientes()
        ])
        console.log('Horario recibido:', horarioData)
        setHorario(horarioData)
        setClientesList(clientesData)
      } catch (err) {
        console.error('Error al obtener datos iniciales:', err)
      }
    }
    fetchData()
  }, [id])

  const handleSelectCliente = (id, newValue) => {
    if (typeof newValue === 'string') {
      updateSelectedField(id, 'pasajero', newValue)
    } else if (newValue && typeof newValue === 'object') {
      setSelectedSeats(prev => prev.map(s => 
        Number(s.id) === Number(id) 
          ? { 
              ...s, 
              pasajero: newValue.nombreCompleto || '', 
              ci: newValue.ci || '', 
              telefono: newValue.telefono || '' 
            } 
          : s
      ))
    } else {
      updateSelectedField(id, 'pasajero', '')
    }
  }

  const totalMonto = selectedSeats.reduce((sum, s) => {
    const v = parseFloat(String(s.monto || 0).replace(',', '.'))
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  // Suma de montos de todos los pasajes del horario (solo activos)
  const sumaPasajes = (horario?.pasajes || []).reduce((acc, p) => {
    if (!p || p.estado !== true) return acc
    const m = parseFloat(String(p.monto || 0).replace(',', '.'))
    return acc + (isNaN(m) ? 0 : m)
  }, 0)

  // Encomiendas (valor por defecto 0 si no viene en el horario)
  const encomiendasBs = Number(horario?.encomiendasBs) || 0

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
              <div className="horario-item ruta-cards">{(() => {
                const dests = Array.isArray(horario.ruta?.destinos) ? [...horario.ruta.destinos].sort((a,b)=> (a.orden||0)-(b.orden||0)) : []
                const origen = dests[0]
                const restantes = dests.slice(1)
                return (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip label={origen?.puntoVenta?.nombre || 'Origen'} className="chip-origen" />
                    {restantes.map((d, idx) => (
                      <Chip
                        key={d.puntoVenta?.id || d.id || idx}
                        label={`${d.puntoVenta?.nombre || '-'} · Bs. ${Number(d.tarifa || 0).toFixed(2)}`}
                        variant="outlined"
                        className="chip-destino"
                      />
                    ))}
                  </Stack>
                )
              })()}</div>
            </div>
              <div className="venta-columns">
            <div className="card sell-card">
              <h3>Pasajes</h3>
              <div className="selected-list">
                {selectedSeats.length === 0 && <div className="empty">No hay asientos seleccionados</div>}
                {selectedSeats.map(s => (
                  <div className="selected-item" key={s.id}>
                    <div className="seat-summary">
                      <div className="seat-badge">{s.numero}</div>
                      <TextField
                        type="number"
                        size="small"
                        label="Monto"
                        inputProps={{ step: '0.01', min: '0' }}
                        value={s.monto || ''}
                        onChange={(e) => updateSelectedField(s.id, 'monto', e.target.value)}
                        className="monto-input"
                      />
                    </div>
                    <div className="selected-meta">
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={clientesList}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option
                          return `${option.nombreCompleto || ''} ${option.ci ? `- CI: ${option.ci}` : ''}`.trim()
                        }}
                        value={s.pasajero || ''}
                        onChange={(event, newValue) => handleSelectCliente(s.id, newValue)}
                        onInputChange={(event, newInputValue) => updateSelectedField(s.id, 'pasajero', newInputValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Nombre del pasajero (obligatorio)"
                            fullWidth
                          />
                        )}
                      />
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          placeholder="CI (opcional)"
                          value={s.ci || ''}
                          onChange={(e) => updateSelectedField(s.id, 'ci', e.target.value)}
                          fullWidth
                        />
                        <TextField
                          size="small"
                          type="tel"
                          placeholder="Teléfono (opcional)"
                          value={s.telefono || ''}
                          onChange={(e) => updateSelectedField(s.id, 'telefono', e.target.value)}
                          fullWidth
                        />
                      </Stack>
                      <FormControl size="small" fullWidth>
                        <InputLabel id={`destino-label-${s.id}`}>Destino</InputLabel>
                        <Select
                          labelId={`destino-label-${s.id}`}
                          label="Destino"
                          value={s.destinoId || ''}
                          onChange={(e) => selectDestino(s.id, selectDestinos.find(d => String(d.id) === String(e.target.value)))}
                        >
                          <MenuItem value=""><em>Seleccionar destino</em></MenuItem>
                 {selectDestinos.map(d => (
  (d.id!=horario.ruta?.destinos[0].puntoVenta?.id) ? (
    <MenuItem key={d.id} value={d.id}>
      {d.nombre} · Bs. {Number(d.tarifa || 0).toFixed(2)}
    </MenuItem>
  ) : null
))}

                        </Select>
                      </FormControl>
                      {quickDestinos.length > 0 && (
                        <Stack direction="row" spacing={1} className="quick-destinos">
                          {quickDestinos.map(d => (
                            <Button
                              key={d.id}
                              size="small"
                              variant={String(s.destinoId) === String(d.id) ? 'contained' : 'outlined'}
                              onClick={() => selectDestino(s.id, d)}
                              className="quick-destino-btn"
                            >
                              {d.nombre} · Bs. {Number(d.tarifa || 0).toFixed(2)}
                            </Button>
                          ))}
                        </Stack>
                      )}
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
                    {' '}
                    <span className="pasajes-sum">Pasajes: Bs. {sumaPasajes.toFixed(2)}</span>
                    <span className="pasajes-sum" style={{ marginLeft: 8 }}>Encomiendas: Bs. {encomiendasBs.toFixed(2)}</span>
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
                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                  <Box sx={{textAlign:'left'}}>
                    <Typography variant="subtitle2" color="text.secondary">Total</Typography>
                    <Typography variant="h6" sx={{fontWeight:700}}>Bs. {totalMonto.toFixed(2)}</Typography>
                  </Box>
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
                </Box>

                <Box>
                  <Button onClick={openHojaRuta} variant="outlined" color="primary" sx={{textTransform:'none', mr:1, background:'#2563eb', color:'#fff', borderColor:'transparent', '&:hover':{background:'#1e40af'}}} startIcon={(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}>
                    HOJA DE RUTA
                  </Button>
                  <Button onClick={openPasajes} variant="outlined" color="primary" sx={{textTransform:'none', background:'#2563eb', color:'#fff', borderColor:'transparent', '&:hover':{background:'#1e40af'}}} startIcon={(
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
                          <ListItem alignItems="center" sx={{py:0.5, px:1}}>
                            <ListItemAvatar>
                              <Avatar sx={{width:36,height:36,fontSize:14,bgcolor: p.estado===false ? 'grey.500' : p.reserva ? '#f59e0b' : 'primary.main'}}>
                                {p.cliente?.nombreCompleto ? (p.cliente.nombreCompleto.split(' ').map(n=>n[0]).slice(0,2).join('')) : 'N/D'}
                              </Avatar>
                            </ListItemAvatar>

                            <Box sx={{flex:1, minWidth:0, ml:1}}>
                              <Box sx={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:1}}>
                                <Box sx={{minWidth:0}}>
                                  <Typography variant="body1" sx={{fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.cliente?.nombreCompleto || 'N/D'}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{display:'block'}}>
                                    Asiento: {p.asiento?.numero || p.asientoId || '-'}{p.destino ? ` • ${p.destino}` : ''}{p.cliente?.telefono ? ` • ${p.cliente.telefono}` : ''}
                                  </Typography>
                                </Box>
                                <Box sx={{textAlign:'right', ml:1}}>
                                  <Typography variant="body2" sx={{fontWeight:700}}>Bs. {Number(p.monto||0).toFixed(2)}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{mt:0.5, display:'flex', gap:0.5, flexWrap:'wrap'}}>
                                {p.reserva && <Chip label="Reserva" size="small" sx={{bgcolor:'#f59e0b', color:'#fff', fontWeight:600}} />}
                                {p.estado === false && <Chip label="ANULADO" size="small" sx={{bgcolor:'grey.600', color:'#fff', fontWeight:700}} />}
                                {p.cliente?.telefono && <Chip label={`Tel: ${p.cliente.telefono}`} size="small" />}
                                {p.cliente?.ci && <Chip label={`CI: ${p.cliente.ci}`} size="small" />}
                              </Box>
                            </Box>

                            <Box sx={{ml:1, display:'flex', flexDirection:'column', gap:0.5}}>
                              <Button variant="outlined" size="small" onClick={() => reimprimirPasaje(p.id)} sx={{textTransform:'none', minWidth:80}}>Imprimir</Button>
                              <Button variant="outlined" color="info" size="small" onClick={() => openEditPasaje(p)} disabled={p.estado===false} sx={{textTransform:'none', minWidth:80}}>Editar</Button>
                              <Button variant="contained" color="error" size="small" onClick={() => requestAnular(p.id)} disabled={p.estado===false} sx={{textTransform:'none', minWidth:80}}>Anular</Button>
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
                  {/* Dialog de confirmación para anular */}
                  <Dialog open={confirmAnular.open} onClose={cancelAnular}>
                    <DialogTitle>Confirmar anulación</DialogTitle>
                    <DialogContent>
                      ¿Confirma que desea anular este pasaje?
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={cancelAnular}>Cancelar</Button>
                      <Button onClick={performAnular} color="error" variant="contained">Anular</Button>
                    </DialogActions>
                  </Dialog>

                  {/* Dialog Editar Pasaje */}
                  <Dialog open={editPasaje.open} onClose={closeEditPasaje} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{fontWeight:700}}>Editar Pasaje #{editPasaje.pasaje?.asiento?.numero || editPasaje.pasaje?.asientoId}</DialogTitle>
                    <DialogContent dividers>
                      <Stack spacing={2} sx={{pt:1}}>
                        {/* Cliente */}
                        <Autocomplete
                          freeSolo
                          options={clientesList}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option
                            return `${option.nombreCompleto || ''} ${option.ci ? `- CI: ${option.ci}` : ''}`.trim()
                          }}
                          value={editClienteObj || editForm.pasajero}
                          onChange={handleEditSelectCliente}
                          onInputChange={(event, newInputValue) => {
                            if (!editClienteObj) setEditForm(prev => ({ ...prev, pasajero: newInputValue }))
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Pasajero *" size="small" fullWidth />
                          )}
                        />
                        <Stack direction="row" spacing={1}>
                          <TextField size="small" label="CI" value={editForm.ci} onChange={e => setEditForm(prev => ({ ...prev, ci: e.target.value }))} fullWidth />
                          <TextField size="small" label="Teléfono" value={editForm.telefono} onChange={e => setEditForm(prev => ({ ...prev, telefono: e.target.value }))} fullWidth />
                        </Stack>

                        {/* Asiento disponible */}
                        <Typography variant="caption" color="text.secondary">Asiento (actual: #{editForm.asientoNumero})</Typography>
                        <Box sx={{display:'flex', flexWrap:'wrap', gap:1}}>
                          {getAsientosDisponibles(editPasaje.pasaje).map(a => (
                            <Button
                              key={a.id}
                              size="small"
                              variant={String(editForm.asientoId) === String(a.id) ? 'contained' : 'outlined'}
                              onClick={() => setEditForm(prev => ({ ...prev, asientoId: String(a.id), asientoNumero: String(a.numero) }))}
                              sx={{minWidth:48}}
                            >
                              {a.numero}
                            </Button>
                          ))}
                        </Box>

                        {/* Precio */}
                        <TextField
                          size="small"
                          label="Monto (Bs.) *"
                          type="number"
                          inputProps={{ step:'0.01', min:'0' }}
                          value={editForm.monto}
                          onChange={e => setEditForm(prev => ({ ...prev, monto: e.target.value }))}
                          fullWidth
                        />

                        {/* Destino */}
                        <FormControl size="small" fullWidth>
                          <InputLabel id="edit-destino-label">Destino *</InputLabel>
                          <Select
                            labelId="edit-destino-label"
                            label="Destino *"
                            value={editForm.destinoId}
                            onChange={e => {
                              const d = selectDestinos.find(d => String(d.id) === String(e.target.value))
                              setEditForm(prev => ({ ...prev, destinoId: e.target.value, monto: d ? String(d.tarifa) : prev.monto }))
                            }}
                          >
                            <MenuItem value=""><em>Seleccionar destino</em></MenuItem>
                            {selectDestinos.filter(d => String(d.id) !== String(horario?.ruta?.destinos?.[0]?.puntoVenta?.id)).map(d => (
                              <MenuItem key={d.id} value={String(d.id)}>{d.nombre} · Bs. {Number(d.tarifa||0).toFixed(2)}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* Quick destinos */}
                        {quickDestinos.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {quickDestinos.map(d => (
                              <Button
                                key={d.id}
                                size="small"
                                variant={String(editForm.destinoId) === String(d.id) ? 'contained' : 'outlined'}
                                onClick={() => setEditForm(prev => ({ ...prev, destinoId: String(d.id), monto: String(d.tarifa) }))}
                              >
                                {d.nombre} · Bs. {Number(d.tarifa||0).toFixed(2)}
                              </Button>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={closeEditPasaje} disabled={savingEdit}>Cancelar</Button>
                      <Button onClick={handleSaveEditPasaje} variant="contained" color="primary" disabled={savingEdit}>
                        {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                    </DialogActions>
                  </Dialog>

                  {/* Snackbar global */}
                  <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                      {snackbar.message}
                    </Alert>
                  </Snackbar>
          </>
        )}
      </div>
    </div>
  )
}
