import { useState, useEffect, useCallback } from 'react'
import {
  Box, CircularProgress, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Close, Download, PictureAsPdf, Refresh, Search } from '@mui/icons-material'
import FiltroFechas from '../components/FiltroFechas'
import './reporteConductores.css'

const BASE_URL = 'http://localhost:5093/api/conductores'
const BASE_URL_REPORTE = 'http://localhost:5093/api/reporteConductor'

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

export default function ReporteConductores() {
  const [conductores, setConductores] = useState([])
  const [loading, setLoading] = useState(false)
  const [exportingMap, setExportingMap] = useState({}) // { conductorId: { pdf: bool, xlsx: bool } }
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [fechaParams, setFechaParams] = useState({})

  const loadConductores = useCallback(async (filters = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (categoryFilter !== 'todos') params.append('categoria', categoryFilter)
      if (statusFilter !== 'todos') params.append('estado', statusFilter === 'activos' ? 'true' : 'false')

      const res = await fetch(`${BASE_URL}?${params.toString()}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setConductores(Array.isArray(data) ? data : [])
      } else {
        setConductores([])
      }
    } catch (err) {
      setConductores([])
      setError(`Error al cargar conductores: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, statusFilter])

  useEffect(() => {
    loadConductores(fechaParams)
  }, [loadConductores, fechaParams])

  const handleExportConductor = async (conductorId, type) => {
    setExportingMap(current => ({ ...current, [conductorId]: { ...current[conductorId], [type]: true } }))
    setError('')
    try {
      const params = new URLSearchParams()
      if (fechaParams.fechaInicio) params.append('fechaInicio', fechaParams.fechaInicio)
      if (fechaParams.fechaFin) params.append('fechaFin', fechaParams.fechaFin)

      const url = `${BASE_URL_REPORTE}/${conductorId}/${type}?${params.toString()}`
      const res = await fetch(url, { headers: authHeaders() })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const blob = await res.blob()
      if (type === 'pdf') {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        downloadBlob(blob, `reporte_conductor_${conductorId}.xlsx`)
      }
    } catch (err) {
      setError(`Error al exportar el reporte: ${err.message}`)
    } finally {
      setExportingMap(current => ({ ...current, [conductorId]: { ...current[conductorId], [type]: false } }))
    }
  }

  const normalize = (str) => (str || '').toString().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

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

  return (
    <Box className="reporte-conductores-screen">
      <Box className="reporte-conductores-header">
        <Box>
          {/* <Typography variant="h5" className="reporte-conductores-title">Reporte de Conductores</Typography> */}
          <Typography variant="body2" className="reporte-conductores-subtitle">{filteredConductores.length} conductor{filteredConductores.length !== 1 ? 'es' : ''} encontrado{filteredConductores.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={0} className="reporte-conductores-filter-paper">
        <FiltroFechas onDateChange={setFechaParams} />
        <TextField
          size="small"
          placeholder="Buscar conductor..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: searchTerm ? <InputAdornment position="end"><IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => setSearchTerm('')}><Close fontSize="small" /></IconButton></InputAdornment> : null
          }}
        />
        <FormControl size="small"><InputLabel>Categoría</InputLabel><Select value={categoryFilter} label="Categoría" onChange={(e) => setCategoryFilter(e.target.value)}><MenuItem value="todos">Todas</MenuItem>{categoriesList.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Estado</InputLabel><Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="todos">Todos</MenuItem><MenuItem value="activos">Activos</MenuItem><MenuItem value="inactivos">Inactivos</MenuItem></Select></FormControl>
        <Tooltip title="Recargar"><span><IconButton onClick={() => loadConductores(fechaParams)} disabled={loading} className="reporte-refresh-button"><Refresh fontSize="small" /></IconButton></span></Tooltip>
      </Paper>

      {error && <Typography className="reporte-error" role="alert">{error}</Typography>}

      <Paper elevation={0} className="reporte-conductores-table-paper">
        {loading ? <Box className="reporte-loading"><CircularProgress size={40} /></Box> : <TableContainer><Table className="reporte-conductores-table"><TableHead><TableRow><TableCell>Nombres</TableCell><TableCell>Apellidos</TableCell><TableCell>Teléfono</TableCell><TableCell>Licencia</TableCell><TableCell>Categoría</TableCell><TableCell align="center">Estado</TableCell><TableCell align="center">Reporte</TableCell></TableRow></TableHead><TableBody>
          {filteredConductores.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>No se encontraron conductores</TableCell></TableRow> : filteredConductores.map((conductor) => {
            const exporting = exportingMap[conductor.id] || { pdf: false, xlsx: false }
            return (
              <TableRow key={conductor.id} hover className={conductor.estado === false ? 'reporte-row-inactive' : ''}>
                <TableCell><Typography fontWeight={700} variant="body2">{conductor.nombres || '-'}</Typography></TableCell>
                <TableCell>{conductor.apellidos || '-'}</TableCell>
                <TableCell>{conductor.telefono || '-'}</TableCell>
                <TableCell>{conductor.licencia || '-'}</TableCell>
                <TableCell>{conductor.categoria || '-'}</TableCell>
                <TableCell align="center"><span className={conductor.estado === false ? 'reporte-status reporte-status--inactive' : 'reporte-status'}>{conductor.estado === false ? 'Inactivo' : 'Activo'}</span></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Exportar PDF"><span><IconButton size="small" color="error" onClick={() => handleExportConductor(conductor.id, 'pdf')} disabled={exporting.pdf || exporting.xlsx}>{exporting.pdf ? <CircularProgress size={16} /> : <PictureAsPdf fontSize="small" />}</IconButton></span></Tooltip>
                    <Tooltip title="Exportar Excel"><span><IconButton size="small" color="success" onClick={() => handleExportConductor(conductor.id, 'xlsx')} disabled={exporting.pdf || exporting.xlsx}>{exporting.xlsx ? <CircularProgress size={16} /> : <Download fontSize="small" />}</IconButton></span></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody></Table></TableContainer>}
      </Paper>
    </Box>
  )
}
