import React, { useEffect, useState, Fragment } from 'react'
import {
  Box, Button, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, InputAdornment, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Stack, Chip, Avatar, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Pagination, CircularProgress
} from '@mui/material'
import {
  Search as SearchIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  AirplaneTicket as TicketIcon,
  DirectionsBus as BusIcon,
  Person as PersonIcon,
  EventSeat as SeatIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { getPasajes, deletePasaje, getTicketBlob } from './pasajesService'
import './pasajes.css'

const ITEMS_PER_PAGE = 8

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function PasajesList() {
  const [pasajes, setPasajes] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const [puntosVenta, setPuntosVenta] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [usuariosList, setUsuariosList] = useState([])

  const [filterCliente, setFilterCliente] = useState('')
  const [filterDestino, setFilterDestino] = useState('todos')
  const [filterVehiculo, setFilterVehiculo] = useState('todos')
  const [filterUsuario, setFilterUsuario] = useState('todos')

  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const showSnackbar = (message, severity = 'info') =>
    setSnackbar({ open: true, message, severity })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const data = await getPasajes()
      setPasajes(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (err) {
      showSnackbar('Error al cargar pasajes: ' + (err.message || ''), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const getAux = async () => {
      try {
        const token = (() => {
          try { return JSON.parse(sessionStorage.getItem('authData') || '{}').token || '' } catch { return '' }
        })()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [pvRes, vRes, uRes] = await Promise.all([
          fetch('http://localhost:5093/api/puntos-venta', { headers }),
          fetch('http://localhost:5093/api/vehiculos', { headers }),
          fetch('http://localhost:5093/api/usuarios', { headers })
        ])
        if (pvRes.ok) setPuntosVenta(await pvRes.json())
        if (vRes.ok) setVehiculos(await vRes.json())
        if (uRes.ok) setUsuariosList(await uRes.json())
      } catch (err) {
        console.warn('Error datos auxiliares:', err.message)
      }
    }
    getAux()
  }, [])

  const performAnular = async () => {
    try {
      // Evitar anular si el pasaje ya fue despachado
      const pasaje = pasajes.find(p => p.id === confirm.id)
      if (pasaje?.despachado) {
        showSnackbar('No se puede anular: el pasaje ya fue despachado', 'warning')
        setConfirm({ open: false, id: null })
        return
      }

      await deletePasaje(confirm.id)
      showSnackbar('Pasaje anulado correctamente', 'success')
      fetchAll()
    } catch (err) {
      showSnackbar('Error al anular: ' + (err.message || ''), 'error')
    } finally {
      setConfirm({ open: false, id: null })
    }
  }

  const reimprimir = async (id) => {
  if (!id) return showSnackbar("ID inválido", "warning")

  showSnackbar("Generando ticket...", "info")

  try {
    const blob = await getTicketBlob(id)
    const blobUrl = URL.createObjectURL(blob)

    const iframe = document.createElement("iframe")
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      opacity: "0",
    })
    iframe.src = blobUrl

    iframe.onload = () => {
      try {
        // Esperar a que el documento esté completamente listo
        const checkReady = setInterval(() => {
          if (iframe.contentDocument?.readyState === "complete") {
            clearInterval(checkReady)

            try {
              iframe.contentWindow.focus()
              // Dar tiempo suficiente para que el PDF se renderice
              setTimeout(() => {
                try {
                  iframe.contentWindow.print()
                } catch (e) {
                  console.warn("Error al imprimir:", e)
                  // Fallback: abrir en nueva pestaña
                  const a = document.createElement("a")
                  a.href = blobUrl
                  a.target = "_blank"
                  a.rel = "noopener"
                  a.click()
                }

                // Limpieza después de unos segundos
                setTimeout(() => {
                  try {
                    document.body.removeChild(iframe)
                  } catch (_) {}
                  try {
                    URL.revokeObjectURL(blobUrl)
                  } catch (_) {}
                }, 3000)
              }, 1200) // delay mayor para estabilidad
            } catch (e) {
              console.warn("Error en impresión:", e)
            }
          }
        }, 300)
      } catch (e) {
        console.warn("Error en iframe.onload:", e)
        // Fallback inmediato
        const a = document.createElement("a")
        a.href = blobUrl
        a.target = "_blank"
        a.rel = "noopener"
        a.click()
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      }
    }

    document.body.appendChild(iframe)
  } catch (err) {
    showSnackbar("Error generando ticket: " + (err.message || ""), "error")
  }
}


  // Filtros
  const normalized = (s = '') => String(s || '').toLowerCase()
  const filteredPasajes = pasajes.filter(p => {
    const matchCliente = !filterCliente || normalized(p.cliente?.nombreCompleto || '').includes(normalized(filterCliente))
    const matchDestino = filterDestino === 'todos' || (p.destino || '') === filterDestino
    const matchVehiculo = filterVehiculo === 'todos' || (p.movil && String(p.movil) === String(filterVehiculo))
    const matchUsuario = filterUsuario === 'todos' || (p.usuario?.usuario || '') === filterUsuario
    return matchCliente && matchDestino && matchVehiculo && matchUsuario
  })

  const totalPages = Math.max(1, Math.ceil(filteredPasajes.length / ITEMS_PER_PAGE))
  const paginated = filteredPasajes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const activosCount = pasajes.filter(p => p.estado !== false).length
  const anuladosCount = pasajes.filter(p => p.estado === false).length
  const totalMonto = pasajes.filter(p => p.estado !== false).reduce((s, p) => s + (Number(p.monto) || 0), 0)

  return (
    <Box className="pasajes-screen-v2">

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <Box className="pasajes-kpi-row">
        <Box className="pasajes-kpi pasajes-kpi--blue">
          <TicketIcon sx={{ fontSize: 28, opacity: 0.85 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>{activosCount}</Typography>
            <Typography variant="caption">Pasajes Activos</Typography>
          </Box>
        </Box>
        <Box className="pasajes-kpi pasajes-kpi--green">
          <Typography sx={{ fontSize: 22, lineHeight: 1 }}>Bs.</Typography>
          <Box>
            <Typography variant="h5" fontWeight={800}>{totalMonto.toFixed(2)}</Typography>
            <Typography variant="caption">Total Recaudado</Typography>
          </Box>
        </Box>
        <Box className="pasajes-kpi pasajes-kpi--red">
          <CancelIcon sx={{ fontSize: 28, opacity: 0.85 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>{anuladosCount}</Typography>
            <Typography variant="caption">Anulados</Typography>
          </Box>
        </Box>
        <Box className="pasajes-kpi pasajes-kpi--purple">
          <BusIcon sx={{ fontSize: 28, opacity: 0.85 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>{pasajes.filter(p => p.reserva).length}</Typography>
            <Typography variant="caption">Reservas</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <Paper elevation={0} className="pasajes-filter-paper">
        <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" gap={1.5}>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={filterCliente}
            onChange={e => { setFilterCliente(e.target.value); setPage(1) }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment>,
              endAdornment: filterCliente ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilterCliente('')}><CloseIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ) : null,
              sx: { background: 'white', borderRadius: '10px', '& fieldset': { borderColor: '#e2e8f0' } }
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Destino</InputLabel>
            <Select
              value={filterDestino}
              label="Destino"
              onChange={e => { setFilterDestino(e.target.value); setPage(1) }}
              sx={{ background: 'white', borderRadius: '10px' }}
            >
              <MenuItem value="todos">Todos los destinos</MenuItem>
              {puntosVenta.map(pv => <MenuItem key={pv.id} value={pv.nombre}>{pv.nombre}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Vehículo</InputLabel>
            <Select
              value={filterVehiculo}
              label="Vehículo"
              onChange={e => { setFilterVehiculo(e.target.value); setPage(1) }}
              sx={{ background: 'white', borderRadius: '10px' }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {vehiculos.map(v => <MenuItem key={v.id} value={v.movil}>{v.movil} — {v.placa || ''}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={filterUsuario}
              label="Usuario"
              onChange={e => { setFilterUsuario(e.target.value); setPage(1) }}
              sx={{ background: 'white', borderRadius: '10px' }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {usuariosList.map(u => <MenuItem key={u.id} value={u.usuario1}>{u.usuario1}</MenuItem>)}
            </Select>
          </FormControl>

          <Tooltip title="Recargar">
            <IconButton onClick={fetchAll} disabled={loading} className="refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <Paper elevation={0} className="pasajes-table-paper">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
            <CircularProgress size={40} sx={{ color: '#6366f1' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table className="pasajes-table-v2">
              <TableHead>
                <TableRow>
                  <TableCell>Asiento</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Fecha / Hora</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Móvil</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      {filterCliente ? `Sin resultados para "${filterCliente}"` : 'No hay pasajes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(p => (
                    <TableRow
                      key={p.id}
                      hover
                      className={p.estado === false ? 'row-anulado-v2' : ''}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <SeatIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                          <Typography variant="body2" fontWeight={700}>{p.asiento?.numero ?? '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#6366f1' }}>
                            {(p.cliente?.nombreCompleto || '?')[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {p.cliente?.nombreCompleto || '—'}
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                              {p.cliente?.ci ? `CI: ${p.cliente.ci}` : ''}
                            </Typography>
                          </Box>
                          {p.reserva && (
                            <Chip label="Reserva" size="small" className="chip-reserva" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <Typography variant="body2">{p.destino || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="#475569" fontSize={12}>
                          {formatDateTime(p.fechaHora || (p.horario?.fecha ? `${p.horario.fecha} ${p.horario.hora || ''}` : null))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`Bs. ${Number(p.monto || 0).toFixed(2)}`}
                          size="small"
                          className="chip-monto"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="#475569">{p.movil || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="#475569">
                          {p.usuario?.usuario || (p.usuario || '—')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p.estado === false ? 'Anulado' : 'Activo'}
                          size="small"
                          className={p.estado === false ? 'chip-anulado' : 'chip-activo'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Reimprimir ticket">
                            <IconButton
                              size="small"
                              className="btn-action-print"
                              onClick={() => reimprimir(p.id)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                                          <Tooltip title={p.estado === false ? 'Ya anulado' : p.despachado ? 'Pasaje despachado' : 'Anular pasaje'}>
                                            <span>
                                              <IconButton
                                                size="small"
                                                className="btn-action-cancel"
                                                onClick={() => setConfirm({ open: true, id: p.id })}
                                                disabled={p.estado === false || p.despachado}
                                              >
                                                <CancelIcon fontSize="small" />
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
        )}

        {/* Paginación */}
        {!loading && filteredPasajes.length > ITEMS_PER_PAGE && (
          <Box className="pasajes-pagination">
            <Typography variant="caption" color="#64748b">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredPasajes.length)} de {filteredPasajes.length}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  color: '#fff',
                  fontWeight: 700
                }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* ══ Modal Confirmar Anulación ══════════════════════════════════════════ */}
      <Dialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CancelIcon sx={{ fontSize: 20, color: '#dc2626' }} />
            </Box>
            <Typography fontWeight={700}>Confirmar anulación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="#475569">
            ¿Está seguro de anular este pasaje? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirm({ open: false, id: null })}
            variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={performAnular}
            color="error"
            variant="contained"
            disableElevation
            startIcon={<CancelIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Anular
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
