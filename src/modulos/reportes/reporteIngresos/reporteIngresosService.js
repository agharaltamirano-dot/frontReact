const API_URL = 'http://localhost:5093/api/reporteIngresos';

const getQueryString = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  return params.toString();
};

export const getResumenIngresos = async (filters) => {
  const query = getQueryString(filters);
  const response = await fetch(`${API_URL}/resumen/json?${query}`);
  if (!response.ok) throw new Error('Error al obtener el resumen de ingresos');
  return response.json();
};

export const getReporteResumenPdf = async (filters) => {
  const query = getQueryString(filters);
  const response = await fetch(`${API_URL}/resumen/pdf?${query}`);
  if (!response.ok) throw new Error('Error al generar el reporte PDF');
  return response.blob();
};

export const getReporteResumenXlsx = async (filters) => {
  const query = getQueryString(filters);
  const response = await fetch(`${API_URL}/resumen/xlsx?${query}`);
  if (!response.ok) throw new Error('Error al generar el reporte Excel');
  return response.blob();
};

export const getReporteDetalladoPdf = async (filters) => {
  const query = getQueryString(filters);
  const response = await fetch(`${API_URL}/detallado/pdf?${query}`);
  if (!response.ok) throw new Error('Error al generar el reporte PDF detallado');
  return response.blob();
};

export const getReporteDetalladoXlsx = async (filters) => {
  const query = getQueryString(filters);
  const response = await fetch(`${API_URL}/detallado/xlsx?${query}`);
  if (!response.ok) throw new Error('Error al generar el reporte Excel detallado');
  return response.blob();
};
