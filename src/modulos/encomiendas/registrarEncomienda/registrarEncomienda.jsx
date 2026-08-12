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
  IconButton
} from '@mui/material'

import { getClientes, getPuntosVenta, createEncomienda } from './registrarEncomiendaService'
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

export default function RegistrarEncomienda({ open, onClose, onSuccess }) {
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
      // Generar número correlativo temporal
      const randomSeq = String(Math.floor(Math.random() * 9000) + 1000)
      const currentYear = new Date().getFullYear()
      setNumero(`ENC-${currentYear}-${randomSeq}`)

      // Cargar datos
      const loadInitialData = async () => {
        setLoadingData(true)
        try {
          const [cliData, pvData] = await Promise.all([getClientes(), getPuntosVenta()])
          setClientesList(cliData)
          setPuntosVentaList(pvData)

          // Seleccionar primer destino por defecto si existe
          if (pvData.length > 0) {
            setDestino(pvData[0].nombre)
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

  // Validar y enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

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

      // Formato fecha sin 'T': "YYYY-MM-DD HH:mm:ss"
      const fechaRecepcion = formatDateTimeWithoutT(now)
      const fechaEntrega = formatDateTimeWithoutT(tomorrow)

      // Construcción del objeto a enviar
      const payload = {
        contenido: contenido.trim(),
        fechaRecepcion,
        fechaEntrega,
        monto: Number(monto),
        numero,
        estado: true,
        pagado,
        destino,
        usuarioId: getUsuarioId()
      }

      // Remitente: ID si fue elegido de la lista, u objeto si es un cliente nuevo
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

      // Consignatario: ID si fue elegido de la lista, u objeto si es un cliente nuevo
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

      await createEncomienda(payload)

      setSnackbar({ open: true, message: `Encomienda ${numero} registrada con éxito!`, severity: 'success' })

      if (onSuccess) {
        onSuccess(payload)
      }

      setTimeout(() => {
        onClose()
      }, 600)
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: 'Error al registrar la encomienda: ' + (err.message || ''), severity: 'error' })
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
        PaperProps={{ className: 'registrar-encomienda-paper' }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <LocalShippingIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Registrar Nueva Encomienda
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

        <DialogContent dividers sx={{ p: 3 }}>
          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <Box component="form" id="form-registrar-encomienda" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                {/* Fila 1: Remitente y Consignatario en 2 columnas */}
                <Grid item xs={12} md={6}>
                  <Box className="client-column-box">
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
                      <Grid item xs={6}>
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
                      <Grid item xs={6}>
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

                <Grid item xs={12} md={6}>
                  <Box className="client-column-box">
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
                      <Grid item xs={6}>
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
                      <Grid item xs={6}>
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

                {/* Fila 2: Contenido, Destino y Monto */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contenido del Paquete / Encomienda *"
                    placeholder="Ej: Caja con repuestos, Sobre con documentos..."
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
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
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Monto (Bs.) *"
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ step: '0.50', min: '0' }}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </Grid>

                {/* Fila 3: Botón Estado de Pago al fondo */}
                <Grid item xs={12}>
                  <Box className="pagado-toggle-box">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      Estado del Pago:
                    </Typography>
                    <Button
                      type="button"
                      variant="contained"
                      className={`btn-pagado-toggle ${pagado ? 'btn-pagado-true' : 'btn-pagado-false'}`}
                      onClick={() => setPagado(!pagado)}
                    >
                      {pagado ? 'PAGADO (Verde)' : 'POR PAGAR (Naranja)'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={onClose} color="inherit" disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-registrar-encomienda"
            variant="contained"
            disabled={submitting || loadingData}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {submitting ? 'Guardando...' : 'Registrar Encomienda'}
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
