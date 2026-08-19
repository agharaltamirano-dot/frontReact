import { useState, useEffect } from 'react'
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { CalendarToday } from '@mui/icons-material'
import './FiltroFechas.css'

const FiltroFechas = ({ onDateChange }) => {
  const [tipoFecha, setTipoFecha] = useState('este-mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Calcula el rango de fechas según el tipo seleccionado
  const calcularRangoFechas = (tipo) => {
    const hoy = new Date()
    let desde, hasta

    switch (tipo) {
      case 'este-año': {
        desde = new Date(hoy.getFullYear(), 0, 1) // 1 enero
        hasta = new Date(hoy.getFullYear(), 11, 31) // 31 diciembre
        break
      }
      case 'este-mes': {
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1) // primer día del mes
        hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0) // último día del mes
        break
      }
      case 'mes-anterior': {
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        break
      }
      case 'esta-semana': {
        const dia = hoy.getDay()
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1) // lunes
        desde = new Date(hoy.setDate(diff))
        hasta = new Date()
        break
      }
      case 'personalizado':
        return { fechaInicio: fechaDesde, fechaFin: fechaHasta }
      default:
        return {}
    }

    // Formato YYYY-MM-DD
    const formatFecha = (date) => date.toISOString().split('T')[0]
    return { fechaInicio: formatFecha(desde), fechaFin: formatFecha(hasta) }
  }

  // Efecto que se ejecuta cuando cambia el tipo de fecha
  useEffect(() => {
    if (tipoFecha === 'personalizado') {
      // En modo personalizado, no aplicar hasta que el usuario defina ambas fechas
      if (fechaDesde && fechaHasta) {
        onDateChange({ fechaInicio: fechaDesde, fechaFin: fechaHasta })
      }
    } else {
      const rango = calcularRangoFechas(tipoFecha)
      onDateChange(rango)
    }
  }, [tipoFecha, fechaDesde, fechaHasta])

  const handleTipoChange = (event) => {
    setTipoFecha(event.target.value)
  }

  return (
    <Box className="filtro-fechas-container">
      <FormControl size="small" className="filtro-fechas-select">
        <InputLabel>Período</InputLabel>
        <Select value={tipoFecha} label="Período" onChange={handleTipoChange}>
          <MenuItem value="este-año">Este año</MenuItem>
          <MenuItem value="este-mes">Este mes</MenuItem>
          <MenuItem value="mes-anterior">Mes anterior</MenuItem>
          <MenuItem value="esta-semana">Esta semana</MenuItem>
          <MenuItem value="personalizado">Personalizar rango</MenuItem>
        </Select>
      </FormControl>

      {tipoFecha === 'personalizado' && (
        <Box className="filtro-fechas-custom">
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: fechaHasta || undefined }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: fechaDesde || undefined }}
          />
        </Box>
      )}
    </Box>
  )
}

export default FiltroFechas
