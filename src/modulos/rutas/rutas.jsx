import { useState, useEffect } from "react";
import "./rutas.css";
import { getRutas, createRuta, updateRuta, deleteRuta } from "./rutaService";
const BASE_URL_PUNTOS = "http://localhost:5093/api/puntos-venta";

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem("authData") || "{}");
    return authData.token || "";
  } catch {
    return "";
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function Rutas() {
  const [rutas, setRutas] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [diaFilter, setDiaFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modales y Notificaciones
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [notification, setNotification] = useState(null);
  const [rutaToDelete, setRutaToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  // Formulario
  const [formData, setFormData] = useState({
    origenId: 1,
    destinoId: null,
    dias: "",
    estado: true,
    tarifa: 15,
  });
  const [modalPuntosQuery, setModalPuntosQuery] = useState("");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── GET Puntos de Venta ──────────────────────────────────────────────────────
  const fetchPuntosVenta = async () => {
    try {
      const res = await fetch(BASE_URL_PUNTOS, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setPuntosVenta(data);
      }
    } catch (err) {
      console.log("Usando lista local de puntos de venta:", err.message);
    }
  };

  // ── GET Rutas ────────────────────────────────────────────────────────────────
  const fetchRutas = async () => {
    setLoading(true);
    try {
      const data = await getRutas();
      if (Array.isArray(data) && data.length > 0) setRutas(data);
    } catch (err) {
      console.log("Usando lista local de rutas:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuntosVenta();
    fetchRutas();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, diaFilter, statusFilter, itemsPerPage]);

  // Helper resolver punto de venta
  const getPunto = (id) =>
    puntosVenta.find((p) => Number(p.id) === Number(id)) || {
      nombre: `Punto #${id}`,
      telefono: "Sin tel.",
    };

  // Construir payload.destinos usando origen/destino seleccionados y destinos existentes (si hay)
  const buildDestinosPayload = (
    origenId,
    destinoId,
    existingDestinos,
    intermediatesUI = [],
  ) => {
    const origenIdNum = Number(origenId);
    const destinoIdNum = destinoId != null ? Number(destinoId) : null;

    const existingSorted = Array.isArray(existingDestinos)
      ? [...existingDestinos].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];
    const existingOrigin = existingSorted.length ? existingSorted[0] : null;
    const existingDest = existingSorted.length
      ? existingSorted[existingSorted.length - 1]
      : null;

    const payload = [];

    // Resolve existing origin punto id if shape differs
    const existingOriginPuntoId = existingOrigin
      ? existingOrigin.puntoVentaId ||
        existingOrigin.puntoVenta?.id ||
        existingOrigin.puntoVenta
      : null;
    const existingDestPuntoId = existingDest
      ? existingDest.puntoVentaId ||
        existingDest.puntoVenta?.id ||
        existingDest.puntoVenta
      : null;

    // Origin (preserve id if exists)
    payload
      .push({
        ...(existingOrigin?.id ? { id: existingOrigin.id } : {}),
        esOrigen: true,
        orden: 1,
        puntoVentaId: origenIdNum || existingOriginPuntoId,
      });
      (
        // Intermediates from UI (preserve ids when provided)
        intermediatesUI || []
      )
      .forEach((mid, idx) => {
        const midPunto =
          mid?.puntoVentaId || mid?.puntoVentaId === 0
            ? Number(mid.puntoVentaId)
            : mid?.puntoVenta?.id || mid?.puntoVenta;
        payload.push({
          ...(mid?.id ? { id: mid.id } : {}),
          esOrigen: false,
          orden: 2 + idx,
          puntoVentaId: Number(midPunto),
        });
      });

    // Destination (preserve id if exists)
    const destOrden =
      2 +
      (intermediatesUI && intermediatesUI.length ? intermediatesUI.length : 0);
    payload.push({
      ...(existingDest?.id ? { id: existingDest.id } : {}),
      esOrigen: false,
      orden: destOrden,
      puntoVentaId: destinoIdNum || existingDestPuntoId,
    });

    return payload;
  };

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (ruta) => {
    const nuevoEstado = !ruta.estado;
    setRutas((prev) =>
      prev.map((r) => (r.id === ruta.id ? { ...r, estado: nuevoEstado } : r)),
    );

    try {
      const destinosPayload = buildDestinosPayload(
        ruta.origenId || ruta.origen?.id,
        ruta.destinoId || ruta.destino?.id,
        ruta.destinos,
      );
      await updateRuta(ruta.id, {
        id: ruta.id,
        ...ruta,
        estado: nuevoEstado,
        destinos: destinosPayload,
      });
    } catch (err) {
      console.log("PUT backend rutas no disponible:", err.message);
    }

    const origenObj = getPunto(ruta.origenId || ruta.origen?.id);
    const destinoObj = getPunto(ruta.destinoId || ruta.destino?.id);
    showNotification(
      `Estado de ruta ${origenObj.nombre} → ${destinoObj.nombre} actualizado a ${nuevoEstado ? "Activo" : "Inactivo"}`,
      "success",
    );
  };

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      origenId: 1,
      destinoId: null,
      dias: "",
      estado: true,
      tarifa: 0,
      destinosUI: [],
    });
    setModalPuntosQuery("");
    setEditingRuta(null);
    setShowAddModal(true);
  };

  const handleEdit = (ruta) => {
    // Si ruta.dias viene como "1,2,3" convertimos a nombres para la UI
    const diasParaUI = ruta.dias
      ? String(ruta.dias)
          .split(",")
          .map((n) => {
            const idx = Number(n) - 1;
            return DIAS_SEMANA[idx] || null;
          })
          .filter(Boolean)
          .join(",")
      : "";

    // Preparamos destinos intermedios para el UI y soportamos diferentes shapes
    const sorted = Array.isArray(ruta.destinos)
      ? [...ruta.destinos].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];
    const middle =
      sorted.length > 2
        ? sorted
            .slice(1, sorted.length - 1)
            .map((d) => ({
              id: d.id,
              puntoVentaId: d.puntoVentaId || d.puntoVenta?.id || d.puntoVenta,
              orden: d.orden,
            }))
        : [];

    const origenPV = sorted.length
      ? sorted[0].puntoVentaId ||
        sorted[0].puntoVenta?.id ||
        sorted[0].puntoVenta
      : ruta.origenId || ruta.origen?.id || puntosVenta[0]?.id || 1;
    const destinoPV = sorted.length
      ? sorted[sorted.length - 1].puntoVentaId ||
        sorted[sorted.length - 1].puntoVenta?.id ||
        sorted[sorted.length - 1].puntoVenta
      : ruta.destinoId || ruta.destino?.id || puntosVenta[1]?.id || null;

    setFormData({
      origenId: origenPV,
      destinoId: destinoPV,
      dias: diasParaUI,
      estado: ruta.estado ?? true,
      tarifa: ruta.tarifa ?? 0,
      destinosUI: middle,
    });
    setModalPuntosQuery("");
    setEditingRuta(ruta);
    setShowAddModal(true);
  };

  const addIntermediateDestino = () => {
    setFormData((prev) => ({
      ...prev,
      destinosUI: [...(prev.destinosUI || []), { puntoVentaId: null }],
    }));
  };

  const removeIntermediateDestino = (index) => {
    setFormData((prev) => ({
      ...prev,
      destinosUI: (prev.destinosUI || []).filter((_, i) => i !== index),
    }));
  };

  const updateIntermediateDestino = (index, puntoId) => {
    setFormData((prev) => {
      const list = [...(prev.destinosUI || [])];
      list[index] = {
        ...(list[index] || {}),
        puntoVentaId: puntoId ? Number(puntoId) : null,
      };
      return { ...prev, destinosUI: list };
    });
  };

  // Alternar días
  const toggleDia = (dia) => {
    const diasArray = formData.dias
      ? formData.dias.split(",").filter(Boolean)
      : [];
    let updatedArray;
    if (diasArray.includes(dia)) {
      updatedArray = diasArray.filter((d) => d !== dia);
    } else {
      updatedArray = [...diasArray, dia];
    }
    setFormData((prev) => ({
      ...prev,
      dias: updatedArray.join(","),
    }));
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.origenId) errors.origen = "Seleccione un origen";
    if (!formData.destinoId) errors.destino = "Seleccione un destino";
    if (formData.origenId && formData.destinoId && Number(formData.origenId) === Number(formData.destinoId)) errors.origenDestino = "El origen y el destino no pueden ser el mismo punto de venta";
    if (!formData.dias || formData.dias.trim() === "") errors.dias = "Debe seleccionar al menos un día de operación";
    if (Number(formData.tarifa) <= 0) errors.tarifa = "La tarifa debe ser mayor a 0";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showNotification("Corrige los campos requeridos", "error");
      setTimeout(() => {
        const first = Object.keys(errors)[0];
        const el = document.querySelector(`[data-err="${first}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      // Convertir días visibles (nombres) a números según DIAS_SEMANA
      const selectedNames = formData.dias
        ? formData.dias
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const diasNums = selectedNames
        .map((name) => {
          const idx = DIAS_SEMANA.findIndex(
            (d) => d.toLowerCase() === name.toLowerCase(),
          );
          return idx >= 0 ? String(idx + 1) : null;
        })
        .filter(Boolean);
      const diasString = diasNums.join(",");

      const destinosPayload = buildDestinosPayload(
        formData.origenId,
        formData.destinoId,
        editingRuta?.destinos,
        formData.destinosUI,
      );

      const payload = {
        dias: diasString,
        tarifa: Number(formData.tarifa),
        estado: Boolean(formData.estado),
        destinos: destinosPayload,
      };

      if (editingRuta) {
        try {
          await updateRuta(editingRuta.id, { id: editingRuta.id, ...payload });
        } catch (err) {
          console.log("PUT backend rutas no disponible:", err.message);
        }

        setRutas((prev) =>
          prev.map((r) =>
            r.id === editingRuta.id
              ? { ...r, ...payload, id: editingRuta.id }
              : r,
          ),
        );
        showNotification("Ruta actualizada exitosamente");
      } else {
        const newId = Date.now();
        const newRuta = { ...payload, id: newId };
        try {
          const data = await createRuta(payload);
          if (data && data.id) newRuta.id = data.id;
        } catch (err) {
          console.log("POST backend rutas no disponible:", err.message);
        }

        setRutas((prev) => [newRuta, ...prev]);
        showNotification("Nueva ruta registrada exitosamente");
      }

      setShowAddModal(false);
      setEditingRuta(null);
    } catch (err) {
      showNotification("Error al guardar la ruta: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (ruta) => setRutaToDelete(ruta);

  const confirmDelete = async () => {
    if (!rutaToDelete) return;
    try {
      await deleteRuta(rutaToDelete.id);
      showNotification(`Ruta ${rutaToDelete.nombre || rutaToDelete.id} ${rutaToDelete.estado ? 'desactivada' : 'activada'}`, rutaToDelete.estado ? 'error' : 'success');
      fetchRutas();
    } catch (err) {
      const msg = err.message || 'Error al eliminar ruta';
      console.log('DELETE ruta error:', msg);
      showNotification(msg, 'error');
    }
    setRutaToDelete(null);
  };

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  // Visualización: convertir números de día en abreviatura (1->L,2->Ma...)
  const diaMap = { 1: "L", 2: "Ma", 3: "Mi", 4: "J", 5: "V", 6: "S", 7: "D" };

  const filteredRutas = rutas
    .map((r) => {
      // Si la API devuelve 'destinos' con puntoVenta y orden, inferimos origen y destino
      let origenObj = null;
      let destinoObj = null;
      if (Array.isArray(r.destinos) && r.destinos.length > 0) {
        const sorted = [...r.destinos].sort(
          (a, b) => (a.orden || 0) - (b.orden || 0),
        );
        const origenDest = sorted[0];
        const destinoDest = sorted[sorted.length - 1];
        origenObj =
          origenDest?.puntoVenta ||
          getPunto(origenDest?.puntoVenta?.id || origenDest?.puntoVenta);
        destinoObj =
          destinoDest?.puntoVenta ||
          getPunto(destinoDest?.puntoVenta?.id || destinoDest?.puntoVenta);
      } else {
        origenObj = getPunto(r.origenId || r.origen?.id);
        destinoObj = getPunto(r.destinoId || r.destino?.id);
      }

      // Transformar dias: si vienen como "1, 2, 3" o "1,2,3"
      const diasRaw = String(r.dias || "");
      const diasNums = diasRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const diasAbrev = diasNums.map((n) => diaMap[n] || n);

      return {
        __orig: r,
        origenObj,
        destinoObj,
        diasNums,
        diasArray: diasAbrev,
      };
    })
    .filter((item) => {
      const textTarget =
        `${item.origenObj.nombre} ${item.destinoObj.nombre} ${item.__orig.dias || ""}`.toLowerCase();
      const matchesSearch = textTarget.includes(searchTerm.toLowerCase());

      const matchesDia =
        diaFilter === "todos" ||
        (item.diasNums &&
          item.diasNums
            .map((n) => DIAS_SEMANA[Number(n) - 1])
            .includes(diaFilter));

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && item.__orig.estado) ||
        (statusFilter === "inactivos" && !item.__orig.estado);

      return matchesSearch && matchesDia && matchesStatus;
    })
    .map((item) => ({
      ...item.__orig,
      origenObj: item.origenObj,
      destinoObj: item.destinoObj,
      diasArray: item.diasArray,
    }));

  // Paginación
  const totalItems = filteredRutas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRutas = filteredRutas.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const selectedDiasList = formData.dias
    ? formData.dias.split(",").filter(Boolean)
    : [];
  const modalPuntosList = modalPuntosQuery
    ? puntosVenta.filter(
        (pv) =>
          (pv.nombre || "")
            .toLowerCase()
            .includes(modalPuntosQuery.toLowerCase()) ||
          (pv.telefono || "").includes(modalPuntosQuery) ||
          String(pv.id) === modalPuntosQuery,
      )
    : puntosVenta;

  const isFormValid =
    Number(formData.tarifa) > 0 &&
    Boolean(formData.origenId) &&
    Boolean(formData.destinoId) &&
    Boolean(formData.dias && formData.dias.trim() !== "");

  return (
    <div className="rutas-view">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {notification.type === "success" ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="content-card">
        {/* Toolbar Superior */}
        <div className="toolbar">
          <div className="filter-group">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por origen, destino o día de operación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select value={diaFilter} onChange={(e) => setDiaFilter(e.target.value)} className="filter-select">
              <option value="todos">Todos los Días</option>
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Ruta
          </button>
        </div>

        {/* Tabla */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando rutas...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Días de Operación</th>
                  <th>Tarifa</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRutas.map((ruta) => {
                  const origen =
                    ruta.origenObj ||
                    getPunto(ruta.origenId || ruta.origen?.id);
                  const destino =
                    ruta.destinoObj ||
                    getPunto(ruta.destinoId || ruta.destino?.id);
                  const diasArray =
                    ruta.diasArray ||
                    (ruta.dias
                      ? ruta.dias
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : []);

                  return (
                    <tr key={ruta.id}>
                      <td>
                        <div>
                          <strong style={{ color: "var(--slate-900)" }}>
                            {origen.nombre}
                          </strong>
                          <span className="pv-phone">
                            Tel: {origen.telefono}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: "var(--slate-900)" }}>
                            {destino.nombre}
                          </strong>
                          <span className="pv-phone">
                            Tel: {destino.telefono}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="dias-badge-group">
                          {diasArray.map((dia, idx) => (
                            <span key={idx} className="dia-pill">
                              {dia}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="tarifa-badge">
                          Bs. {Number(ruta.tarifa).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${ruta.estado ? "active" : "inactive"}`}
                        >
                          {ruta.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="action-buttons"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            onClick={() => handleDelete(ruta)}
                            className="action-btn edit-btn"
                            title={ruta.estado ? "Desactivar Ruta" : "Activar Ruta"}
                            style={{ color: ruta.estado ? "#10b981" : "#94a3b8" }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(ruta)}
                            className="action-btn edit-btn"
                            title="Editar Ruta"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {/* trash removed — power button above opens confirm modal and calls deleteRuta */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredRutas.length === 0 && (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron rutas registradas</h3>
              <p>Intente ajustando los términos de búsqueda o filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredRutas.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}{" "}
              rutas
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="pagination-size-select"
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                « Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Ruta */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{ width: "1380px", maxWidth: "95%" }}
              className="modal-content-inner"
            >
              <div className="modal-header">
                <h2>{editingRuta ? "Editar Ruta" : "Nueva Ruta"}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="modal-form">
                {/* Search input removed as requested */}
                <div
                  className="form-grid-3"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="input-group" data-err="origen">
                    <label className="input-label">Origen</label>
                    <select
                      value={formData.origenId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          origenId: Number(e.target.value),
                          destinosUI: (prev.destinosUI || []).filter(
                            (d) => Number(d.puntoVentaId) !== Number(e.target.value),
                          ),
                        }))
                      }
                      className="input-field"
                      required
                    >
                      {modalPuntosList.map((pv) => (
                        <option key={pv.id} value={pv.id}>
                          {pv.nombre} - Tel: {pv.telefono}
                        </option>
                      ))}
                    </select>
                    {(formErrors.origen || formErrors.origenDestino) && (
                      <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>
                        {formErrors.origenDestino || formErrors.origen}
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Destinos Intermedios</label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {(formData.destinosUI || []).map((d, idx) => {
                        const otherSelected = (formData.destinosUI || [])
                          .map((x, i) => (i !== idx ? x.puntoVentaId : null))
                          .filter(Boolean);
                        const baseList = modalPuntosList;
                        const options = baseList.filter(
                          (pv) =>
                            (Number(pv.id) !== Number(formData.origenId) &&
                              Number(pv.id) !== Number(formData.destinoId) &&
                              !otherSelected.includes(Number(pv.id))) ||
                            Number(pv.id) === Number(d.puntoVentaId),
                        );
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <select
                              value={d.puntoVentaId ?? ""}
                              onChange={(e) =>
                                updateIntermediateDestino(idx, e.target.value)
                              }
                              className="input-field"
                              required
                            >
                              <option value="">Seleccione punto...</option>
                              {options.map((pv) => (
                                <option key={pv.id} value={pv.id}>
                                  {pv.nombre} - Tel: {pv.telefono}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => removeIntermediateDestino(idx)}
                              style={{
                                height: "36px",
                                background: "transparent",
                                border: "none",
                                padding: 6,
                              }}
                              title="Eliminar destino intermedio"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className="add-btn"
                        onClick={addIntermediateDestino}
                        disabled={!formData.origenId || !formData.destinoId}
                        title={!formData.origenId || !formData.destinoId ? "Seleccione origen y destino primero" : "Agregar destino intermedio"}
                        style={{
                          alignSelf: "start",
                          cursor: !formData.origenId || !formData.destinoId ? "not-allowed" : "pointer",
                        }}
                      >
                        Agregar destino intermedio
                      </button>
                    </div>
                  </div>

                  <div className="input-group" data-err="destino">
                    <label className="input-label">Destino</label>
                    <select
                      value={formData.destinoId ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          destinoId: e.target.value ? Number(e.target.value) : null,
                          destinosUI: (prev.destinosUI || []).filter(
                            (d) => Number(d.puntoVentaId) !== Number(e.target.value),
                          ),
                        }))
                      }
                      className="input-field"
                      required
                    >
                      <option value="">Seleccione destino</option>
                      {modalPuntosList
                        .filter((pv) => Number(pv.id) !== Number(formData.origenId))
                        .map((pv) => (
                          <option key={pv.id} value={pv.id}>
                            {pv.nombre} - Tel: {pv.telefono}
                          </option>
                        ))}
                    </select>
                    {formErrors.destino && (
                      <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>
                        {formErrors.destino}
                      </div>
                    )}
                  </div>
                </div>

                {/* Días de Operación */}
                <div className="input-group" data-err="dias">
                  <label className="input-label">Días de Operación</label>
                  <div className="dias-selector">
                    {DIAS_SEMANA.map((dia) => {
                      const isSelected = selectedDiasList.includes(dia);
                      return (
                        <button
                          type="button"
                          key={dia}
                          className={`dia-toggle-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleDia(dia)}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    Seleccionados: {formData.dias || "Ninguno"}
                  </span>
                  {formErrors.dias && (
                    <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>
                      {formErrors.dias}
                    </div>
                  )}
                </div>

                <div className="form-grid-2">
                  <div className="input-group" data-err="tarifa">
                    <label className="input-label">Tarifa (Bs.)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      className="input-field"
                      placeholder="Ej. 15.00"
                      value={formData.tarifa}
                      onChange={(e) =>
                        setFormData({ ...formData, tarifa: e.target.value })
                      }
                      required
                    />
                    {formErrors.tarifa && (
                      <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>
                        {formErrors.tarifa}
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Estado Inicial</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "6px",
                      }}
                    >
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={formData.estado}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estado: e.target.checked,
                            })
                          }
                        />
                        <span className="switch-slider"></span>
                      </label>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: formData.estado ? "#10b981" : "#64748b",
                        }}
                      >
                        {formData.estado ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowAddModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving
                      ? "Guardando..."
                      : (editingRuta ? "Actualizar" : "Crear") + " Ruta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Activación/Desactivación (usa deleteRuta internamente) */}
      {rutaToDelete && (
        <div className="modal-overlay" onClick={() => setRutaToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar {rutaToDelete.estado ? 'Desactivación' : 'Activación'}</h2>
              <button
                className="modal-close"
                onClick={() => setRutaToDelete(null)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <p
                style={{
                  color: "var(--slate-700)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                ¿Está seguro de que desea {rutaToDelete.estado ? 'desactivar' : 'activar'} la ruta
                {/* <strong>
                  {
                    getPunto(rutaToDelete.origenId || rutaToDelete.origen?.id)
                      .nombre
                  }
                </strong>{" "}
                y{" "}
                <strong>
                  {
                    getPunto(rutaToDelete.destinoId || rutaToDelete.destino?.id)
                      .nombre
                  }
                </strong>
                ? */}
              </p>
            </div>
            <div className="modal-actions" style={{ padding: "20px 28px" }}>
              <button
                className="cancel-btn"
                onClick={() => setRutaToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{
                  background: rutaToDelete.estado ? "#ef4444" : "#10b981",
                  borderColor: rutaToDelete.estado ? "#ef4444" : "#10b981",
                  boxShadow: rutaToDelete.estado ? "0 4px 12px rgba(239, 68, 68, 0.25)" : "0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
                onClick={confirmDelete}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rutas;
