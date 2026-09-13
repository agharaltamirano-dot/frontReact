import { useCallback, useEffect, useState } from 'react'
import {
  Box, Button, CircularProgress, Divider, FormControl, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography
} from '@mui/material'
import { Download, PictureAsPdf, Refresh, Search } from '@mui/icons-material'
import { getPasajes, getReportePasajes, getReportePasajesPdf, getReportePasajesXlsx } from '../../pasajes/pasajesService'
import { getClientes } from '../../clientes/clientesService'
import './reportePasajes.css'
import { es } from "date-fns/locale";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";

const EMPTY_FILTERS = { clienteId: '', destino: 'todos', movil: 'todos', usuarioId: 'todos', fechaDesde: null, fechaHasta: null, reserva: null }

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

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-BO')
}

export default function ReportePasajes() {
  const getUserName = () => {
    const authData = JSON.parse(sessionStorage.getItem("authData") || '{}')
    console.log('usuario generando', authData);
    return authData?.usuario?.usuario1 || ''
  }
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [clientes, setClientes] = useState([])
  const [pasajes, setPasajes] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState({ pdf: false, xlsx: false })
  const [error, setError] = useState('')

  const apiFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined && value !== 'todos'))
  const destinos = [...new Set(pasajes.map((pasaje) => pasaje.destino).filter(Boolean))]
  const moviles = [...new Set(pasajes.map((pasaje) => pasaje.movil).filter(Boolean))]
  const usuariosMap = new Map()
  pasajes.forEach((pasaje) => {
    const u = pasaje.usuario
    if (!u) return
    if (typeof u === 'object') {
      const id = u.id ?? u.usuario ?? u.usuario1 ?? JSON.stringify(u)
      const label = u.usuario ?? u.usuario1 ?? u.nombre ?? id
      usuariosMap.set(String(id), String(label))
    } else {
      usuariosMap.set(String(u), String(u))
    }
  })
  const usuarios = Array.from(usuariosMap.entries()).map(([id, label]) => ({ id, label }))

  const loadPasajes = useCallback(async (appliedFilters = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await getPasajes(appliedFilters)
      setPasajes(Array.isArray(data) ? data : [])
    } catch (err) {
      setPasajes([])
      setError(`Error al cargar pasajes: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar clientes para el filtro
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getClientes()
        if (!mounted) return
        setClientes(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Error cargando clientes', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Construye filtros a enviar al API (convierte fechas y maneja reserva)
  const buildApiFilters = (f) => {
    const out = { ...f }
    if (out.fechaDesde instanceof Date) out.fechaDesde = out.fechaDesde.toISOString().slice(0, 10)
    if (out.fechaHasta instanceof Date) out.fechaHasta = out.fechaHasta.toISOString().slice(0, 10)
    // si clienteId está vacío o es 'todos' lo removemos
    if (!out.clienteId) delete out.clienteId
    if (out.destino === 'todos') delete out.destino
    if (out.movil === 'todos') delete out.movil
    if (out.usuarioId === 'todos') delete out.usuarioId
    if (out.reserva === null || out.reserva === undefined) delete out.reserva
    return out
  }

  // Cada vez que cambien los filtros, llamar a getReportePasajes
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const apiF = buildApiFilters(filters)
        const data = await getReportePasajes(apiF)
        setPasajes(Array.isArray(data) ? data : (data || []))
      } catch (err) {
        setPasajes([])
        setError(`Error al generar reporte: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => loadPasajes(), 0)
    return () => clearTimeout(timer)
  }, [loadPasajes])

  const handleExport = async (type) => {
    setExporting(current => ({ ...current, [type]: true }))
    setError('')
    try {
      const filters = {...apiFilters, nombreUsuario: getUserName()}
      const blob = type === 'pdf'
        ? await getReportePasajesPdf(filters)
        : await getReportePasajesXlsx(filters)

      if (type === 'pdf') {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        downloadBlob(blob, 'reporte_pasajes.xlsx')
      }
    } catch (err) {
      setError(`Error al exportar el reporte: ${err.message}`)
    } finally {
      setExporting(current => ({ ...current, [type]: false }))
    }
  }

  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }))

  return (
    <Box className="reporte-pasajes-screen">
      <Box className="reporte-pasajes-header">
        <Box>
          {/* <Typography variant="h5" className="reporte-pasajes-title">Reporte de Pasajes</Typography> */}
          <Typography variant="body2" className="reporte-pasajes-subtitle">{pasajes.length} pasaje{pasajes.length !== 1 ? 's' : ''} encontrado{pasajes.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" color="error" startIcon={exporting.pdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
            onClick={() => handleExport('pdf')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">Exportar PDF</Button>
          <Button variant="contained" color="success" startIcon={exporting.xlsx ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={() => handleExport('xlsx')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">Exportar Excel</Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={0} className="reporte-pasajes-filter-paper">
        <FormControl size="small">
          <InputLabel>Cliente</InputLabel>
          <Select value={filters.clienteId} label="Cliente" onChange={(event) => setFilter('clienteId', event.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">Todos</MenuItem>
            {clientes.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombreCompleto || c.nombre || c.razonSocial || c.usuario || c.id}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small"><InputLabel>Destino</InputLabel><Select value={filters.destino} label="Destino" onChange={(event) => setFilter('destino', event.target.value)}><MenuItem value="todos">Todos los destinos</MenuItem>{destinos.map((destino) => <MenuItem key={destino} value={destino}>{destino}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Vehículo</InputLabel><Select value={filters.movil} label="Vehículo" onChange={(event) => setFilter('movil', event.target.value)}><MenuItem value="todos">Todos</MenuItem>{moviles.map((movil) => <MenuItem key={movil} value={movil}>{movil}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Usuario</InputLabel><Select value={filters.usuarioId} label="Usuario" onChange={(event) => setFilter('usuarioId', event.target.value)}><MenuItem value="todos">Todos</MenuItem>{usuarios.map((usuario) => <MenuItem key={usuario.id} value={usuario.id}>{usuario.label}</MenuItem>)}</Select></FormControl>
        <FormControl size="small">
          <InputLabel>Tipo</InputLabel>
          <Select
            value={filters.reserva === null ? 'todos' : filters.reserva === true ? 'reservas' : 'pagados'}
            label="Tipo"
            onChange={(e) => {
              const v = e.target.value
              setFilter('reserva', v === 'todos' ? null : v === 'reservas' ? true : false)
            }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="reservas">Reservas</MenuItem>
            <MenuItem value="pagados">Pagados</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
  <DatePicker
    label="Fecha Desde"
    value={filters.fechaDesde}
    onChange={(newVal) => setFilter("fechaDesde", newVal)}
    slotProps={{
      field: {
        clearable: true,
        onClear: () => setFilter("fechaDesde", null),
      },
      textField: {
        size: "small",
        InputLabelProps: { shrink: true },
        sx: { minWidth: 160 },
      },
    }}
  />

  <DatePicker
    label="Fecha Hasta"
    value={filters.fechaHasta}
    onChange={(newVal) => setFilter("fechaHasta", newVal)}
    slotProps={{
      field: {
        clearable: true,
        onClear: () => setFilter("fechaHasta", null),
      },
      textField: {
        size: "small",
        InputLabelProps: { shrink: true },
        sx: { minWidth: 160 },
      },
    }}
  />
</LocalizationProvider>
      </Paper>

      {error && <Typography className="reporte-error" role="alert">{error}</Typography>}

      <Paper elevation={0} className="reporte-pasajes-table-paper">
        {loading ? <Box className="reporte-loading"><CircularProgress size={40} /></Box> : <TableContainer><Table className="reporte-pasajes-table"><TableHead><TableRow><TableCell>Asiento</TableCell><TableCell>Cliente</TableCell><TableCell>Destino</TableCell><TableCell>Fecha / Hora</TableCell><TableCell align="right">Monto</TableCell><TableCell>Móvil</TableCell><TableCell>Usuario</TableCell><TableCell align="center">Estado</TableCell></TableRow></TableHead><TableBody>
          {pasajes.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>No se encontraron pasajes</TableCell></TableRow> : pasajes.map((pasaje) => <TableRow key={pasaje.id} hover className={pasaje.estado === false ? 'reporte-row-inactive' : ''}><TableCell>{pasaje.asiento?.numero || '-'}</TableCell><TableCell><Typography fontWeight={700} variant="body2">{pasaje.cliente?.nombreCompleto || '-'}</Typography><Typography variant="caption" color="text.secondary">{pasaje.cliente?.ci ? `CI: ${pasaje.cliente.ci}` : ''}</Typography></TableCell><TableCell>{pasaje.destino || '-'}</TableCell><TableCell>{formatDateTime(pasaje.fechaHora || pasaje.horario?.fecha)}</TableCell><TableCell align="right">Bs. {Number(pasaje.monto || 0).toFixed(2)}</TableCell><TableCell>{pasaje.movil || '-'}</TableCell><TableCell>{pasaje.usuario?.usuario || pasaje.usuario?.usuario1 || pasaje.usuario || '-'}</TableCell><TableCell align="center"><span className={pasaje.estado === false ? 'reporte-status reporte-status--inactive' : 'reporte-status'}>{pasaje.estado === false ? 'Anulado' : 'Activo'}</span></TableCell></TableRow>)}
        </TableBody></Table></TableContainer>}
      </Paper>
    </Box>
  )
}
