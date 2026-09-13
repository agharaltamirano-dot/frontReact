import { useState, useEffect } from 'react'
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, IconButton, InputAdornment } from '@mui/material'
import { CalendarToday } from '@mui/icons-material'
import './FiltroFechas.css'
import { es } from "date-fns/locale";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DatePicker
        label="Desde"
        value={fechaDesde || null}
        onChange={(newVal) => setFechaDesde(newVal)}
        slotProps={{
          field: {
            clearable: true,
            onClear: () => setFechaDesde(null),
          },
          textField: {
            size: "small",
            InputLabelProps: { shrink: true },
            sx: { minWidth: 160 },
            inputProps: { max: fechaHasta || undefined },
          },
        }}
      />

      <DatePicker
        label="Hasta"
        value={fechaHasta || null}
        onChange={(newVal) => setFechaHasta(newVal)}
        slotProps={{
          field: {
            clearable: true,
            onClear: () => setFechaHasta(null),
          },
          textField: {
            size: "small",
            InputLabelProps: { shrink: true },
            sx: { minWidth: 160 },
            inputProps: { min: fechaDesde || undefined },
          },
        }}
      />
    </LocalizationProvider>
  </Box>
)}
    </Box>
  )
}

export default FiltroFechas
