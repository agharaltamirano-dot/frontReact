import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, TextField, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, InputAdornment, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Pagination, Stack, CircularProgress, Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getClientes, createCliente, updateCliente, deleteCliente } from './clientesService'
import './clientes.css'

const EMPTY_FORM = { nombreCompleto: '', ci: '', telefono: '', estado: true }
const ITEMS_PER_PAGE = 8

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
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

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientes()
      setClientes(Array.isArray(data) ? data : [])
    } catch (err) {
      showSnack('Error al cargar clientes: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  // ── Filtrado y paginación ────────────────────────────────────────────────────
  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    return (
      (c.nombreCompleto || '').toLowerCase().includes(q) ||
      (c.ci || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q)
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

  const openEdit = (cliente) => {
    setEditing(cliente)
    setForm({
      nombreCompleto: cliente.nombreCompleto || '',
      ci: cliente.ci || '',
      telefono: cliente.telefono || '',
      estado: cliente.estado ?? true
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
    if (!form.nombreCompleto.trim()) errors.nombreCompleto = 'El nombre es requerido'
    if (!form.ci.trim()) errors.ci = 'El CI es requerido'
    if (!form.telefono.trim()) errors.telefono = 'El teléfono es requerido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCliente(editing.id, form)
        showSnack('Cliente actualizado correctamente', 'success')
      } else {
        await createCliente(form)
        showSnack('Cliente creado correctamente', 'success')
      }
      closeModal()
      fetchClientes()
    } catch (err) {
      showSnack('Error al guardar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const requestDelete = (cliente) => {
    setDeleteConfirm({ open: true, id: cliente.id, nombre: cliente.nombreCompleto })
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCliente(deleteConfirm.id)
      showSnack('Cliente eliminado', 'success')
      setDeleteConfirm({ open: false, id: null, nombre: '' })
      fetchClientes()
    } catch (err) {
      showSnack('Error al eliminar: ' + err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box className="clientes-screen">
      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <Box className="clientes-header">
        <Box>
          <Typography variant="h5" className="clientes-title">
            Gestión de Clientes
          </Typography>
          <Typography variant="body2" className="clientes-subtitle">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Recargar">
            <IconButton onClick={fetchClientes} disabled={loading} className="refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            className="btn-add-cliente"
            disableElevation
          >
            Nuevo Cliente
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ── Buscador ───────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, CI o teléfono..."
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
              '&:hover fieldset': { borderColor: '#6366f1' },
            }
          }}
        />
      </Box>

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      <Paper elevation={0} className="clientes-table-paper">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} sx={{ color: '#6366f1' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table className="clientes-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}></TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>CI / Documento</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                      {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((c) => (
                    <TableRow key={c.id} hover className={c.estado === false ? 'row-inactive' : ''}>
                      <TableCell>
                        <Avatar className="cliente-avatar" sx={{ width: 38, height: 38, fontSize: 14 }}>
                          {getInitials(c.nombreCompleto)}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {c.nombreCompleto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <BadgeIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                          <Typography variant="body2" color="#475569">{c.ci || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                          <Typography variant="body2" color="#475569">{c.telefono || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={c.estado !== false ? 'Activo' : 'Inactivo'}
                          size="small"
                          className={c.estado !== false ? 'chip-activo' : 'chip-inactivo'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              className="btn-action-edit"
                              onClick={() => openEdit(c)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              className="btn-action-delete"
                              onClick={() => requestDelete(c)}
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
          <Box className="clientes-pagination">
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
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
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
        PaperProps={{ className: 'modal-cliente-paper' }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box className="modal-icon-box">
              <PersonIcon sx={{ fontSize: 20, color: '#6366f1' }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={16}>
                {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </Typography>
              <Typography variant="caption" color="#64748b">
                {editing ? `Modificando: ${editing.nombreCompleto}` : 'Completa los datos del cliente'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Nombre Completo"
              fullWidth
              size="small"
              value={form.nombreCompleto}
              onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
              error={!!formErrors.nombreCompleto}
              helperText={formErrors.nombreCompleto}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
              }}
              sx={{ '& fieldset': { borderRadius: '10px' } }}
            />
            <TextField
              label="CI / Documento de Identidad"
              fullWidth
              size="small"
              value={form.ci}
              onChange={e => setForm(f => ({ ...f, ci: e.target.value }))}
              error={!!formErrors.ci}
              helperText={formErrors.ci}
              InputProps={{
                startAdornment: <InputAdornment position="start"><BadgeIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
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
            disableElevation
            className="btn-save"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ MODAL CONFIRMAR ELIMINAR ════════════════════════════════════════════ */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => !deleting && setDeleteConfirm({ open: false, id: null, nombre: '' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeleteIcon sx={{ fontSize: 20, color: '#dc2626' }} />
            </Box>
            <Typography fontWeight={700}>Confirmar eliminación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="#475569">
            ¿Está seguro de eliminar al cliente <strong>{deleteConfirm.nombre}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm({ open: false, id: null, nombre: '' })}
            disabled={deleting}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disableElevation
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%', borderRadius: '10px' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
