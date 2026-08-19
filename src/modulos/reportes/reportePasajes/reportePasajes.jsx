import { useCallback, useEffect, useState } from 'react'
import {
  Box, Button, CircularProgress, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Close, Download, PictureAsPdf, Refresh, Search } from '@mui/icons-material'
import { getPasajes, getReportePasajesPdf, getReportePasajesXlsx } from '../../pasajes/pasajesService'
import './reportePasajes.css'

const EMPTY_FILTERS = { cliente: '', destino: 'todos', movil: 'todos', usuario: 'todos' }

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
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [pasajes, setPasajes] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState({ pdf: false, xlsx: false })
  const [error, setError] = useState('')

  const apiFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== 'todos'))
  const destinos = [...new Set(pasajes.map((pasaje) => pasaje.destino).filter(Boolean))]
  const moviles = [...new Set(pasajes.map((pasaje) => pasaje.movil).filter(Boolean))]
  const usuarios = [...new Set(pasajes.map((pasaje) => pasaje.usuario?.usuario || pasaje.usuario?.usuario1 || pasaje.usuario).filter(Boolean))]

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

  useEffect(() => {
    const timer = setTimeout(() => loadPasajes(), 0)
    return () => clearTimeout(timer)
  }, [loadPasajes])

  const handleExport = async (type) => {
    setExporting(current => ({ ...current, [type]: true }))
    setError('')
    try {
      const blob = type === 'pdf'
        ? await getReportePasajesPdf(apiFilters)
        : await getReportePasajesXlsx(apiFilters)

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
        <TextField size="small" placeholder="Buscar cliente..." value={filters.cliente} onChange={(event) => setFilter('cliente', event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') loadPasajes(apiFilters) }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>, endAdornment: filters.cliente ? <InputAdornment position="end"><IconButton size="small" aria-label="Limpiar cliente" onClick={() => setFilter('cliente', '')}><Close fontSize="small" /></IconButton></InputAdornment> : null }} />
        <FormControl size="small"><InputLabel>Destino</InputLabel><Select value={filters.destino} label="Destino" onChange={(event) => setFilter('destino', event.target.value)}><MenuItem value="todos">Todos los destinos</MenuItem>{destinos.map((destino) => <MenuItem key={destino} value={destino}>{destino}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Vehículo</InputLabel><Select value={filters.movil} label="Vehículo" onChange={(event) => setFilter('movil', event.target.value)}><MenuItem value="todos">Todos</MenuItem>{moviles.map((movil) => <MenuItem key={movil} value={movil}>{movil}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Usuario</InputLabel><Select value={filters.usuario} label="Usuario" onChange={(event) => setFilter('usuario', event.target.value)}><MenuItem value="todos">Todos</MenuItem>{usuarios.map((usuario) => <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>)}</Select></FormControl>
        <Stack direction="row" spacing={1}><Button variant="contained" startIcon={<Search />} onClick={() => loadPasajes(apiFilters)} disabled={loading}>Buscar</Button><Tooltip title="Recargar"><span><IconButton onClick={() => loadPasajes(apiFilters)} disabled={loading} className="reporte-refresh-button"><Refresh fontSize="small" /></IconButton></span></Tooltip></Stack>
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
