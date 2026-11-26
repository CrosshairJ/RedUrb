import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { useTransporteStore } from "./store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BUS_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="3"/><path d="M3 11h18"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/><path d="M7 17v1"/><path d="M17 17v1"/></svg>`;

const ALERTA_SVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

const ICONO_BUS_RUTA = L.divIcon({
  className: "contenedor-icono-bus",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div class="cuadrado-icono-bus ruta">${BUS_SVG}</div>`,
});

const ICONO_BUS_PARADA = L.divIcon({
  className: "contenedor-icono-bus",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div class="cuadrado-icono-bus parada">${BUS_SVG}</div>`,
});

const ICONO_ALERTA = L.divIcon({
  className: "contenedor-icono-alerta",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div class="pin-alerta-mapa">${ALERTA_SVG}</div>`,
});

const ICONO_ALERTA_SELECCIONADA = L.divIcon({
  className: "contenedor-icono-alerta",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div class="pin-alerta-mapa seleccionada">${ALERTA_SVG}</div>`,
});

function IconoNav({ tipo }) {
  if (tipo === "rutas") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    );
  }
  if (tipo === "vehiculos") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="13" rx="3" />
        <path d="M3 11h18" />
        <circle cx="7.5" cy="19.5" r="1.5" />
        <circle cx="16.5" cy="19.5" r="1.5" />
      </svg>
    );
  }
  if (tipo === "incidentes") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (tipo === "personal") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconoTema({ oscuro }) {
  if (oscuro) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function App() {
  const {
    usuario,
    error,
    temaOscuro,
    rutas,
    buses,
    alertas,
    reportes,
    conductores,
    avisoAlertaViva,
    opcionesAlerta,
    rutasSeleccionadas,
    toggleTema,
    cerrarAvisoAlerta,
    toggleRuta,
    cargarInicial,
    iniciarSesion,
    cerrarSesion,
    crearConductor,
    eliminarConductor,
    asignarConductorBus,
    cambiarEstadoBus,
    crearReporteOperativo,
  } = useTransporteStore();

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const [seccionActiva, setSeccionActiva] = useState("rutas");
  const [barraExpandida, setBarraExpandida] = useState(true);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [busDetalleId, setBusDetalleId] = useState(null);
  const [busDetalleModo, setBusDetalleModo] = useState("alertas");
  const [alertaMapaSeleccionada, setAlertaMapaSeleccionada] = useState(null);

  const [nuevoNombreCond, setNuevoNombreCond] = useState("");
  const [nuevoCorreoCond, setNuevoCorreoCond] = useState("");
  const [nuevaClaveCond, setNuevaClaveCond] = useState("");
  const [avisoGestion, setAvisoGestion] = useState(null);
  const [asignacionesBus, setAsignacionesBus] = useState({});

  const [repDestinatario, setRepDestinatario] = useState("");
  const [repBusId, setRepBusId] = useState("A");
  const [repAccion, setRepAccion] = useState("");
  const [repDetalle, setRepDetalle] = useState("");
  const [avisoReporte, setAvisoReporte] = useState(null);

  const conductorDestinoActual = conductores.some((c) => c.nombre === repDestinatario)
    ? repDestinatario
    : conductores[0]?.nombre || "";

  useEffect(() => {
    if (usuario) {
      cargarInicial();
    }
  }, [usuario, cargarInicial]);

  useEffect(() => {
    if (usuario?.rol === "Pasajero") {
      cerrarSesion();
    }
  }, [usuario, cerrarSesion]);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    await iniciarSesion(correo, clave);
  };

  if (!usuario) {
    return (
      <div className={`contenedor-login ${temaOscuro ? "tema-oscuro" : ""}`}>
        <div className="barra-login-superior">
          <div className="marca-login-top">
            <div className="emblema-marca-sm">RU</div>
            <div>
              <span className="marca-editorial">RED URBANA</span>
              <span className="submarca-editorial">Talca · Movilidad</span>
            </div>
          </div>
          <button type="button" className="btn-tema-pill" onClick={toggleTema}>
            <IconoTema oscuro={temaOscuro} />
            <span>{temaOscuro ? "Modo Día" : "Modo Noche"}</span>
          </button>
        </div>

        <div className="tarjeta-login">
          <div className="cabecera-login">
            <div className="marca-login-emblema">RU</div>
            <h1>RED URBANA</h1>
            <p>Centro de Control Operativo · Acceso exclusivo para personal y conductores</p>
          </div>

          <form className="formulario-login" onSubmit={handleSubmitLogin} noValidate>
            <div className="grupo-input">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="usuario@app.cl"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="grupo-input">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>

            {error && <div className="alerta-error">{error}</div>}

            <button type="submit" className="btn-ingresar">
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  const esOperador = usuario.rol === "Operador";
  const busesActivos = buses.filter((b) => b.activo);
  const rutasVisibles =
    seccionActiva === "incidentes"
      ? rutas
      : rutas.filter((r) => rutasSeleccionadas.includes(r.id));

  const busesVisiblesEnMapa =
    seccionActiva === "rutas"
      ? busesActivos.filter((b) => rutasSeleccionadas.includes(b.linea))
      : [];

  const paraderosUnicos = [];
  const idsParaderos = new Set();
  for (const r of rutasVisibles) {
    for (const p of r.paraderos || []) {
      if (!idsParaderos.has(p.id)) {
        idsParaderos.add(p.id);
        paraderosUnicos.push({ ...p, linea: r.id, color: r.color });
      }
    }
  }

  const busDetalle = buses.find((b) => b.id === busDetalleId) || null;
  const alertasBusDetalle = busDetalle ? alertas.filter((a) => a.busId === busDetalle.id) : [];

  const cambiarSeccion = (sec) => {
    setSeccionActiva(sec);
    setBusDetalleId(null);
    if (sec !== "incidentes") {
      setAlertaMapaSeleccionada(null);
    }
    setMenuMovilAbierto(false);
  };

  const abrirDetalleBus = (id, modo) => {
    setBusDetalleId(id);
    setBusDetalleModo(modo);
  };

  const handleCrearConductor = async (e) => {
    e.preventDefault();
    const nombreLimpio = nuevoNombreCond.trim();
    const correoLimpio = nuevoCorreoCond.trim().toLowerCase();
    const claveLimpia = nuevaClaveCond.trim();

    if (nombreLimpio.length < 2) {
      setAvisoGestion({ tipo: "error", texto: "Ingresa el nombre completo del conductor." });
      return;
    }
    if (!correoLimpio || !EMAIL_REGEX.test(correoLimpio)) {
      setAvisoGestion({ tipo: "error", texto: "Ingresa un correo electrónico válido." });
      return;
    }
    if (claveLimpia.length < 3) {
      setAvisoGestion({
        tipo: "error",
        texto: "La contraseña debe tener al menos 3 caracteres.",
      });
      return;
    }

    try {
      await crearConductor({
        nombre: nombreLimpio,
        correo: correoLimpio,
        clave: claveLimpia,
      });
      setNuevoNombreCond("");
      setNuevoCorreoCond("");
      setNuevaClaveCond("");
      setAvisoGestion({ tipo: "ok", texto: "Conductor creado correctamente." });
    } catch (err) {
      setAvisoGestion({ tipo: "error", texto: err.message });
    }
  };

  const handleEliminarConductor = async (cond) => {
    setAvisoGestion(null);
    try {
      await eliminarConductor(cond.id);
      setAvisoGestion({ tipo: "ok", texto: `Conductor ${cond.nombre} eliminado.` });
    } catch (err) {
      setAvisoGestion({ tipo: "error", texto: err.message });
    }
  };

  const handleAsignarConductor = async (busId, fallbackNombre) => {
    const seleccionado = asignacionesBus[busId] ?? fallbackNombre;
    if (!seleccionado) {
      setAvisoGestion({ tipo: "error", texto: "Selecciona un conductor válido para asignar." });
      return;
    }
    try {
      await asignarConductorBus(busId, seleccionado);
      setAvisoGestion({ tipo: "ok", texto: `Conductor asignado a Bus ${busId}.` });
    } catch (err) {
      setAvisoGestion({ tipo: "error", texto: err.message });
    }
  };

  const handleCrearReporte = async (e) => {
    e.preventDefault();
    if (!conductorDestinoActual) {
      setAvisoReporte({ tipo: "error", texto: "Selecciona un conductor destinatario." });
      return;
    }
    if (!repAccion.trim()) {
      setAvisoReporte({ tipo: "error", texto: "Ingresa la acción operativa a realizar." });
      return;
    }
    if (!repDetalle.trim()) {
      setAvisoReporte({ tipo: "error", texto: "Ingresa el detalle del reporte." });
      return;
    }
    try {
      await crearReporteOperativo({
        destinatario: conductorDestinoActual,
        busId: repBusId,
        accion: repAccion.trim(),
        detalle: repDetalle.trim(),
      });
      setRepAccion("");
      setRepDetalle("");
      setAvisoReporte({
        tipo: "ok",
        texto: `Reporte enviado a ${conductorDestinoActual}.`,
      });
    } catch (err) {
      setAvisoReporte({ tipo: "error", texto: err.message });
    }
  };

  const obtenerEstiloBus = (bus) => {
    if (!bus.activo) return "estado-inactivo";
    if (bus.enParada) return "estado-parada";
    return "estado-ruta";
  };

  return (
    <div className={`layout-principal ${temaOscuro ? "tema-oscuro" : ""}`}>
      <header className="barra-superior">
        <div className="marca-sistema">
          <button
            type="button"
            className="btn-hamburguesa"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            aria-label="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="emblema-marca-lg">RU</div>
          <div className="bloque-titulo-marca">
            <h1>RED URBANA</h1>
            <span>Talca · Control Operativo</span>
          </div>
        </div>

        <div className="info-operador">
          <div className="usuario-pill-top">
            <span className="texto-operador">{usuario.nombre}</span>
            <span className="badge-rol">{usuario.rol}</span>
          </div>
          <button type="button" onClick={toggleTema} className="btn-tema-pill">
            <IconoTema oscuro={temaOscuro} />
            <span>{temaOscuro ? "Modo Día" : "Modo Noche"}</span>
          </button>
          <button type="button" onClick={cerrarSesion} className="btn-salir">
            Cerrar sesión
          </button>
        </div>
      </header>

      {avisoAlertaViva && (
        <div className="toast-alerta-viva">
          <div className="toast-alerta-icono">!</div>
          <div className="toast-alerta-cuerpo">
            <div className="toast-alerta-top">
              <strong>{avisoAlertaViva.tipo}</strong>
              <span>{avisoAlertaViva.hora}</span>
            </div>
            <p>
              Bus {avisoAlertaViva.busId} · {avisoAlertaViva.descripcion}
            </p>
          </div>
          <button
            type="button"
            className="toast-alerta-ir"
            onClick={() => {
              setAlertaMapaSeleccionada(avisoAlertaViva);
              cambiarSeccion("incidentes");
              cerrarAvisoAlerta();
            }}
          >
            Ver
          </button>
          <button type="button" className="toast-alerta-cerrar" onClick={cerrarAvisoAlerta}>
            ×
          </button>
        </div>
      )}

      <div className="cuerpo-dashboard">
        <aside
          className={`menu-lateral ${barraExpandida ? "expandida" : "compacta"} ${
            menuMovilAbierto ? "abierto-movil" : ""
          }`}
        >
          <div className="cabecera-barra-lateral">
            {barraExpandida && <span className="etiqueta-menu-lateral">Navegación</span>}
            <button
              type="button"
              className="btn-expandir-barra"
              onClick={() => setBarraExpandida(!barraExpandida)}
              title={barraExpandida ? "Contraer barra" : "Expandir barra"}
            >
              {barraExpandida ? "«" : "»"}
            </button>
          </div>

          <nav className="lista-navegacion">
            <button
              className={`item-nav item-nav-rutas ${seccionActiva === "rutas" ? "activo" : ""}`}
              onClick={() => cambiarSeccion("rutas")}
              title="Rutas"
            >
              <span className="nav-contenido-izq">
                <IconoNav tipo="rutas" />
                {barraExpandida && <span>Rutas</span>}
              </span>
              {barraExpandida && <span className="etiqueta-principal-nav">Activa</span>}
            </button>

            <button
              className={seccionActiva === "vehiculos" ? "item-nav activo" : "item-nav"}
              onClick={() => cambiarSeccion("vehiculos")}
              title="Vehículos"
            >
              <span className="nav-contenido-izq">
                <IconoNav tipo="vehiculos" />
                {barraExpandida && <span>Vehículos</span>}
              </span>
            </button>

            <button
              className={seccionActiva === "incidentes" ? "item-nav activo" : "item-nav"}
              onClick={() => cambiarSeccion("incidentes")}
              title="Incidentes"
            >
              <span className="nav-contenido-izq">
                <IconoNav tipo="incidentes" />
                {barraExpandida && <span>Incidentes</span>}
              </span>
            </button>

            {esOperador ? (
              <>
                <button
                  className={seccionActiva === "personal" ? "item-nav activo" : "item-nav"}
                  onClick={() => cambiarSeccion("personal")}
                  title="Conductores"
                >
                  <span className="nav-contenido-izq">
                    <IconoNav tipo="personal" />
                    {barraExpandida && <span>Conductores</span>}
                  </span>
                </button>
                <button
                  className={seccionActiva === "reportes" ? "item-nav activo" : "item-nav"}
                  onClick={() => cambiarSeccion("reportes")}
                  title="Reportes"
                >
                  <span className="nav-contenido-izq">
                    <IconoNav tipo="reportes" />
                    {barraExpandida && <span>Reportes</span>}
                  </span>
                </button>
              </>
            ) : (
              <button
                className={seccionActiva === "tus_reportes" ? "item-nav activo" : "item-nav"}
                onClick={() => cambiarSeccion("tus_reportes")}
                title="Tus Reportes"
              >
                <span className="nav-contenido-izq">
                  <IconoNav tipo="reportes" />
                  {barraExpandida && <span>Tus Reportes</span>}
                </span>
              </button>
            )}
          </nav>

          {barraExpandida && seccionActiva === "rutas" && (
            <div className="panel-catalogo-rutas">
              <span className="titulo-seccion-lateral">Líneas activas</span>
              {rutas.map((r) => {
                const seleccionada = rutasSeleccionadas.includes(r.id);
                const activosEnLinea = busesActivos.filter((b) => b.linea === r.id).length;
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRuta(r.id)}
                    className={`tarjeta-ruta-item ${seleccionada ? "seleccionada" : ""}`}
                  >
                    <div className="cabecera-ruta-item">
                      <span className="indicador-color-ruta" style={{ backgroundColor: r.color }} />
                      <strong>Línea {r.id}</strong>
                      <span className="meta-ruta-corta">{activosEnLinea} en ruta</span>
                      <span className={seleccionada ? "tag-ruta activa" : "tag-ruta inactiva"}>
                        {seleccionada ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {barraExpandida && seccionActiva === "incidentes" && (
            <div className="panel-catalogo-rutas">
              <span className="titulo-seccion-lateral">Alertas en mapa</span>
              <div className="resumen-lateral-incidentes">
                <span>Registradas</span>
                <strong>{alertas.length}</strong>
              </div>
            </div>
          )}
        </aside>

        <main className="zona-mapa">
          {seccionActiva === "vehiculos" && (
            busDetalle ? (
              <div className="panel-detalle-alertas-completo">
                <div className="cabecera-detalle-completo">
                  <div>
                    <span className="subtitulo-detalle">Detalle de unidad</span>
                    <h2>
                      Bus {busDetalle.id} — {busDetalle.nombreLinea}
                    </h2>
                  </div>
                  <div className="acciones-cabecera-detalle">
                    <span
                      className={`pill-estado ${
                        !busDetalle.activo
                          ? "inactivo"
                          : busDetalle.enParada
                            ? "parada"
                            : "activo"
                      }`}
                    >
                      {busDetalle.activo ? busDetalle.estado : "Inactivo"}
                    </span>
                    {esOperador && (
                      <button
                        type="button"
                        className={`btn-toggle-bus ${busDetalle.activo ? "parar" : "iniciar"}`}
                        onClick={() => cambiarEstadoBus(busDetalle.id, !busDetalle.activo)}
                      >
                        {busDetalle.activo ? "Desactivar" : "Activar"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-volver-vehiculos"
                      onClick={() => setBusDetalleId(null)}
                    >
                      Volver a vehículos
                    </button>
                  </div>
                </div>

                <div className="grilla-info-bus-completo">
                  <div className="caja-dato-completo">
                    <span>Conductor asignado</span>
                    <strong>{busDetalle.conductorNombre}</strong>
                  </div>
                  <div className="caja-dato-completo">
                    <span>Estado actual</span>
                    <strong>
                      {busDetalle.activo
                        ? `${busDetalle.estado} (${busDetalle.destino})`
                        : "Inactivo"}
                    </strong>
                  </div>
                  <div className="caja-dato-completo">
                    <span>Total pasajeros</span>
                    <strong>{(busDetalle.pasajeros || []).length}</strong>
                  </div>
                </div>

                <div className="tabs-detalle-bus">
                  <button
                    type="button"
                    className={`tab-detalle-btn ${busDetalleModo === "alertas" ? "activo" : ""}`}
                    onClick={() => setBusDetalleModo("alertas")}
                  >
                    Alertas ({alertasBusDetalle.length})
                  </button>
                  <button
                    type="button"
                    className={`tab-detalle-btn ${busDetalleModo === "pasajeros" ? "activo" : ""}`}
                    onClick={() => setBusDetalleModo("pasajeros")}
                  >
                    Pasajeros ({(busDetalle.pasajeros || []).length})
                  </button>
                </div>

                {busDetalleModo === "alertas" ? (
                  <div className="contenedor-lista-alertas-bus">
                    {alertasBusDetalle.length === 0 ? (
                      <div className="sin-alertas-caja">
                        Este vehículo no registra alertas hasta el momento.
                      </div>
                    ) : (
                      <div className="lista-alertas-cards">
                        {alertasBusDetalle.map((alerta) => (
                          <div key={alerta.id} className="item-alerta-completa">
                            <div className="cabecera-item-alerta">
                              <strong>{alerta.tipo}</strong>
                              <span>{alerta.hora}</span>
                            </div>
                            <p>{alerta.descripcion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="contenedor-lista-alertas-bus">
                    {(busDetalle.pasajeros || []).length === 0 ? (
                      <div className="sin-alertas-caja">
                        No hay pasajeros a bordo en este momento.
                      </div>
                    ) : (
                      <div className="lista-alertas-cards">
                        {busDetalle.pasajeros.map((pasajero, idx) => (
                          <div key={`${pasajero}-${idx}`} className="item-pasajero-completo">
                            <span className="indice-pasajero">{idx + 1}</span>
                            <strong>{pasajero}</strong>
                            <span className="estado-a-bordo-pill">A bordo</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-vehiculos">
                <div className="cabecera-panel-vehiculos">
                  <div>
                    <h2>Vehículos de la Red</h2>
                    <p>Supervisión operativa de flota, pasajeros y alertas</p>
                  </div>
                  <div className="pill-vehiculos-activos">
                    <span>Vehículos activos</span>
                    <strong>{busesActivos.length}</strong>
                  </div>
                </div>

                <div className="grilla-vehiculos-abierta">
                  {buses.map((bus) => {
                    const cantidadAlertasBus = alertas.filter((a) => a.busId === bus.id).length;
                    const totalPasajeros = (bus.pasajeros || []).length;
                    const rutaColor = rutas.find((r) => r.id === bus.linea)?.color || "#111827";

                    return (
                      <div
                        key={bus.id}
                        className={`tarjeta-vehiculo-abierta ${obtenerEstiloBus(bus)}`}
                        style={{ borderTopColor: rutaColor }}
                      >
                        <div className="fila-principal-badge">
                          <div className="identificador-badge">
                            <span className="icono-bus-badge" style={{ backgroundColor: rutaColor }}>
                              BUS
                            </span>
                            <div>
                              <strong>Bus {bus.id}</strong>
                              <span>{bus.nombreLinea}</span>
                            </div>
                          </div>

                          <div className="estado-badges-derecha">
                            <span className="pill-alerta-conteo">
                              {cantidadAlertasBus} alertas
                            </span>
                            <span
                              className={`pill-estado ${
                                !bus.activo ? "inactivo" : bus.enParada ? "parada" : "activo"
                              }`}
                            >
                              {bus.activo ? bus.estado : "Inactivo"}
                            </span>
                          </div>
                        </div>

                        <div className="detalle-expandido-vehiculo">
                          <div className="fila-detalle-expandido">
                            <span>Conductor</span>
                            <strong>{bus.conductorNombre}</strong>
                          </div>
                          <div className="fila-detalle-expandido">
                            <span>Destino</span>
                            <strong>
                              {bus.activo
                                ? `${bus.destino} (${bus.segundosParaLlegar}s)`
                                : "Unidad detenida"}
                            </strong>
                          </div>
                          <div className="fila-detalle-expandido">
                            <span>Pasajeros</span>
                            <strong>{totalPasajeros}</strong>
                          </div>

                          <div className="acciones-tarjeta-vehiculo">
                            {esOperador && (
                              <button
                                type="button"
                                className={`btn-toggle-bus ${bus.activo ? "parar" : "iniciar"}`}
                                onClick={() => cambiarEstadoBus(bus.id, !bus.activo)}
                              >
                                {bus.activo ? "Desactivar" : "Activar"}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-ver-alertas"
                              onClick={() => abrirDetalleBus(bus.id, "alertas")}
                            >
                              Alertas
                            </button>
                            <button
                              type="button"
                              className="btn-ver-pasajeros"
                              onClick={() => abrirDetalleBus(bus.id, "pasajeros")}
                            >
                              Pasajeros
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="resumen-inferior-alertas">
                  <div className="tarjeta-info-estatica total">
                    <span>Alertas totales</span>
                    <strong>{alertas.length}</strong>
                  </div>
                  {opcionesAlerta.map((opcion) => {
                    const totalOpcion = alertas.filter((a) => a.tipo === opcion).length;
                    return (
                      <div key={opcion} className="tarjeta-info-estatica">
                        <span>{opcion}</span>
                        <strong>{totalOpcion}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {esOperador && seccionActiva === "personal" && (
            <div className="panel-gestion-operador">
              <div className="cabecera-panel-vehiculos">
                <div>
                  <h2>Gestión de Conductores</h2>
                  <p>Crea cuentas de conductores, asígnalos a vehículos o elimínalos</p>
                </div>
                <div className="pill-vehiculos-activos">
                  <span>Conductores</span>
                  <strong>{conductores.length}</strong>
                </div>
              </div>

              {avisoGestion && (
                <div className={`aviso-gestion ${avisoGestion.tipo}`}>{avisoGestion.texto}</div>
              )}

              <div className="grilla-gestion-dos">
                <form className="caja-gestion" onSubmit={handleCrearConductor} noValidate>
                  <h3>Nuevo Conductor</h3>
                  <div className="grupo-input">
                    <label>Nombre completo</label>
                    <input
                      type="text"
                      placeholder="Nombre del conductor"
                      value={nuevoNombreCond}
                      onChange={(e) => setNuevoNombreCond(e.target.value)}
                    />
                  </div>
                  <div className="grupo-input">
                    <label>Correo</label>
                    <input
                      type="email"
                      placeholder="conductor@app.cl"
                      value={nuevoCorreoCond}
                      onChange={(e) => setNuevoCorreoCond(e.target.value)}
                    />
                  </div>
                  <div className="grupo-input">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      placeholder="Mínimo 3 caracteres"
                      value={nuevaClaveCond}
                      onChange={(e) => setNuevaClaveCond(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-ingresar">
                    Crear Conductor
                  </button>
                </form>

                <div className="caja-gestion">
                  <h3>Asignación a Vehículos</h3>
                  <div className="lista-asignacion">
                    {buses.map((bus) => {
                      const valorActual = asignacionesBus[bus.id] ?? bus.conductorNombre;
                      return (
                        <div key={bus.id} className="fila-asignacion-bus">
                          <div>
                            <strong>Bus {bus.id}</strong>
                            <span>{bus.nombreLinea}</span>
                          </div>
                          <select
                            value={valorActual}
                            onChange={(e) =>
                              setAsignacionesBus({ ...asignacionesBus, [bus.id]: e.target.value })
                            }
                          >
                            <option value="Sin asignar">Sin asignar</option>
                            {conductores.map((c) => (
                              <option key={c.id} value={c.nombre}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-asignar"
                            onClick={() => handleAsignarConductor(bus.id, bus.conductorNombre)}
                          >
                            Asignar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="caja-gestion">
                <h3>Conductores Registrados</h3>
                <div className="lista-conductores-tabla">
                  {conductores.map((c) => (
                    <div key={c.id} className="fila-conductor-registrado">
                      <div>
                        <strong>{c.nombre}</strong>
                        <span>{c.correo}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-eliminar-cond"
                        onClick={() => handleEliminarConductor(c)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {esOperador && seccionActiva === "reportes" && (
            <div className="panel-gestion-operador">
              <div className="cabecera-panel-vehiculos">
                <div>
                  <h2>Reportes y Acciones Operativas</h2>
                  <p>Emite instrucciones directas a un conductor específico</p>
                </div>
                <div className="pill-vehiculos-activos">
                  <span>Emitidos</span>
                  <strong>{reportes.length}</strong>
                </div>
              </div>

              {avisoReporte && (
                <div className={`aviso-gestion ${avisoReporte.tipo}`}>{avisoReporte.texto}</div>
              )}

              <div className="grilla-gestion-dos">
                <form className="caja-gestion" onSubmit={handleCrearReporte} noValidate>
                  <h3>Generar Reporte / Acción</h3>
                  <div className="grupo-input">
                    <label>Conductor destinatario</label>
                    <select
                      value={conductorDestinoActual}
                      onChange={(e) => setRepDestinatario(e.target.value)}
                    >
                      {conductores.length === 0 ? (
                        <option value="">Sin conductores registrados</option>
                      ) : (
                        conductores.map((c) => (
                          <option key={c.id} value={c.nombre}>
                            {c.nombre} ({c.correo})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="grupo-input">
                    <label>Vehículo relacionado</label>
                    <select value={repBusId} onChange={(e) => setRepBusId(e.target.value)}>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          Bus {b.id} ({b.conductorNombre})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grupo-input">
                    <label>Acción a realizar</label>
                    <input
                      type="text"
                      placeholder="Ej: Revisión mecánica en terminal"
                      value={repAccion}
                      onChange={(e) => setRepAccion(e.target.value)}
                    />
                  </div>
                  <div className="grupo-input">
                    <label>Detalle del informe</label>
                    <input
                      type="text"
                      placeholder="Instrucciones u observaciones"
                      value={repDetalle}
                      onChange={(e) => setRepDetalle(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-ingresar">
                    Emitir Reporte
                  </button>
                </form>

                <div className="caja-gestion">
                  <h3>Historial de Reportes</h3>
                  <div className="lista-reportes-emitidos">
                    {reportes.length === 0 ? (
                      <div className="sin-alertas-caja">
                        No hay reportes operativos emitidos aún.
                      </div>
                    ) : (
                      reportes.map((rep) => (
                        <div key={rep.id} className="item-alerta-completa">
                          <div className="cabecera-item-alerta">
                            <strong>
                              {rep.accion} · Bus {rep.busId}
                            </strong>
                            <span>{rep.hora}</span>
                          </div>
                          <p>
                            Para: <strong>{rep.destinatario}</strong> — Por: {rep.autorNombre}
                          </p>
                          <p>{rep.detalle}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!esOperador && seccionActiva === "tus_reportes" && (
            <div className="panel-gestion-operador">
              <div className="cabecera-panel-vehiculos">
                <div>
                  <h2>Tus Reportes</h2>
                  <p>Instrucciones y reportes operativos asignados a {usuario.nombre}</p>
                </div>
                <div className="pill-vehiculos-activos">
                  <span>Recibidos</span>
                  <strong>
                    {
                      reportes.filter(
                        (r) => r.destinatario.toLowerCase() === usuario.nombre.toLowerCase(),
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="lista-reportes-emitidos">
                {reportes.filter(
                  (r) => r.destinatario.toLowerCase() === usuario.nombre.toLowerCase(),
                ).length === 0 ? (
                  <div className="sin-alertas-caja">
                    No tienes reportes asignados por el operador en este momento.
                  </div>
                ) : (
                  reportes
                    .filter((r) => r.destinatario.toLowerCase() === usuario.nombre.toLowerCase())
                    .map((rep) => (
                      <div key={rep.id} className="item-alerta-completa">
                        <div className="cabecera-item-alerta">
                          <strong>
                            {rep.accion} · Bus {rep.busId}
                          </strong>
                          <span>{rep.hora}</span>
                        </div>
                        <p>
                          Enviado por: <strong>{rep.autorNombre}</strong>
                        </p>
                        <p>{rep.detalle}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {(seccionActiva === "rutas" || seccionActiva === "incidentes") && (
            <>
              {seccionActiva === "rutas" && (
                <div className="indicador-superior-mapa">
                  <span className="punto-activo-indicador"></span>
                  <span>Vehículos activos</span>
                  <strong>{busesActivos.length}</strong>
                </div>
              )}

              {seccionActiva === "incidentes" && alertaMapaSeleccionada && (
                <div className="popover-alerta-bonito">
                  <div className="popover-alerta-cabecera">
                    <span className="popover-alerta-badge">{alertaMapaSeleccionada.tipo}</span>
                    <span className="popover-alerta-hora">{alertaMapaSeleccionada.hora}</span>
                    <button
                      type="button"
                      className="popover-alerta-cerrar"
                      onClick={() => setAlertaMapaSeleccionada(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="popover-alerta-meta">
                    <strong>Bus {alertaMapaSeleccionada.busId}</strong>
                    <span>{alertaMapaSeleccionada.conductorNombre}</span>
                  </div>
                  <p className="popover-alerta-desc">{alertaMapaSeleccionada.descripcion}</p>
                </div>
              )}

              <MapContainer center={[-35.4264, -71.6554]} zoom={15} className="visor-leaflet">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {rutasVisibles.map((ruta) => (
                  <Polyline
                    key={ruta.id}
                    positions={ruta.coordenadas}
                    pathOptions={{
                      color: ruta.color,
                      weight: 5,
                      opacity: 0.85,
                    }}
                  >
                    <Tooltip sticky>
                      <strong>{ruta.nombre}</strong>
                    </Tooltip>
                  </Polyline>
                ))}

                {seccionActiva === "rutas" &&
                  paraderosUnicos.map((paradero) => (
                    <CircleMarker
                      key={paradero.id}
                      center={[paradero.lat, paradero.lng]}
                      radius={6}
                      pathOptions={{
                        color: "#ffffff",
                        fillColor: "#18181b",
                        fillOpacity: 1,
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="top">
                        {paradero.nombre} — Línea {paradero.linea}
                      </Tooltip>
                    </CircleMarker>
                  ))}

                {seccionActiva === "rutas" &&
                  busesVisiblesEnMapa.map((bus) => (
                    <Marker
                      key={bus.id}
                      position={[bus.lat, bus.lng]}
                      icon={bus.enParada ? ICONO_BUS_PARADA : ICONO_BUS_RUTA}
                    >
                      <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -20]}
                        className="tooltip-bus-flotante"
                      >
                        <div className={`tarjeta-flotante-bus ${bus.enParada ? "parada" : "ruta"}`}>
                          <div className="cabecera-flotante-bus">
                            <span className="id-bus-flotante">Bus {bus.id}</span>
                            <span className="badge-linea-bus">{bus.nombreLinea}</span>
                          </div>
                          <div className="estado-bus-flotante">
                            {bus.estado} · {bus.segundosParaLlegar}s
                          </div>
                          <div className="pasajero-bus-flotante">Destino: {bus.destino}</div>
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}

                {seccionActiva === "incidentes" &&
                  alertas.map((alerta) => (
                    <Marker
                      key={alerta.id}
                      position={[alerta.lat, alerta.lng]}
                      icon={
                        alertaMapaSeleccionada?.id === alerta.id
                          ? ICONO_ALERTA_SELECCIONADA
                          : ICONO_ALERTA
                      }
                      eventHandlers={{
                        click: () => setAlertaMapaSeleccionada(alerta),
                      }}
                    />
                  ))}
              </MapContainer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
