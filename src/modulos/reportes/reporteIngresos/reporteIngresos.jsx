import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import {
  PictureAsPdf,
  Download,
  Search,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchUsuarios } from '../../usuarios/usuarioService';
import {
  getResumenIngresos,
  getReporteResumenPdf,
  getReporteResumenXlsx,
  getReporteDetalladoPdf,
  getReporteDetalladoXlsx,
} from './reporteIngresosService';
import './reporteIngresos.css';

const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ReporteIngresos() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState({
    resumenPdf: false,
    resumenXlsx: false,
    detalladoPdf: false,
    detalladoXlsx: false,
  });
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  const [filters, setFilters] = useState({
    usuarioId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    estado: 'null', // string "null" for the select
    nombreUsuario: '',
  });

  const loadUsuarios = useCallback(async () => {
    try {
      const users = await fetchUsuarios();
      setUsuarios(users);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiFilters = {
        ...filters,
        estado: filters.estado === 'null' ? null : filters.estado === 'true',
      };
      const result = await getResumenIngresos(apiFilters);
      console.log('Resultado del API:', result);
      setData(result.resumen || []);
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsuarios();
    loadData();
  }, [loadUsuarios, loadData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'usuarioId') {
        const user = usuarios.find((u) => u.id.toString() === value.toString());
        newFilters.nombreUsuario = user ? user.nombre : '';
      }
      return newFilters;
    });
  };

  const handleExport = async (type, mode) => {
    const exportKey = `${mode}${type.charAt(0).toUpperCase() + type.slice(1)}`;
    setExporting((prev) => ({ ...prev, [exportKey]: true }));
    try {
      const apiFilters = {
        ...filters,
        estado: filters.estado === 'null' ? null : filters.estado === 'true',
      };

      let blob;
      if (mode === 'resumen') {
        blob = type === 'pdf' ? await getReporteResumenPdf(apiFilters) : await getReporteResumenXlsx(apiFilters);
      } else {
        blob = type === 'pdf' ? await getReporteDetalladoPdf(apiFilters) : await getReporteDetalladoXlsx(apiFilters);
      }

      if (type === 'pdf') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        downloadBlob(blob, `reporte_ingresos_${mode}_${new Date().getTime()}.xlsx`);
      }
    } catch (err) {
      setError(`Error al exportar: ${err.message}`);
    } finally {
      setExporting((prev) => ({ ...prev, [exportKey]: false }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value);
  };

  return (
    <Box className="reporte-ingresos-container">
      <Box className="reporte-ingresos-header">
        {/* <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Reporte de Ingresos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Visualiza y exporta los ingresos por pasajes y encomiendas
          </Typography>
        </Box> */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            color="error"
            startIcon={exporting.resumenPdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
            onClick={() => handleExport('pdf', 'resumen')}
            disabled={loading || exporting.resumenPdf}
          >
            Resumen PDF
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={exporting.resumenXlsx ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={() => handleExport('xlsx', 'resumen')}
            disabled={loading || exporting.resumenXlsx}
          >
            Resumen Excel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={exporting.detalladoPdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
            onClick={() => handleExport('pdf', 'detallado')}
            disabled={loading || exporting.detalladoPdf}
          >
            Detallado PDF
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={exporting.detalladoXlsx ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={() => handleExport('xlsx', 'detallado')}
            disabled={loading || exporting.detalladoXlsx}
          >
            Detallado Excel
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Usuario</InputLabel>
              <Select
                name="usuarioId"
                value={filters.usuarioId}
                label="Usuario"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos los usuarios</MenuItem>
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Inicio"
              name="fechaInicio"
              value={filters.fechaInicio}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Fin"
              name="fechaFin"
              value={filters.fechaFin}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={filters.estado}
                label="Estado"
                onChange={handleFilterChange}
              >
                <MenuItem value="null">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Anulados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Search />}
                onClick={loadData}
                disabled={loading}
              >
                Filtrar
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({
                    usuarioId: '',
                    fechaInicio: new Date().toISOString().split('T')[0],
                    fechaFin: new Date().toISOString().split('T')[0],
                    estado: 'null',
                    nombreUsuario: '',
                  });
                }}
              >
                <Refresh />
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, height: 400 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
          Tendencia de Ganancias Activas
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Fecha" />
              <YAxis tickFormatter={(value) => `Bs ${value}`} />
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Activos"
                name="Ganancias Activas"
                stroke="#2e7d32"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="Anulados"
                name="Anulados"
                stroke="#d32f2f"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Cant. Pasajes</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Cant. Encomiendas</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Activos</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Anulados</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  {loading ? 'Cargando...' : 'No hay datos disponibles para los filtros seleccionados'}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{row.Fecha}</TableCell>
                  <TableCell align="center">{row.CantPasajes}</TableCell>
                  <TableCell align="center">{row.CantEncomiendas}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                    {formatCurrency(row.Activos)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {formatCurrency(row.Anulados)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(row.Total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
