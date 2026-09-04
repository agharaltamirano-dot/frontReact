import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import autoImg from '../../assets/auto.jpeg'
import logoImg from '../../assets/logo3.jpeg'
import './login.css'
// MUI imports for improved modal UI
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
// Note: intentionally do not include a close 'X' — only the Cancel button closes the dialog
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CircularProgress from '@mui/material/CircularProgress'

function Login() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        nombre: '',
        clave: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    // Forgot password modal state
    const [showForgotModal, setShowForgotModal] = useState(false)
    const [forgotStep, setForgotStep] = useState(1) // 1,2,3
    const [forgotForm, setForgotForm] = useState({ nombre: '', correo: '' })
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotError, setForgotError] = useState('')
    const [forgotCode, setForgotCode] = useState('')
    const [verifyLoading, setVerifyLoading] = useState(false)
    const [verifyError, setVerifyError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }))
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('http://localhost:5093/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Credenciales inválidas')
            }

            const data = await response.json()

            console.log('Login exitoso:', data)

            // Guardar sesión completa en sessionStorage (token + usuario con rol y menus)
            sessionStorage.setItem('authData', JSON.stringify(data))


            navigate('/', { replace: true })

        } catch (err) {
            console.error(err)
            setError(err.message || 'Error de conexión con el servidor')
        } finally {
            setLoading(false)
        }
    }

    // Forgot password handlers
    const openForgotModal = () => {
        setShowForgotModal(true)
        setForgotStep(1)
        setForgotForm({ nombre: '', correo: '' })
        setForgotError('')
        setForgotLoading(false)
    }

    const closeForgotModal = () => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotError('')
    }

    const handleForgotChange = (e) => {
        const { name, value } = e.target
        setForgotForm(prev => ({ ...prev, [name]: value }))
        if (forgotError) setForgotError('')
    }

    const handleForgotSubmit = async (e) => {
        e.preventDefault()
        setForgotLoading(true)
        setForgotError('')

        try {
            const response = await fetch('http://localhost:5093/api/auth/login/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(forgotForm)
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                const message = err.message || 'Error al solicitar recuperación'
                const e = new Error(message)
                console.log(e)
                throw e
            }

            // Si recibimos 200 ok, avanzamos al siguiente paso
            setForgotStep(2)
        } catch (err) {
            // Log the error as requested and show a friendly message
            console.log(err)
            setForgotError(err.message || 'Error de conexión con el servidor')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleCodeChange = (e) => {
        const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
        setForgotCode(v)
        if (verifyError) setVerifyError('')
    }

    const handleVerifyCode = async () => {
        // For now advance locally when 6 digits entered
        if (forgotCode.length !== 6) {
            setVerifyError('Ingrese un código de 6 dígitos')
            return
        }

        setVerifyLoading(true)
        try {
            // If you later add an API call to verify the code, do it here.
            console.log('Código ingresado:', forgotCode)
            setForgotStep(3)
        } catch (e) {
            console.log(e)
            setVerifyError('Error al verificar el código')
        } finally {
            setVerifyLoading(false)
        }
    }

    return (

        <div className="login-wrapper">
            {/* Panel izquierdo - Animación con formulario */}
            <div className="login-visual">
                <div className="waves-container">
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                    <div className="wave wave-3"></div>
                </div>
                <div className="visual-content">
                    {/* Logo y título arriba */}
                    <div className="logo-container">
                        <img
                            src={logoImg}
                            alt="Asociación de Transporte"
                            className="company-logo"
                            onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextElementSibling.style.display = 'flex'
                            }}
                        />
                        <div className="logo-placeholder" style={{ display: 'none' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="visual-title">Empresa Transporte Rio San Juan del Oro</h2>

                    {/* Formulario elevado */}
                    <div className="form-card">
                    <div className="form-header">
                        <h1 className="form-title">Bienvenido de Nuevo</h1>
                        <p className="form-subtitle">Ingrese sus credenciales para acceder al sistema</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label htmlFor="nombre" className="input-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Usuario
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ingrese su usuario"
                                required
                                className="input-field"
                                autoComplete="username"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="clave" className="input-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                                Contraseña
                            </label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="clave"
                                    name="clave"
                                    value={formData.clave}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="input-field"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>



                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Acceder al Sistema
                                </>
                            )}
                        </button>

                        <div className="forgot-link-row">
                            <button
                                type="button"
                                className="forgot-link"
                                onClick={openForgotModal}
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </form>
                    </div>

                    {/* Forgot password modal (MUI) */}
                    <Dialog
                        open={showForgotModal}
                        onClose={(e, reason) => {
                            // Prevent closing via backdrop click or Escape key — only Cancel closes
                            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
                            // Also prevent programmatic close while request is in progress
                            if (forgotLoading) return
                            closeForgotModal()
                        }}
                        maxWidth="xs"
                        fullWidth
                        BackdropProps={{
                            sx: {
                                backdropFilter: 'blur(6px)',
                                backgroundColor: 'rgba(0,0,0,0.35)'
                            }
                        }}
                        PaperProps={{
                            sx: {
                                bgcolor: '#fff',
                                borderRadius: 2
                            }
                        }}
                    >
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                            Recuperar contraseña
                        </DialogTitle>

                        <DialogContent dividers sx={{ backgroundColor: '#fff' }}>
                            {forgotStep === 1 && (
                                <Box component="form" onSubmit={handleForgotSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ color: 'text.secondary' }}>Ingrese su usuario y correo para continuar.</Box>

                                    {forgotError && (
                                        <Box sx={{ color: 'error.main', fontSize: '0.95rem' }}>{forgotError}</Box>
                                    )}

                                    <TextField
                                        name="nombre"
                                        value={forgotForm.nombre}
                                        onChange={handleForgotChange}
                                        required
                                        label="Usuario"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        name="correo"
                                        type="email"
                                        value={forgotForm.correo}
                                        onChange={handleForgotChange}
                                        required
                                        label="Correo electrónico"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <DialogActions sx={{ px: 0 }}>
                                        <Button variant="text" onClick={closeForgotModal} disabled={forgotLoading}>Cancelar</Button>
                                        <Button variant="contained" type="submit" disabled={forgotLoading} endIcon={!forgotLoading ? <SendIcon /> : null}>
                                            {forgotLoading ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : (
                                                'Enviar'
                                            )}
                                        </Button>
                                    </DialogActions>
                                </Box>
                            )}

                            {forgotStep === 2 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon color="success" />
                                        <Box>Hemos enviado un enlace o código a su correo.</Box>
                                    </Box>

                                    <DialogActions sx={{ px: 0 }}>
                                        <Button variant="outlined" onClick={() => setForgotStep(1)}>Volver</Button>
                                        <Button variant="contained" onClick={() => setForgotStep(3)}>Siguiente</Button>
                                    </DialogActions>
                                </Box>
                            )}

                            {forgotStep === 3 && (
                                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        type="password"
                                        label="Nueva contraseña"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>) }}
                                    />

                                    <TextField
                                        type="password"
                                        label="Confirmar contraseña"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>) }}
                                    />

                                    <DialogActions sx={{ px: 0 }}>
                                        <Button variant="outlined" onClick={() => setForgotStep(2)}>Volver</Button>
                                        <Button variant="contained" onClick={closeForgotModal}>Guardar</Button>
                                    </DialogActions>
                                </Box>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Descripción abajo */}
                    <p className="visual-description">
                        Sistema de administracion de boletos y encomiendas
                    </p>
                </div>
            </div>

            {/* Panel derecho - Imagen */}
            <div className="login-image-panel">
                <img src={autoImg} alt="Bus de la empresa" className="side-image" />
                <div className="image-overlay"></div>
            </div>
        </div>
    )
}

export default Login