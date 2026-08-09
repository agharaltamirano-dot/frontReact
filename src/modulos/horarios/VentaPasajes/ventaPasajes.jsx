import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHorarioById } from './ventaPasajesSevice'
import './ventaPasajes.css'

export default function VentaPasajes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [horario, setHorario] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])

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
          colsArr.push(
            <div key={`r${r}c${c}`} className="seat empty-slot" />
          )
        } else {
          const occupied = !!seat.pasajes || seat.estado === false
          const selected = selectedSeats.some(s => Number(s.id) === Number(seat.id))
          colsArr.push(
            <div
              key={seat.id}
              className={`seat ${occupied ? 'occupied' : selected ? 'selected' : 'available'}`}
              onClick={() => { if (!occupied) toggleSelectSeat(seat) }}
            >
              <div className="seat-num">{seat.numero}</div>
              {seat.pasajes && <div className="seat-pass">{seat.pasajes.nombre || 'VEND'}</div>}
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
              <div className="horario-item"><strong>Fecha:</strong> {formatDateLocal(horario.fecha)}</div>
              <div className="horario-item"><strong>Hora:</strong> {horario.hora}</div>
              <div className="horario-item"><strong>Ruta:</strong> {(() => {
                const dests = Array.isArray(horario.ruta?.destinos) ? [...horario.ruta.destinos].sort((a,b)=> (a.orden||0)-(b.orden||0)) : []
                const o = dests[0]?.puntoVenta?.nombre || ''
                const d = dests[dests.length-1]?.puntoVenta?.nombre || ''
                return `${o} → ${d}`
              })()}</div>
              <div className="horario-item"><strong>Tarifa:</strong> Bs. {Number(horario.ruta?.tarifa || 0).toFixed(2)}</div>
            </div>
            <div className="venta-columns">
            <div className="card sell-card">
              <h3>Vender</h3>
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
              <h3 className="asientos-title">Asientos <span className="asientos-meta">{(() => {
                const movil = horario?.vehiculo?.movil || horario?.vehiculo?.movil
                const conductor = horario?.vehiculo?.conductor ? `${horario.vehiculo.conductor.nombres || ''} ${horario.vehiculo.conductor.apellidos || ''}`.trim() : ''
                return `Móvil ${movil || '-'} — ${conductor || '-'}`
              })()}</span></h3>
              <div className="seat-grid">
                {renderSeatGrid(horario)}
              </div>
              <div className="legend">
                <span className="legend-item"><span className="dot available"/> Disponible</span>
                <span className="legend-item"><span className="dot occupied"/> Vendido</span>
                <span className="legend-item"><span className="dot empty"/> Vacío</span>
                <span className="legend-item"><span className="dot selected"/> Seleccionado</span>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
