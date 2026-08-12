import React, { useEffect, useState } from 'react'
import { getDashboardData } from './dashboardService'
import './dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const result = await getDashboardData()
      setData(result)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ color: '#2563eb', fontWeight: 600, fontSize: 16 }}>Cargando métricas del sistema...</div>
      </div>
    )
  }

  if (!data) return null

  const { kpis, encomiendasPorDestino, pasajesPorDestino, ultimasEncomiendasSinEntregar } = data

  return (
    <div className="dashboard-container">
      {/* Banner Superior */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <h2>Panel Principal de Control</h2>
          <p>Métricas en tiempo real de encomiendas, pasajes, pasajes por destino y flota de vehículos</p>
        </div>
        <div className="banner-badge">
          <span></span> Sistema En Línea
        </div>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="kpi-grid">
        {/* 📦 ENCOMIENDAS SIN RECOGER (fechaEntrega = null) */}
        <div className="kpi-card pending">
          <div className="kpi-header">
            <span className="kpi-title">Encomiendas Sin Recoger</span>
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.encomiendasSinEntregar}</div>
          <div className="kpi-footer">
            <span className="warning-tag">Sin recoger</span>
            <span>No recogieron aún</span>
          </div>
        </div>

        {/* 💵 TOTAL RECAUDADO (Filtrado por estado = true) */}
        <div className="kpi-card revenue">
          <div className="kpi-header">
            <span className="kpi-title">Total Recaudado</span>
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">Bs. {Number(kpis.totalRecaudadoGlobal).toFixed(2)}</div>
          <div className="kpi-footer">
            <span>Pasajes: Bs. {Number(kpis.montoPasajesTotal).toFixed(0)}</span>
            <span>Encom.: Bs. {Number(kpis.montoEncomiendasTotal).toFixed(0)}</span>
          </div>
        </div>

        {/* 🎟️ PASAJES EMITIDOS */}
        <div className="kpi-card pasajes">
          <div className="kpi-header">
            <span className="kpi-title">Pasajes Vendidos</span>
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                <path d="M13 5v14" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.totalPasajesVendidos}</div>
          <div className="kpi-footer">
            <span>Reservas: {kpis.pasajesReservas}</span>
            <span>Anulados: {kpis.pasajesAnulados}</span>
          </div>
        </div>

        {/* 🚌 FLOTA DE VEHÍCULOS */}
        <div className="kpi-card flota">
          <div className="kpi-header">
            <span className="kpi-title">Flota de Vehículos</span>
            <div className="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="15" rx="3" />
                <path d="M4 11h16" />
                <path d="M8 15h.01M16 15h.01" />
                <path d="M6 19v2M18 19v2" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.vehiculosActivos} / {kpis.vehiculosTotal}</div>
          <div className="kpi-footer">
            <span>Móviles Operativos</span>
            <span>Horarios: {kpis.horariosActivos}</span>
          </div>
        </div>
      </div>

      {/* Gráficas de Destinos */}
      <div className="charts-grid">
        {/* Gráfica 1: Destinos más concurridos por PASAJES */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title-group">
              <h3>Destinos Más Concurridos (Pasajes)</h3>
              <p>Basado en pasajes.destino emitidos activos</p>
            </div>
            <span className="chart-badge">Pasajeros</span>
          </div>

          <div className="bar-chart-list">
            {pasajesPorDestino.length === 0 ? (
              <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>No hay registros de pasajes</div>
            ) : (
              pasajesPorDestino.map((item, idx) => (
                <div className="bar-item" key={idx}>
                  <div className="bar-info">
                    <span className="bar-label">{item.destino}</span>
                    <div className="bar-values">
                      <span className="bar-count">{item.cantidad} pasajes</span>
                      <span className="bar-monto">Bs. {item.montoTotal}</span>
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill blue"
                      style={{ width: `${Math.max(item.porcentaje, 6)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gráfica 2: Destinos donde se envían más ENCOMIENDAS */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title-group">
              <h3>Destinos de Encomiendas Enviadas</h3>
              <p>Basado en encomienda.destino acumuladas</p>
            </div>
            <span className="chart-badge">Carga</span>
          </div>

          <div className="bar-chart-list">
            {encomiendasPorDestino.length === 0 ? (
              <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>No hay registros de encomiendas</div>
            ) : (
              encomiendasPorDestino.map((item, idx) => (
                <div className="bar-item" key={idx}>
                  <div className="bar-info">
                    <span className="bar-label">{item.destino}</span>
                    <div className="bar-values">
                      <span className="bar-count">{item.cantidad} paquetes</span>
                      {item.sinEntregar > 0 && (
                        <span className="warning-tag" style={{ fontSize: 10 }}>
                          {item.sinEntregar} sin recoger
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill purple"
                      style={{ width: `${Math.max(item.porcentaje, 6)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Encomiendas Pendientes de Recojo */}
      <div className="table-card">
        <div className="chart-card-header" style={{ marginBottom: 12 }}>
          <div className="chart-title-group">
            <h3>Encomiendas Pendientes de Recojo (fechaEntrega = null)</h3>
            <p>Listado de paquetes en depósito aguardando por el consignatario</p>
          </div>
          <span className="chart-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
            {kpis.encomiendasSinEntregar} Pendientes
          </span>
        </div>

        <table className="dash-table">
          <thead>
            <tr>
              <th>Nº Encomienda</th>
              <th>Destino</th>
              <th>Contenido / Detalle</th>
              <th>Monto (Bs.)</th>
              <th>Estado Entrega</th>
            </tr>
          </thead>
          <tbody>
            {ultimasEncomiendasSinEntregar.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                  ¡Excelente! No hay encomiendas pendientes por entregar.
                </td>
              </tr>
            ) : (
              ultimasEncomiendasSinEntregar.map((enc) => (
                <tr key={enc.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{enc.numero || `ENC-${enc.id}`}</td>
                  <td>{enc.destino}</td>
                  <td>{enc.contenido || 'Paquete regular'}</td>
                  <td><span style={{ fontWeight: 700 }}>Bs. {Number(enc.monto || 0).toFixed(2)}</span></td>
                  <td>
                    <span className="status-badge sin-entregar">
                      Sin recoger
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
