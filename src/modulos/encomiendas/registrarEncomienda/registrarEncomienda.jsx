import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Autocomplete,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material'

import { getClientes, getPuntosVenta, createEncomienda, updateEncomienda } from './registrarEncomiendaService'
import './registrarEncomienda.css'

// Helper para formatear fecha a "YYYY-MM-DD HH:mm:ss" (sin la 'T')
const formatDateTimeWithoutT = (dateObj) => {
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = dateObj.getFullYear()
  const mm = pad(dateObj.getMonth() + 1)
  const dd = pad(dateObj.getDate())
  const hh = pad(dateObj.getHours())
  const min = pad(dateObj.getMinutes())
  const ss = pad(dateObj.getSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

// Iconos SVG nativos para evitar errores de compilación
const LocalShippingIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const CloseIcon = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const PersonIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const CheckCircleIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const ClockIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 16 14" />
  </svg>
)

export default function RegistrarEncomienda({ open, onClose, onSuccess, encomiendaToEdit }) {
  const isEditMode = !!encomiendaToEdit
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Carga de listas desde backend / mock
  const [clientesList, setClientesList] = useState([])
  const [puntosVentaList, setPuntosVentaList] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Formulario general
  const [contenido, setContenido] = useState('')
  const [monto, setMonto] = useState('')
  const [destino, setDestino] = useState('')
  const [pagado, setPagado] = useState(true) // true: PAGADO (verde), false: POR PAGAR (naranja)
  const [numero, setNumero] = useState('')

  // Datos Remitente
  const [selectedRemitente, setSelectedRemitente] = useState(null)
  const [remitenteNombre, setRemitenteNombre] = useState('')
  const [remitenteCi, setRemitenteCi] = useState('')
  const [remitenteTelefono, setRemitenteTelefono] = useState('')

  // Datos Consignatario
  const [selectedConsignatario, setSelectedConsignatario] = useState(null)
  const [consignatarioNombre, setConsignatarioNombre] = useState('')
  const [consignatarioCi, setConsignatarioCi] = useState('')
  const [consignatarioTelefono, setConsignatarioTelefono] = useState('')

  // Notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  // Inicializar / Cargar listas
  useEffect(() => {
    if (open) {
      // Generar número correlativo temporal (solo en modo crear)
      if (!isEditMode) {
        const randomSeq = String(Math.floor(Math.random() * 9000) + 1000)
        const currentYear = new Date().getFullYear()
        setNumero(`ENC-${currentYear}-${randomSeq}`)
      }

      // Cargar datos
      const loadInitialData = async () => {
        setLoadingData(true)
        try {
          const [cliData, pvData] = await Promise.all([getClientes(), getPuntosVenta()])
          setClientesList(cliData)
          setPuntosVentaList(pvData)

          if (isEditMode && encomiendaToEdit) {
            // Pre-cargar campos con datos del registro a editar
            const e = encomiendaToEdit
            setNumero(e.numero || '')
            setContenido(e.contenido || '')
            setMonto(String(e.monto || ''))
            setDestino(e.destino || '')
            setPagado(e.pagado !== undefined ? e.pagado : true)
            // Remitente
            if (e.clienteRemitente) {
              setSelectedRemitente(e.clienteRemitente)
              setRemitenteNombre(e.clienteRemitente.nombreCompleto || '')
              setRemitenteCi(e.clienteRemitente.ci || '')
              setRemitenteTelefono(e.clienteRemitente.telefono || '')
            }
            // Consignatario
            if (e.clienteConsignatario) {
              setSelectedConsignatario(e.clienteConsignatario)
              setConsignatarioNombre(e.clienteConsignatario.nombreCompleto || '')
              setConsignatarioCi(e.clienteConsignatario.ci || '')
              setConsignatarioTelefono(e.clienteConsignatario.telefono || '')
            }
          } else {
            // Seleccionar primer destino por defecto si existe
            if (pvData.length > 0) {
              setDestino(pvData[0].nombre)
            }
          }
        } catch (err) {
          console.error('Error al cargar datos auxiliares:', err)
        } finally {
          setLoadingData(false)
        }
      }

      loadInitialData()
    } else {
      // Resetear estado al cerrar
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setContenido('')
    setMonto('')
    setDestino('')
    setPagado(true)
    setSelectedRemitente(null)
    setRemitenteNombre('')
    setRemitenteCi('')
    setRemitenteTelefono('')
    setSelectedConsignatario(null)
    setConsignatarioNombre('')
    setConsignatarioCi('')
    setConsignatarioTelefono('')
  }

  // Obtener ID del usuario activo desde sessionStorage
  const getUsuarioId = () => {
    try {
      const authDataRaw = sessionStorage.getItem('authData')
      if (authDataRaw) {
        const authData = JSON.parse(authDataRaw)
        return authData.usuario?.id || 1
      }
    } catch {
      // fallback
    }
    return 1
  }

  // Handler Remitente seleccionado en Autocomplete
  const handleSelectRemitente = (event, newValue) => {
    if (typeof newValue === 'string') {
      setSelectedRemitente(null)
      setRemitenteNombre(newValue)
    } else if (newValue && newValue.id) {
      setSelectedRemitente(newValue)
      setRemitenteNombre(newValue.nombreCompleto || '')
      setRemitenteCi(newValue.ci || '')
      setRemitenteTelefono(newValue.telefono || '')
    } else {
      setSelectedRemitente(null)
      setRemitenteNombre('')
    }
  }

  // Handler Consignatario seleccionado en Autocomplete
  const handleSelectConsignatario = (event, newValue) => {
    if (typeof newValue === 'string') {
      setSelectedConsignatario(null)
      setConsignatarioNombre(newValue)
    } else if (newValue && newValue.id) {
      setSelectedConsignatario(newValue)
      setConsignatarioNombre(newValue.nombreCompleto || '')
      setConsignatarioCi(newValue.ci || '')
      setConsignatarioTelefono(newValue.telefono || '')
    } else {
      setSelectedConsignatario(null)
      setConsignatarioNombre('')
    }
  }

  const submitWithPaymentStatus = async (status) => {
    setPagado(status)

    const syntheticEvent = { preventDefault: () => {} }
    await handleSubmit(syntheticEvent, status)
  }

  // Validar y enviar formulario
  const handleSubmit = async (e, forcedPagado = pagado) => {
    e?.preventDefault?.()

    if (!contenido.trim()) {
      setSnackbar({ open: true, message: 'Debe ingresar el contenido de la encomienda.', severity: 'warning' })
      return
    }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setSnackbar({ open: true, message: 'Debe ingresar un monto válido mayor a 0.', severity: 'warning' })
      return
    }
    if (!destino) {
      setSnackbar({ open: true, message: 'Debe seleccionar un destino.', severity: 'warning' })
      return
    }
    if (!remitenteNombre.trim()) {
      setSnackbar({ open: true, message: 'Debe ingresar el nombre del remitente.', severity: 'warning' })
      return
    }
    if (!consignatarioNombre.trim()) {
      setSnackbar({ open: true, message: 'Debe ingresar el nombre del consignatario.', severity: 'warning' })
      return
    }

    setSubmitting(true)

    try {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const fechaRecepcion = formatDateTimeWithoutT(now)
      const fechaEntrega = ''//formatDateTimeWithoutT(tomorrow)

      const payload = {
        contenido: contenido.trim(),
        fechaRecepcion: isEditMode ? (encomiendaToEdit?.fechaRecepcion || formatDateTimeWithoutT(now)) : fechaRecepcion,
        fechaEntrega,
        monto: Number(monto),
        numero,
        estado: isEditMode ? (encomiendaToEdit?.estado !== undefined ? encomiendaToEdit.estado : true) : true,
        pagado: forcedPagado,
        destino,
        usuarioId: getUsuarioId()
      }

      if (selectedRemitente && selectedRemitente.id) {
        payload.clienteRemitenteId = selectedRemitente.id
      } else {
        payload.clienteRemitente = {
          nombreCompleto: remitenteNombre.trim(),
          ci: remitenteCi.trim(),
          telefono: remitenteTelefono.trim(),
          estado: true
        }
      }

      if (selectedConsignatario && selectedConsignatario.id) {
        payload.clienteConsignatarioId = selectedConsignatario.id
      } else {
        payload.clienteConsignatario = {
          nombreCompleto: consignatarioNombre.trim(),
          ci: consignatarioCi.trim(),
          telefono: consignatarioTelefono.trim(),
          estado: true
        }
      }

      if (isEditMode) {
        await updateEncomienda(encomiendaToEdit.id, payload)
        setSnackbar({ open: true, message: 'Encomienda actualizada con éxito!', severity: 'success' })
      } else {
        await createEncomienda(payload)
        setSnackbar({ open: true, message: 'Encomienda registrada con éxito!', severity: 'success' })
      }

      if (onSuccess) {
        onSuccess(payload)
      }

      setTimeout(() => {
        onClose()
      }, 600)
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: (isEditMode ? 'Error al actualizar: ' : 'Error al registrar la encomienda: ') + (err.message || ''), severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { className: 'registrar-encomienda-paper' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <LocalShippingIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {isEditMode ? 'Editar Encomienda' : 'Registrar Nueva Encomienda'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                N° Guía: <strong>{numero}</strong>
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <Box component="form" id="form-registrar-encomienda" onSubmit={handleSubmit}>
              <Grid container spacing={2.5} sx={{ alignItems: 'stretch' }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box className="client-column-box" sx={{ height: '100%' }}>
                    <Typography variant="subtitle2" className="modal-section-title">
                      <PersonIcon style={{ fontSize: 18 }} />
                      Cliente Remitente (Envía)
                    </Typography>

                    <Autocomplete
                      freeSolo
                      options={clientesList}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option
                        return `${option.nombreCompleto || ''} ${option.ci ? `- CI: ${option.ci}` : ''}`.trim()
                      }}
                      onChange={handleSelectRemitente}
                      onInputChange={(event, newInputValue) => {
                        if (!selectedRemitente) {
                          setRemitenteNombre(newInputValue)
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar / Nombre Completo Remitente *"
                          size="small"
                          fullWidth
                          sx={{ mb: 1.5, bgcolor: '#ffffff' }}
                        />
                      )}
                    />

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="C.I. Remitente"
                          size="small"
                          fullWidth
                          value={remitenteCi}
                          onChange={(e) => {
                            setRemitenteCi(e.target.value)
                            if (selectedRemitente) setSelectedRemitente(null)
                          }}
                          sx={{ bgcolor: '#ffffff' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Teléfono Remitente"
                          size="small"
                          fullWidth
                          value={remitenteTelefono}
                          onChange={(e) => {
                            setRemitenteTelefono(e.target.value)
                            if (selectedRemitente) setSelectedRemitente(null)
                          }}
                          sx={{ bgcolor: '#ffffff' }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                    <TextField
                      label="Contenido del Paquete / Encomienda *"
                      placeholder="Ej: Caja con repuestos, Sobre con documentos..."
                      multiline
                      rows={8}
                      fullWidth
                      size="small"
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      sx={{ bgcolor: '#ffffff', flex: 1 }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="select-destino-label">Destino *</InputLabel>
                        <Select
                          labelId="select-destino-label"
                          value={destino}
                          label="Destino *"
                          onChange={(e) => setDestino(e.target.value)}
                        >
                          {puntosVentaList.map((pv) => (
                            <MenuItem key={pv.id || pv.nombre} value={pv.nombre}>
                              {pv.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label="Monto (Bs.) *"
                        type="number"
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { step: '0.50', min: '0' } }}
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        sx={{ minWidth: { sm: 150 } }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box className="client-column-box" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                    <Typography variant="subtitle2" className="modal-section-title">
                      <PersonIcon style={{ fontSize: 18 }} />
                      Cliente Consignatario (Recibe)
                    </Typography>

                    <Autocomplete
                      freeSolo
                      options={clientesList}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option
                        return `${option.nombreCompleto || ''} ${option.ci ? `- CI: ${option.ci}` : ''}`.trim()
                      }}
                      onChange={handleSelectConsignatario}
                      onInputChange={(event, newInputValue) => {
                        if (!selectedConsignatario) {
                          setConsignatarioNombre(newInputValue)
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar / Nombre Completo Consignatario *"
                          size="small"
                          fullWidth
                          sx={{ mb: 1.5, bgcolor: '#ffffff' }}
                        />
                      )}
                    />

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="C.I. Consignatario"
                          size="small"
                          fullWidth
                          value={consignatarioCi}
                          onChange={(e) => {
                            setConsignatarioCi(e.target.value)
                            if (selectedConsignatario) setSelectedConsignatario(null)
                          }}
                          sx={{ bgcolor: '#ffffff' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Teléfono Consignatario"
                          size="small"
                          fullWidth
                          value={consignatarioTelefono}
                          onChange={(e) => {
                            setConsignatarioTelefono(e.target.value)
                            if (selectedConsignatario) setSelectedConsignatario(null)
                          }}
                          sx={{ bgcolor: '#ffffff' }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#f8fafc',
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button onClick={onClose} color="inherit" disabled={submitting} sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={submitting || loadingData}
            onClick={() => submitWithPaymentStatus(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              width: { xs: '100%', sm: 'auto' },
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' }
            }}
          >
            {submitting ? 'Guardando...' : (isEditMode ? 'GUARDAR (PAGADO)' : 'PAGADO')}
          </Button>

          <Button
            type="button"
            variant="contained"
            startIcon={<ClockIcon />}
            disabled={submitting || loadingData}
            onClick={() => submitWithPaymentStatus(false)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              width: { xs: '100%', sm: 'auto' },
              bgcolor: '#f59e0b',
              color: '#fff',
              '&:hover': { bgcolor: '#d97706' }
            }}
          >
            {submitting ? 'Guardando...' : (isEditMode ? 'GUARDAR (POR PAGAR)' : 'POR PAGAR')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
