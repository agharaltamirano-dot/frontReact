import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, CircularProgress, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography
} from '@mui/material'
import { Download, PictureAsPdf, Refresh } from '@mui/icons-material'
import FiltroFechas from '../components/FiltroFechas'
import './reporteHorario.css'

const BASE_URL_HORARIOS = 'http://localhost:5093/api/horarios'
const BASE_URL_RUTAS = 'http://localhost:5093/api/rutas'
const BASE_URL_PUNTOS = 'http://localhost:5093/api/puntos-venta'
const BASE_URL_VEHICULOS = 'http://localhost:5093/api/vehiculos'
const BASE_URL_REPORTE = 'http://localhost:5093/api/reporteHorario/reporte-horarios'

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

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ReporteHorarios() {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState({ pdf: false, xlsx: false })
  const [error, setError] = useState('')

  const [rutas, setRutas] = useState([])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [vehiculos, setVehiculos] = useState([])

  const [rutaFilter, setRutaFilter] = useState('todos')
  const [origenFilter, setOrigenFilter] = useState('todos')
  const [destinoFilter, setDestinoFilter] = useState('todos')
  const [fechaParams, setFechaParams] = useState({})

  const loadHorarios = useCallback(async (filters = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      if (rutaFilter !== 'todos') params.append('rutaId', rutaFilter)
      if (origenFilter !== 'todos') params.append('origenId', origenFilter)
      if (destinoFilter !== 'todos') params.append('destinoId', destinoFilter)

      const res = await fetch(`${BASE_URL_HORARIOS}?${params.toString()}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setHorarios(Array.isArray(data) ? data : [])
      } else {
        setHorarios([])
      }
    } catch (err) {
      setHorarios([])
      setError(`Error al cargar horarios: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [rutaFilter, origenFilter, destinoFilter])

  const fetchAuxiliaryData = async () => {
    try {
      const resPuntos = await fetch(BASE_URL_PUNTOS, { headers: authHeaders() })
      if (resPuntos.ok) {
        const dataP = await resPuntos.json()
        if (Array.isArray(dataP)) setPuntosVenta(dataP)
      }

      const resRutas = await fetch(BASE_URL_RUTAS, { headers: authHeaders() })
      if (resRutas.ok) {
        const dataR = await resRutas.json()
        if (Array.isArray(dataR)) setRutas(dataR)
      }

      const resVeh = await fetch(BASE_URL_VEHICULOS, { headers: authHeaders() })
      if (resVeh.ok) {
        const dataV = await resVeh.json()
        if (Array.isArray(dataV)) setVehiculos(dataV)
      }
    } catch (err) {
      console.log('Error cargando datos auxiliares:', err.message)
    }
  }

  useEffect(() => {
    fetchAuxiliaryData()
  }, [])

  useEffect(() => {
    loadHorarios(fechaParams)
  }, [loadHorarios, fechaParams])

  const handleExport = async (type) => {
    setExporting(current => ({ ...current, [type]: true }))
    setError('')
    try {
      const params = new URLSearchParams()
      if (fechaParams.fechaInicio) params.append('fechaInicio', fechaParams.fechaInicio)
      if (fechaParams.fechaFin) params.append('fechaFin', fechaParams.fechaFin)
      if (rutaFilter !== 'todos') params.append('rutaId', rutaFilter)
      if (origenFilter !== 'todos') params.append('origenId', origenFilter)
      if (destinoFilter !== 'todos') params.append('destinoId', destinoFilter)

      const url = type === 'pdf' ? `${BASE_URL_REPORTE}/pdf?${params.toString()}` : `${BASE_URL_REPORTE}/xlsx?${params.toString()}`
      const res = await fetch(url, { headers: authHeaders() })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const blob = await res.blob()
      if (type === 'pdf') {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        downloadBlob(blob, 'reporte_horarios.xlsx')
      }
    } catch (err) {
      setError(`Error al exportar el reporte: ${err.message}`)
    } finally {
      setExporting(current => ({ ...current, [type]: false }))
    }
  }

  const getPunto = (id) => puntosVenta.find(p => Number(p.id) === Number(id)) || { nombre: `Punto #${id}` }

  const getRutaObj = (id) => {
    const r = rutas.find(item => Number(item.id) === Number(id))
    if (!r) return { origenNombre: 'Origen N/A', destinoNombre: 'Destino N/A', tarifa: 0 }

    if (Array.isArray(r.destinos) && r.destinos.length) {
      const sorted = [...r.destinos].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]

      const origenIdOrObj = first?.puntoVenta || first?.puntoVenta?.id || first?.puntoVenta
      const destinoIdOrObj = last?.puntoVenta || last?.puntoVenta?.id || last?.puntoVenta

      const origenObj = typeof origenIdOrObj === 'object' ? origenIdOrObj : getPunto(origenIdOrObj)
      const destinoObj = typeof destinoIdOrObj === 'object' ? destinoIdOrObj : getPunto(destinoIdOrObj)

      return {
        ...r,
        origenNombre: origenObj?.nombre || 'Origen N/A',
        destinoNombre: destinoObj?.nombre || 'Destino N/A',
        tarifa: r.tarifa ?? 0
      }
    }

    const origenObj = getPunto(r.origenId || r.origen?.id)
    const destinoObj = getPunto(r.destinoId || r.destino?.id)

    return {
      ...r,
      origenNombre: origenObj.nombre,
      destinoNombre: destinoObj.nombre,
      tarifa: r.tarifa ?? 0
    }
  }

  const getVehiculoObj = (id) => {
    const v = vehiculos.find(item => Number(item.id) === Number(id))
    if (!v) return { movil: `${id}`, placa: 'N/A', marca: '', modelo: '' }
    return v
  }

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return ''
      const s = String(dateStr)
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
      let d
      if (m) {
        const y = Number(m[1])
        const mo = Number(m[2]) - 1
        const da = Number(m[3])
        d = new Date(y, mo, da)
      } else {
        d = new Date(s)
      }
      if (isNaN(d)) return dateStr
      return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(d)
    } catch {
      return dateStr
    }
  }

  const origenesList = Array.from(new Set(puntosVenta.map(p => p.id)))
  const destinosList = Array.from(new Set(puntosVenta.map(p => p.id)))

  return (
    <Box className="reporte-horarios-screen">
      <Box className="reporte-horarios-header">
        <Box>
          {/* <Typography variant="h5" className="reporte-horarios-title">Reporte de Horarios</Typography> */}
          <Typography variant="body2" className="reporte-horarios-subtitle">{horarios.length} horario{horarios.length !== 1 ? 's' : ''} encontrado{horarios.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" color="error" startIcon={exporting.pdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
            onClick={() => handleExport('pdf')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">Exportar PDF</Button>
          <Button variant="contained" color="success" startIcon={exporting.xlsx ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={() => handleExport('xlsx')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">Exportar Excel</Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={0} className="reporte-horarios-filter-paper">
        <FiltroFechas onDateChange={setFechaParams} />
        <FormControl size="small"><InputLabel>Ruta</InputLabel><Select value={rutaFilter} label="Ruta" onChange={(e) => setRutaFilter(e.target.value)}><MenuItem value="todos">Todas las rutas</MenuItem>{rutas.map((r) => <MenuItem key={r.id} value={r.id}>{getRutaObj(r.id).origenNombre} - {getRutaObj(r.id).destinoNombre}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Origen</InputLabel><Select value={origenFilter} label="Origen" onChange={(e) => setOrigenFilter(e.target.value)}><MenuItem value="todos">Todos</MenuItem>{origenesList.map((id) => <MenuItem key={id} value={id}>{getPunto(id).nombre}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Destino</InputLabel><Select value={destinoFilter} label="Destino" onChange={(e) => setDestinoFilter(e.target.value)}><MenuItem value="todos">Todos</MenuItem>{destinosList.map((id) => <MenuItem key={id} value={id}>{getPunto(id).nombre}</MenuItem>)}</Select></FormControl>
        <Tooltip title="Recargar"><span><IconButton onClick={() => loadHorarios(fechaParams)} disabled={loading} className="reporte-refresh-button"><Refresh fontSize="small" /></IconButton></span></Tooltip>
      </Paper>

      {error && <Typography className="reporte-error" role="alert">{error}</Typography>}

      <Paper elevation={0} className="reporte-horarios-table-paper">
        {loading ? <Box className="reporte-loading"><CircularProgress size={40} /></Box> : <TableContainer><Table className="reporte-horarios-table"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Hora</TableCell><TableCell>Ruta</TableCell><TableCell>Origen</TableCell><TableCell>Destino</TableCell><TableCell>Vehículo</TableCell><TableCell>Placa</TableCell><TableCell align="center">Estado</TableCell></TableRow></TableHead><TableBody>
          {horarios.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>No se encontraron horarios</TableCell></TableRow> : horarios.map((horario) => {
            const rutaObj = getRutaObj(horario.rutaId || horario.ruta?.id)
            const vehObj = getVehiculoObj(horario.vehiculoId || horario.vehiculo?.id)
            return (
              <TableRow key={horario.id} hover className={horario.estado === false ? 'reporte-row-inactive' : ''}>
                <TableCell>{formatDate(horario.fecha)}</TableCell>
                <TableCell>{horario.hora || '-'}</TableCell>
                <TableCell>{rutaObj.origenNombre} → {rutaObj.destinoNombre}</TableCell>
                <TableCell>{rutaObj.origenNombre}</TableCell>
                <TableCell>{rutaObj.destinoNombre}</TableCell>
                <TableCell>{vehObj.movil || '-'}</TableCell>
                <TableCell>{vehObj.placa || '-'}</TableCell>
                <TableCell align="center"><span className={horario.estado === false ? 'reporte-status reporte-status--inactive' : 'reporte-status'}>{horario.estado === false ? 'Inactivo' : 'Activo'}</span></TableCell>
              </TableRow>
            )
          })}
        </TableBody></Table></TableContainer>}
      </Paper>
    </Box>
  )
}
