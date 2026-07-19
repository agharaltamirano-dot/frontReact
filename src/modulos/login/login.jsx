import { useState } from 'react'
import './login.css'

function Login() {
    const [formData, setFormData] = useState({
        nombre: '',
        clave: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

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
            // Manejar token o redirección aquí

        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (

        <div className="login-wrapper">
            {/* Panel izquierdo - Imagen y olas */}
            <div className="login-visual">
                <div className="waves-container">
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                    <div className="wave wave-3"></div>
                </div>
                <div className="visual-content">
                    <div className="logo-container">
                        <img
                            src="/assets/images.jfif"
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
                    <h2 className="visual-title">Empresa de Transporte Rio San Juan del Oro</h2>
                    <p className="visual-description">
                        Sistema de administracion de boletos y encomiendas
                    </p>
                </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="login-form-panel">
                <div className="form-container">
                    <div className="form-header">
                        <h1 className="form-title">Iniciar Sesión</h1>
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
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login