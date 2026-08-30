import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Divider,
  Stack
} from '@mui/material'

import { getEncomiendas, deleteEncomienda } from './encomiendasServices'
import RegistrarEncomienda from './RegistrarEncomienda/registrarEncomienda'
import './encomiendas.css'

// Íconos SVG para evitar dependencia externa de @mui/icons-material
const SearchIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const LocalShippingIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const AttachMoneyIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const CheckCircleIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const PendingActionsIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const PrintIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const DeleteIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
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

const RefreshIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const ReceiptLongIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
)

const CancelIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const EditIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

export default function Encomiendas() {
  const [encomiendas, setEncomiendas] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPagado, setFilterPagado] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')

  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  // Notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  // Diálogo para anular
  const [confirmDelete, setConfirmDelete] = useState({ open: false, encomienda: null })
  const [deleting, setDeleting] = useState(false)

  // Diálogo para vista previa / imprimir ticket
  const [printModal, setPrintModal] = useState({ open: false, encomienda: null })

  // Diálogo para registrar nueva encomienda
  const [openRegisterModal, setOpenRegisterModal] = useState(false)

  // Diálogo para editar encomienda
  const [editModal, setEditModal] = useState({ open: false, encomienda: null })
  const openEditModal = (encomienda) => setEditModal({ open: true, encomienda })
  const closeEditModal = () => setEditModal({ open: false, encomienda: null })

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Cargar encomiendas
  const fetchEncomiendasData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEncomiendas()
      setEncomiendas(Array.isArray(data) ? data : [])
      console.log('Encomiendas cargadas:', data)
    } catch (err) {
      console.error(err)
      showSnackbar('Error al cargar encomiendas: ' + (err.message || ''), 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEncomiendasData()
  }, [fetchEncomiendasData])

  // Filtrado de encomiendas
  const filteredEncomiendas = encomiendas.filter(item => {
    // Filtro texto
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      (item.numero && item.numero.toLowerCase().includes(term)) ||
      (item.contenido && item.contenido.toLowerCase().includes(term)) ||
      (item.destino && item.destino.toLowerCase().includes(term)) ||
      (item.clienteRemitente?.nombreCompleto && item.clienteRemitente.nombreCompleto.toLowerCase().includes(term)) ||
      (item.clienteConsignatario?.nombreCompleto && item.clienteConsignatario.nombreCompleto.toLowerCase().includes(term)) ||
      (item.usuario?.usuario && item.usuario.usuario.toLowerCase().includes(term))

    // Filtro pagado
    let matchesPagado = true
    if (filterPagado === 'pagado') matchesPagado = item.pagado === true
    if (filterPagado === 'por_pagar') matchesPagado = item.pagado === false

    // Filtro estado (activa vs anulada)
    let matchesEstado = true
    if (filterEstado === 'activa') matchesEstado = item.estado === true
    if (filterEstado === 'anulada') matchesEstado = item.estado === false

    return matchesSearch && matchesPagado && matchesEstado
  })

  // Handlers de paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Confirmar anulación
  const handleOpenDeleteDialog = (encomienda) => {
    setConfirmDelete({ open: true, encomienda })
  }

  const handleCloseDeleteDialog = () => {
    setConfirmDelete({ open: false, encomienda: null })
  }

  const handleAnularEncomienda = async () => {
    if (!confirmDelete.encomienda) return
    const idToAnular = confirmDelete.encomienda.id
    setDeleting(true)
    try {
      await deleteEncomienda(idToAnular)
      // Actualizar estado local a anula (estado = false) o actualizar lista
      setEncomiendas(prev =>
        prev.map(item => item.id === idToAnular ? { ...item, estado: false } : item)
      )
      showSnackbar(`Encomienda N° ${confirmDelete.encomienda.numero} anulada con éxito`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('Error al anular la encomienda: ' + (err.message || ''), 'error')
    } finally {
      setDeleting(false)
      handleCloseDeleteDialog()
    }
  }

  // Handler Imprimir Ticket
  const handleOpenPrintModal = (encomienda) => {
    setPrintModal({ open: true, encomienda })
    showSnackbar(`Generando vista de comprobante para ${encomienda.numero}...`, 'info')
  }

  const handleClosePrintModal = () => {
    setPrintModal({ open: false, encomienda: null })
  }

  // Cálculos estadísticos
  const totalEncomiendas = encomiendas.length
  const totalRecaudado = encomiendas
    .filter(e => e.pagado && e.estado)
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)
  const totalPagadas = encomiendas.filter(e => e.pagado).length
  const totalPorPagar = encomiendas.filter(e => !e.pagado).length

  // Elementos paginados
  const paginatedData = filteredEncomiendas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box className="encomiendas-view" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Encabezado */}
      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Módulo de Encomiendas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión y seguimiento del envío de paquetes y encomiendas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LocalShippingIcon />}
            onClick={() => setOpenRegisterModal(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            + Nueva Encomienda
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEncomiendasData}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Actualizar
          </Button>
        </Stack>
      </Box> */}

      {/* Tarjetas resumen UX/UI */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" variant="outlined" sx={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <LocalShippingIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Registradas
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {totalEncomiendas}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" variant="outlined" sx={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <AttachMoneyIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Recaudado (Pagadas)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a' }}>
                  Bs. {totalRecaudado.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" variant="outlined" sx={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}>
                <CheckCircleIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Estado Pagado
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {totalPagadas}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" variant="outlined" sx={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ed6c02' }}>
                <PendingActionsIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Por Pagar
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                  {totalPorPagar}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contenedor Principal: Filtros y Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: 'rgba(0,0,0,0.08)' }}>
        {/* Barra de Filtros */}
        <Box sx={{ p: 2.5, bgcolor: '#ffffff', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por N°, remitente, consignatario, contenido o destino..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />

          {/* Filtro Pagado */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="select-pagado-label">Pago</InputLabel>
            <Select
              labelId="select-pagado-label"
              value={filterPagado}
              label="Pago"
              onChange={(e) => {
                setFilterPagado(e.target.value)
                setPage(0)
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="todos">Todos los pagos</MenuItem>
              <MenuItem value="pagado">Pagado (Verde)</MenuItem>
              <MenuItem value="por_pagar">Por pagar (Naranja)</MenuItem>
            </Select>
          </FormControl>

          {/* Filtro Estado */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="select-estado-label">Estado</InputLabel>
            <Select
              labelId="select-estado-label"
              value={filterEstado}
              label="Estado"
              onChange={(e) => {
                setFilterEstado(e.target.value)
                setPage(0)
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="todos">Todos los estados</MenuItem>
              <MenuItem value="activa">Activa</MenuItem>
              <MenuItem value="anulada">Anulada</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Tabla MUI */}
        <TableContainer className="encomiendas-table-container">
          <Table className="encomiendas-table" aria-label="tabla de encomiendas">
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Contenido</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Remitente</TableCell>
                <TableCell>Consignatario</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Recepción</TableCell>
                <TableCell align="center">Pago</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={32} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando encomiendas...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                    <LocalShippingIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475569' }}>
                      No se encontraron encomiendas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prueba modificando el criterio de búsqueda o los filtros.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.id} hover>
                    {/* Número */}
                    <TableCell>
                      <span className="tracking-number">{row.numero}</span>
                    </TableCell>

                    {/* Contenido */}
                    <TableCell sx={{ maxWidth: 200, fontWeight: 500 }}>
                      {row.contenido}
                    </TableCell>

                    {/* Destino */}
                    <TableCell>
                      <Chip
                        label={row.destino}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, borderColor: '#cbd5e1', bgcolor: '#f8fafc' }}
                      />
                    </TableCell>

                    {/* Remitente: Nombre Completo & Teléfono */}
                    <TableCell>
                      <span className="person-name">
                        {row.clienteRemitente?.nombreCompleto || 'N/A'}
                      </span>
                      {row.clienteRemitente?.telefono && (
                        <span className="person-phone">
                          <PhoneIcon sx={{ fontSize: 12, color: '#64748b' }} />
                          {row.clienteRemitente.telefono}
                        </span>
                      )}
                    </TableCell>

                    {/* Consignatario: Nombre Completo & Teléfono */}
                    <TableCell>
                      <span className="person-name">
                        {row.clienteConsignatario?.nombreCompleto || 'N/A'}
                      </span>
                      {row.clienteConsignatario?.telefono && (
                        <span className="person-phone">
                          <PhoneIcon sx={{ fontSize: 12, color: '#64748b' }} />
                          {row.clienteConsignatario.telefono}
                        </span>
                      )}
                    </TableCell>

                    {/* Monto */}
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Bs. {Number(row.monto || 0).toFixed(2)}
                    </TableCell>

                    {/* Fecha Recepción (Fecha Entrega NO se muestra) */}
                    <TableCell sx={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {row.fechaRecepcion}
                    </TableCell>

                    {/* Pagado: true -> 'Pagado' (verde), false -> 'Por pagar' (naranja) */}
                    <TableCell align="center">
                      {row.pagado ? (
                        <Chip
                          label="Pagado"
                          size="small"
                          className="badge-pagado"
                        />
                      ) : (
                        <Chip
                          label="Por pagar"
                          size="small"
                          className="badge-por-pagar"
                        />
                      )}
                    </TableCell>

                    {/* Estado: true -> 'Activa', false -> 'Anulada' */}
                    <TableCell align="center">
                      {row.estado ? (
                        <Chip
                          label="Activa"
                          size="small"
                          className="badge-activa"
                        />
                      ) : (
                        <Chip
                          label="Anulada"
                          size="small"
                          className="badge-anulada"
                        />
                      )}
                    </TableCell>

                    {/* Usuario Registrador */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                          {row.usuario?.usuario || 'Sistema'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Acciones: Imprimir, Editar & Anular */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Imprimir Comprobante">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenPrintModal(row)}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={row.envio != null ? 'La encomienda ya fue enviada' : 'Editar Encomienda'}>
                          <span>
                            <IconButton
                              size="small"
                              color="info"
                              disabled={row.envio != null}
                              onClick={() => openEditModal(row)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={row.estado ? "Anular Encomienda" : "Encomienda ya anulada"}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!row.estado}
                              onClick={() => handleOpenDeleteDialog(row)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginador MUI */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEncomiendas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>

      {/* Diálogo de Confirmación para Anular */}
      <Dialog
        open={confirmDelete.open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon color="error" />
          ¿Confirmar anulación de encomienda?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#334155' }}>
            Está a punto de anular la encomienda{' '}
            <strong>{confirmDelete.encomienda?.numero}</strong> ({confirmDelete.encomienda?.contenido}). Esta acción registrará la encomienda como <strong>Anulada</strong> en la base de datos.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit" disabled={deleting} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleAnularEncomienda}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {deleting ? 'Anulando...' : 'Sí, Anular Encomienda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Vista previa comprobante / Imprimir */}
      <Dialog
        open={printModal.open}
        onClose={handleClosePrintModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: 'ticket-modal-paper', sx: { p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <ReceiptLongIcon color="primary" />
          Comprobante de Encomienda
        </DialogTitle>
        <DialogContent dividers>
          {printModal.encomienda && (
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" align="center" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
                TRANSPORTE EDDA
              </Typography>
              <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mb: 2 }}>
                GUÍA DE ENCOMIENDA: {printModal.encomienda.numero}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Contenido:</strong> {printModal.encomienda.contenido}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Destino:</strong> {printModal.encomienda.destino}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Remitente:</strong> {printModal.encomienda.clienteRemitente?.nombreCompleto} ({printModal.encomienda.clienteRemitente?.telefono})
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Consignatario:</strong> {printModal.encomienda.clienteConsignatario?.nombreCompleto} ({printModal.encomienda.clienteConsignatario?.telefono})
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Fecha Recepción:</strong> {printModal.encomienda.fechaRecepcion}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Registrado por:</strong> {printModal.encomienda.usuario?.usuario}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Monto Total:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  Bs. {Number(printModal.encomienda.monto || 0).toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Chip
                  label={printModal.encomienda.pagado ? "PAGADO" : "POR PAGAR EN DESTINO"}
                  color={printModal.encomienda.pagado ? "success" : "warning"}
                  size="small"
                  sx={{ fontWeight: 700, mt: 1 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePrintModal} color="inherit" sx={{ textTransform: 'none' }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              window.print()
            }}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Imprimir Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Registrar Encomienda */}
      <RegistrarEncomienda
        open={openRegisterModal}
        onClose={() => setOpenRegisterModal(false)}
        onSuccess={() => {
          fetchEncomiendasData()
          showSnackbar('Encomienda registrada con éxito', 'success')
        }}
      />

      {/* Modal Editar Encomienda */}
      <RegistrarEncomienda
        open={editModal.open}
        onClose={closeEditModal}
        encomiendaToEdit={editModal.encomienda}
        onSuccess={() => {
          fetchEncomiendasData()
          showSnackbar('Encomienda actualizada con éxito', 'success')
          closeEditModal()
        }}
      />

      {/* Snackbar Notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
