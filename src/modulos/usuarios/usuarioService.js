export const fetchUsuarios = async () => {
  const res = await fetch('http://localhost:5093/api/usuarios');
  if (!res.ok) throw new Error('Error en la API');
  return res.json();
};