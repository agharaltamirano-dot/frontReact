import { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Stack,
  CircularProgress
} from '@mui/material'
import { getEncomiendas } from '../../encomiendas/encomiendasServices'
import './reporteEncomiendas.css'

// Íconos SVG
const SearchIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const PictureAsPdfIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const DownloadIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const RefreshIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const PersonIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const PhoneIcon = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function getUserFromSession() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return {
      id: authData.usuario?.id || authData.usuarioId || null,
      usuario: authData.usuario?.usuario || authData.usuario?.nombreCompleto || ''
    }
  } catch {
    return { id: null, usuario: '' }
  }
}

export default function ReporteEncomiendas() {
  // Estado de filtros
  const [filters, setFilters] = useState({
    clienteRemitenteId: '',
    clienteConsignatarioId: '',
    destino: '',
    estado: '',
    recepcionFechaDesde: '',
    recepcionFechaHasta: '',
    entregaFechaDesde: '',
    entregaFechaHasta: '',
    numero: '',
    pagado: ''
  })

  // Estado de datos
  const [encomiendas, setEncomiendas] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState({ pdf: false, excel: false })

  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const buildFiltersForAPI = () => {
    const user = getUserFromSession()
    const apiFilters = {}
    
    if (filters.clienteRemitenteId) apiFilters.clienteRemitenteId = parseInt(filters.clienteRemitenteId)
    if (filters.clienteConsignatarioId) apiFilters.clienteConsignatarioId = parseInt(filters.clienteConsignatarioId)
    if (filters.destino) apiFilters.destino = filters.destino
    if (filters.estado !== '') apiFilters.estado = filters.estado === 'true'
    if (filters.recepcionFechaDesde) apiFilters.recepcionFechaDesde = filters.recepcionFechaDesde
    if (filters.recepcionFechaHasta) apiFilters.recepcionFechaHasta = filters.recepcionFechaHasta
    if (filters.entregaFechaDesde) apiFilters.entregaFechaDesde = filters.entregaFechaDesde
    if (filters.entregaFechaHasta) apiFilters.entregaFechaHasta = filters.entregaFechaHasta
    if (filters.numero) apiFilters.numero = filters.numero
    if (filters.pagado !== '') apiFilters.pagado = filters.pagado === 'true'
    
    // Añadir usuario automáticamente
    if (user.usuario) apiFilters.nombreUsuario = user.usuario

    return apiFilters
  }

  const fetchEncomiendas = useCallback(async () => {
    setLoading(true)
    try {
      const apiFilters = buildFiltersForAPI()
      const data = await getEncomiendas(apiFilters)
      setEncomiendas(data || [])
    } catch (err) {
      console.error('Error al cargar encomiendas:', err)
      setEncomiendas([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleSearch = () => {
    setPage(0)
    fetchEncomiendas()
  }

  const handleReset = () => {
    setFilters({
      clienteRemitenteId: '',
      clienteConsignatarioId: '',
      destino: '',
      estado: '',
      recepcionFechaDesde: '',
      recepcionFechaHasta: '',
      entregaFechaDesde: '',
      entregaFechaHasta: '',
      numero: '',
      pagado: ''
    })
    setPage(0)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const buildQueryString = () => {
    const apiFilters = buildFiltersForAPI()
    const queryParams = new URLSearchParams()
    Object.entries(apiFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })
    return queryParams.toString()
  }
  const getUserName = () => {
    const authData = JSON.parse(sessionStorage.getItem("authData") || '{}')
    console.log('usuario generando', authData);
    return authData?.usuario?.usuario1 || ''
  }
  const handleExportPDF = async () => {
    setExporting(prev => ({ ...prev, pdf: true }))
    try {
      const queryString = buildQueryString()
      const filters = {...buildFiltersForAPI(), nombreUsuario: getUserName()}
      const url = `http://localhost:5093/api/reporteEncomiendas/reporte-encomiendas/pdf${filters ? '?' + new URLSearchParams(filters).toString() : ''}`
      const token = getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`Error ${response.status}`)
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Abrir en nueva ventana
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      
      // Limpiar después de un tiempo
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      alert('Error al exportar PDF: ' + err.message)
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }))
    }
  }

  const handleExportExcel = async () => {
    setExporting(prev => ({ ...prev, excel: true }))
    try {
      const queryString = buildQueryString()
      const url = `http://localhost:5093/api/reporteEncomiendas/reporte-encomiendas/xlsx${queryString ? '?' + queryString : ''}`
      const token = getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`Error ${response.status}`)
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Descargar automáticamente
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'reporte_encomiendas.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Limpiar
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert('Error al exportar Excel: ' + err.message)
    } finally {
      setExporting(prev => ({ ...prev, excel: false }))
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const user = getUserFromSession()
        const apiFilters = {}
        if (user.id) apiFilters.usuarioId = user.id
        if (user.usuario) apiFilters.nombreUsuario = user.usuario
        const data = await getEncomiendas(apiFilters)
        setEncomiendas(data || [])
      } catch (err) {
        console.error('Error al cargar encomiendas:', err)
        setEncomiendas([])
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const paginatedData = encomiendas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const totalRecaudado = encomiendas
    .filter(e => e.pagado && e.estado)
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

  return (
    <Box className="reporte-encomiendas-view" sx={{ p: 3 }}>
      {/* <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
        Reporte de Encomiendas
      </Typography> */}

      {/* Filtros */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="ID Remitente"
                type="number"
                value={filters.clienteRemitenteId}
                onChange={(e) => handleFilterChange('clienteRemitenteId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="ID Consignatario"
                type="number"
                value={filters.clienteConsignatarioId}
                onChange={(e) => handleFilterChange('clienteConsignatarioId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Destino"
                value={filters.destino}
                onChange={(e) => handleFilterChange('destino', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Número"
                value={filters.numero}
                onChange={(e) => handleFilterChange('numero', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado}
                  label="Estado"
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activa</MenuItem>
                  <MenuItem value="false">Anulada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Pagado</InputLabel>
                <Select
                  value={filters.pagado}
                  label="Pagado"
                  onChange={(e) => handleFilterChange('pagado', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Pagado</MenuItem>
                  <MenuItem value="false">Por Pagar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Recepción Desde"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.recepcionFechaDesde}
                onChange={(e) => handleFilterChange('recepcionFechaDesde', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Recepción Hasta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.recepcionFechaHasta}
                onChange={(e) => handleFilterChange('recepcionFechaHasta', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Entrega Desde"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.entregaFechaDesde}
                onChange={(e) => handleFilterChange('entregaFechaDesde', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Entrega Hasta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.entregaFechaHasta}
                onChange={(e) => handleFilterChange('entregaFechaHasta', e.target.value)}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ bgcolor: '#f0f9ff', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Encomiendas</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0369a1' }}>
                {encomiendas.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ bgcolor: '#f0fdf4', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Recaudado</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
                Bs. {totalRecaudado.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ bgcolor: '#fefce8', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Pagadas</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ca8a04' }}>
                {encomiendas.filter(e => e.pagado).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ bgcolor: '#fef2f2', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Por Pagar</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                {encomiendas.filter(e => !e.pagado).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botones de exportación */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={exporting.pdf ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <PictureAsPdfIcon />}
          onClick={handleExportPDF}
          disabled={exporting.pdf || loading}
          sx={{ textTransform: 'none' }}
        >
          {exporting.pdf ? 'Exportando...' : 'Exportar PDF'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={exporting.excel ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DownloadIcon />}
          onClick={handleExportExcel}
          disabled={exporting.excel || loading}
          sx={{ textTransform: 'none' }}
        >
          {exporting.excel ? 'Descargando...' : 'Exportar Excel'}
        </Button>
      </Stack>

      {/* Tabla */}
      <TableContainer className="encomiendas-table-container">
        <Table className="encomiendas-table">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Remitente</TableCell>
              <TableCell>Consignatario</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Contenido</TableCell>
              <TableCell>Fecha Recepción</TableCell>
              <TableCell>Fecha Entrega</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Pagado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No se encontraron encomiendas</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <span className="tracking-number">{item.numero}</span>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box className="person-name" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon />
                        {item.clienteRemitente?.nombreCompleto || 'N/D'}
                      </Box>
                      {item.clienteRemitente?.telefono && (
                        <Box className="person-phone">
                          <PhoneIcon />
                          {item.clienteRemitente.telefono}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box className="person-name" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon />
                        {item.clienteConsignatario?.nombreCompleto || 'N/D'}
                      </Box>
                      {item.clienteConsignatario?.telefono && (
                        <Box className="person-phone">
                          <PhoneIcon />
                          {item.clienteConsignatario.telefono}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.destino || 'N/D'} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.contenido || 'N/D'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.fechaRecepcion ? new Date(item.fechaRecepcion).toLocaleString('es-ES', { 
                        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                      }) : 'N/D'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.fechaEntrega ? new Date(item.fechaEntrega).toLocaleString('es-ES', { 
                        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                      }) : 'N/D'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Bs. {Number(item.monto || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.estado ? 'Activa' : 'Anulada'}
                      size="small"
                      className={item.estado ? 'badge-activa' : 'badge-anulada'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.pagado ? 'Pagado' : 'Por Pagar'}
                      size="small"
                      className={item.pagado ? 'badge-pagado' : 'badge-por-pagar'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={encomiendas.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  )
}
