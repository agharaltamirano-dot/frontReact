import { useCallback, useEffect, useState } from 'react'
import {
  Box, Button, CircularProgress, Divider, IconButton, InputAdornment,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Close, Download, PictureAsPdf, Refresh, Search } from '@mui/icons-material'
import { getClientes, getReporteClientesPdf, getReporteClientesXlsx } from '../../clientes/clientesService'
import './reporteClientes.css'

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ReporteClientes() {
  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState({ pdf: false, xlsx: false })
  const [error, setError] = useState('')

  const filters = search.trim() ? { search: search.trim() } : {}

  const loadClientes = useCallback(async (appliedFilters = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await getClientes(appliedFilters)
      setClientes(Array.isArray(data) ? data : [])
    } catch (err) {
      setClientes([])
      setError(`Error al cargar clientes: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadClientes(), 0)
    return () => clearTimeout(timer)
  }, [loadClientes])

  const handleExport = async (type) => {
    setExporting(current => ({ ...current, [type]: true }))
    setError('')
    try {
      const blob = type === 'pdf'
        ? await getReporteClientesPdf(filters)
        : await getReporteClientesXlsx(filters)

      if (type === 'pdf') {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        downloadBlob(blob, 'reporte_clientes.xlsx')
      }
    } catch (err) {
      setError(`Error al exportar el reporte: ${err.message}`)
    } finally {
      setExporting(current => ({ ...current, [type]: false }))
    }
  }

  return (
    <Box className="reporte-clientes-screen">
      <Box className="reporte-clientes-header">
        <Box>
          {/* <Typography variant="h5" className="reporte-clientes-title">Reporte de Clientes</Typography> */}
          <Typography variant="body2" className="reporte-clientes-subtitle">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" color="error" startIcon={exporting.pdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
            onClick={() => handleExport('pdf')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">
            Exportar PDF
          </Button>
          <Button variant="contained" color="success" startIcon={exporting.xlsx ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={() => handleExport('xlsx')} disabled={loading || exporting.pdf || exporting.xlsx} className="reporte-export-button">
            Exportar Excel
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={0} className="reporte-clientes-filter-paper">
        <TextField fullWidth size="small" placeholder="Buscar por nombre, CI o teléfono..." value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') loadClientes(filters) }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => { setSearch(''); loadClientes() }}><Close fontSize="small" /></IconButton></InputAdornment> : null
          }}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<Search />} onClick={() => loadClientes(filters)} disabled={loading}>Buscar</Button>
          <Tooltip title="Recargar"><span><IconButton onClick={() => loadClientes(filters)} disabled={loading} className="reporte-refresh-button"><Refresh fontSize="small" /></IconButton></span></Tooltip>
        </Stack>
      </Paper>

      {error && <Typography className="reporte-error" role="alert">{error}</Typography>}

      <Paper elevation={0} className="reporte-clientes-table-paper">
        {loading ? <Box className="reporte-loading"><CircularProgress size={40} /></Box> : (
          <TableContainer>
            <Table className="reporte-clientes-table">
              <TableHead><TableRow><TableCell>Nombre completo</TableCell><TableCell>CI / Documento</TableCell><TableCell>Teléfono</TableCell><TableCell align="center">Estado</TableCell></TableRow></TableHead>
              <TableBody>
                {clientes.length === 0 ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>No se encontraron clientes</TableCell></TableRow> : clientes.map((cliente) => (
                  <TableRow key={cliente.id} hover className={cliente.estado === false ? 'reporte-row-inactive' : ''}>
                    <TableCell><Typography fontWeight={700} variant="body2">{cliente.nombreCompleto || '-'}</Typography></TableCell>
                    <TableCell>{cliente.ci || '-'}</TableCell><TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell align="center"><span className={cliente.estado === false ? 'reporte-status reporte-status--inactive' : 'reporte-status'}>{cliente.estado === false ? 'Inactivo' : 'Activo'}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
