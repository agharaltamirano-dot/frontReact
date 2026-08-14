import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, TextField, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, InputAdornment, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Pagination, Stack, CircularProgress, Divider, FormControlLabel, Switch
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Storefront as StorefrontIcon,
  Phone as PhoneIcon,
  Room as RoomIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { getPuntosVenta, createPuntoVenta, updatePuntoVenta, deletePuntoVenta } from './puntoVentaService'
import './puntoVenta.css'

const EMPTY_FORM = { nombre: '', direccion: '', telefono: '', esPuntoVenta: true, visiblePasajes: false }
const ITEMS_PER_PAGE = 8

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function PuntoVenta() {
  const [puntos, setPuntos] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = crear, objeto = editar
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Confirmación eliminar
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, nombre: '' })
  const [deleting, setDeleting] = useState(false)

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' })
  const showSnack = (message, severity = 'info') => setSnack({ open: true, message, severity })

  const fetchPuntos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPuntosVenta()
      setPuntos(Array.isArray(data) ? data : [])
    } catch (err) {
      showSnack('Error al cargar puntos de venta: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPuntos() }, [fetchPuntos])

  // ── Filtrado y paginación ────────────────────────────────────────────────────
  const filtered = puntos.filter(p => {
    const q = search.toLowerCase()
    return (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.direccion || '').toLowerCase().includes(q) ||
      (p.telefono || '').toLowerCase().includes(q)
    )
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ── Formulario ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (punto) => {
    setEditing(punto)
    setForm({
      nombre: punto.nombre || '',
      direccion: punto.direccion || '',
      telefono: punto.telefono || '',
      esPuntoVenta: punto.esPuntoVenta ?? true,
      visiblePasajes: punto.visiblePasajes ?? false
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const validate = () => {
    const errors = {}
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido'
    if (!form.direccion.trim()) errors.direccion = 'La dirección es requerida'
    if (!form.telefono.trim()) errors.telefono = 'El teléfono es requerido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await updatePuntoVenta(editing.id, form)
        showSnack('Punto de venta actualizado correctamente', 'success')
      } else {
        await createPuntoVenta(form)
        showSnack('Punto de venta creado correctamente', 'success')
      }
      closeModal()
      fetchPuntos()
    } catch (err) {
      showSnack('Error al guardar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const requestDelete = (punto) => {
    setDeleteConfirm({ open: true, id: punto.id, nombre: punto.nombre })
  }

  const cancelDelete = () => setDeleteConfirm({ open: false, id: null, nombre: '' })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePuntoVenta(deleteConfirm.id)
      showSnack('Punto de venta eliminado', 'success')
      setDeleteConfirm({ open: false, id: null, nombre: '' })
      fetchPuntos()
    } catch (err) {
      showSnack('Error al eliminar: ' + err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box className="pv-screen">
      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <Box className="pv-header">
        <Box>
          <Typography variant="h5" className="pv-title">
            Puntos de Venta
          </Typography>
          <Typography variant="body2" className="pv-subtitle">
            {puntos.length} punto{puntos.length !== 1 ? 's' : ''} de venta registrado{puntos.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Recargar">
            <IconButton onClick={fetchPuntos} disabled={loading} className="refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            className="btn-add-pv"
            disableElevation
          >
            Nuevo Punto de Venta
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ── Buscador ───────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, dirección o teléfono..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              background: 'white',
              borderRadius: '10px',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#0ea5e9' },
            }
          }}
        />
      </Box>

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      <Paper elevation={0} className="pv-table-paper">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} sx={{ color: '#0ea5e9' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table className="pv-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}></TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                      {search ? `Sin resultados para "${search}"` : 'No hay puntos de venta registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((p) => (
                    <TableRow key={p.id} hover className={p.esPuntoVenta === false ? 'row-inactive' : ''}>
                      <TableCell>
                        <Avatar className="pv-avatar" sx={{ width: 38, height: 38, fontSize: 14 }}>
                          {getInitials(p.nombre)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {p.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <RoomIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                          <Typography variant="body2" color="#475569">{p.direccion || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                          <Typography variant="body2" color="#475569">{p.telefono || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p.esPuntoVenta !== false ? 'Activo' : 'Inactivo'}
                          size="small"
                          className={p.esPuntoVenta !== false ? 'chip-activo' : 'chip-inactivo'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              className="btn-action-edit"
                              onClick={() => openEdit(p)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              className="btn-action-delete"
                              onClick={() => requestDelete(p)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <Box className="pv-pagination">
            <Typography variant="caption" color="#64748b">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  color: '#fff',
                  fontWeight: 700
                }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* ══ MODAL CREAR / EDITAR ═══════════════════════════════════════════════ */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: 'modal-pv-paper' }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box className="modal-icon-box">
              <StorefrontIcon sx={{ fontSize: 20, color: '#0ea5e9' }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={16}>
                {editing ? 'Editar Punto de Venta' : 'Nuevo Punto de Venta'}
              </Typography>
              <Typography variant="caption" color="#64748b">
                {editing ? `Modificando: ${editing.nombre}` : 'Completa los datos del punto de venta'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              fullWidth
              size="small"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              InputProps={{
                startAdornment: <InputAdornment position="start"><StorefrontIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
              }}
              sx={{ '& fieldset': { borderRadius: '10px' } }}
            />
            <TextField
              label="Dirección"
              fullWidth
              size="small"
              value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              error={!!formErrors.direccion}
              helperText={formErrors.direccion}
              InputProps={{
                startAdornment: <InputAdornment position="start"><RoomIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
              }}
              sx={{ '& fieldset': { borderRadius: '10px' } }}
            />
            <TextField
              label="Teléfono"
              fullWidth
              size="small"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              error={!!formErrors.telefono}
              helperText={formErrors.telefono}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
              }}
              sx={{ '& fieldset': { borderRadius: '10px' } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.esPuntoVenta}
                  onChange={e => setForm(f => ({ ...f, esPuntoVenta: e.target.checked }))}
                  color="primary"
                />
              }
              label={<Typography variant="body2" color="#475569">Punto de venta activo</Typography>}
            />
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.visiblePasajes}
                    onChange={e => setForm(f => ({ ...f, visiblePasajes: e.target.checked }))}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" color="#475569">Visible en Pasajes</Typography>}
              />
              <Typography variant="caption" color="#94a3b8" sx={{ display: 'block', ml: 1.7, mt: -0.5 }}>
                Activa el acceso rápido a este punto de venta desde el módulo de Pasajes
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeModal} disabled={saving} variant="outlined" className="btn-cancel">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            className="btn-save-pv"
            disableElevation
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {editing ? 'Guardar Cambios' : 'Crear Punto de Venta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ CONFIRMAR ELIMINAR ═══════════════════════════════════════════════ */}
      <Dialog open={deleteConfirm.open} onClose={cancelDelete} maxWidth="xs" fullWidth PaperProps={{ className: 'modal-pv-paper' }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Confirmar eliminación</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" color="#475569">
            ¿Está seguro de eliminar el punto de venta <strong>{deleteConfirm.nombre}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={cancelDelete} disabled={deleting} variant="outlined" className="btn-cancel">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            disableElevation
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ SNACKBAR NOTIFICACIONES ═══════════════════════════════════════════ */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ borderRadius: '10px', fontWeight: 600 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
