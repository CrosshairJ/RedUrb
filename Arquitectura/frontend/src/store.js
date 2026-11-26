import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "";

const socket = io(API_BASE || undefined, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
});

export const OPCIONES_ALERTA_DEFECTO = [
  "Tráfico / Retraso",
  "Falla mecánica",
  "Desvío de ruta",
  "Incidente con pasajero",
];

export const useTransporteStore = create(
  persist(
    (set, get) => {
      socket.on("estado_inicial", (data) => {
        if (!data) return;
        const rutasNuevas = data.rutas || [];
        const selActual = get().rutasSeleccionadas;
        const validas = selActual.filter((id) => rutasNuevas.some((r) => r.id === id));
        set({
          rutas: rutasNuevas,
          buses: data.buses || [],
          alertas: data.alertas || [],
          reportes: data.reportes || [],
          opcionesAlerta: data.opcionesAlerta || OPCIONES_ALERTA_DEFECTO,
          rutasSeleccionadas:
            validas.length > 0 ? validas : rutasNuevas.slice(0, 2).map((r) => r.id),
        });
      });

      socket.on("actualizacion_buses", (buses) => {
        if (Array.isArray(buses)) {
          set({ buses });
        }
      });

      socket.on("actualizacion_alertas", (alertas) => {
        if (Array.isArray(alertas)) {
          set({ alertas });
        }
      });

      socket.on("actualizacion_reportes", (reportes) => {
        if (Array.isArray(reportes)) {
          set({ reportes });
        }
      });

      socket.on("nueva_alerta", (alerta) => {
        if (!alerta) return;
        const actuales = get().alertas;
        if (!actuales.some((a) => a.id === alerta.id)) {
          set({ alertas: [alerta, ...actuales], avisoAlertaViva: alerta });
        }
      });

      return {
        usuario: null,
        error: null,
        temaOscuro: false,
        rutas: [],
        buses: [],
        alertas: [],
        reportes: [],
        conductores: [],
        avisoAlertaViva: null,
        opcionesAlerta: OPCIONES_ALERTA_DEFECTO,
        rutasSeleccionadas: ["1", "2"],

        toggleTema: () => set({ temaOscuro: !get().temaOscuro }),

        cerrarAvisoAlerta: () => set({ avisoAlertaViva: null }),

        toggleRuta: (rutaId) => {
          const actuales = get().rutasSeleccionadas;
          if (actuales.includes(rutaId)) {
            if (actuales.length <= 1) return;
            set({ rutasSeleccionadas: actuales.filter((id) => id !== rutaId) });
          } else {
            set({ rutasSeleccionadas: [...actuales, rutaId] });
          }
        },

        cargarInicial: async () => {
          try {
            const [resRutas, resEstado, resCond] = await Promise.all([
              fetch(`${API_BASE}/api/rutas`),
              fetch(`${API_BASE}/api/estado`),
              fetch(`${API_BASE}/api/conductores`),
            ]);
            if (resRutas.ok) {
              const rutas = await resRutas.json();
              const selActual = get().rutasSeleccionadas;
              const validas = selActual.filter((id) => rutas.some((r) => r.id === id));
              set({
                rutas,
                rutasSeleccionadas:
                  validas.length > 0 ? validas : rutas.slice(0, 2).map((r) => r.id),
              });
            }
            if (resEstado.ok) {
              const estado = await resEstado.json();
              set({
                buses: estado.buses || [],
                alertas: estado.alertas || [],
                reportes: estado.reportes || [],
                opcionesAlerta: estado.opcionesAlerta || OPCIONES_ALERTA_DEFECTO,
              });
            }
            if (resCond.ok) {
              const conductores = await resCond.json();
              set({ conductores });
            }
          } catch {}
        },

        cargarConductores: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/conductores`);
            if (res.ok) {
              const conductores = await res.json();
              set({ conductores });
            }
          } catch {}
        },

        setError: (error) => set({ error }),

        iniciarSesion: async (correo, clave) => {
          const emailNorm = (correo || "").trim();
          if (!emailNorm) {
            set({ error: "Ingresa tu correo electrónico." });
            return;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
            set({ error: "Ingresa un correo electrónico válido." });
            return;
          }
          if (!(clave || "").trim()) {
            set({ error: "Ingresa tu contraseña." });
            return;
          }
          try {
            set({ error: null });
            const res = await fetch(`${API_BASE}/api/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ correo: emailNorm, clave }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");
            if (data.rol === "Pasajero") {
              throw new Error(
                "Acceso web exclusivo para conductores y operadores. Ingresa desde la aplicación móvil.",
              );
            }
            set({ usuario: data });
            await get().cargarInicial();
          } catch (err) {
            set({ error: err.message || "No fue posible conectar con el servidor" });
          }
        },

        cerrarSesion: () => {
          set({ usuario: null, error: null, avisoAlertaViva: null });
        },

        crearConductor: async ({ nombre, correo, clave }) => {
          const res = await fetch(`${API_BASE}/api/conductores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, correo, clave }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "No se pudo crear el conductor");
          await get().cargarConductores();
          return data;
        },

        eliminarConductor: async (id) => {
          const res = await fetch(`${API_BASE}/api/conductores/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "No se pudo eliminar el conductor");
          await get().cargarInicial();
        },

        asignarConductorBus: async (busId, conductorNombre) => {
          const res = await fetch(`${API_BASE}/api/buses/${busId}/asignar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conductorNombre }),
          });
          if (!res.ok) throw new Error("No se pudo asignar el conductor");
          await get().cargarInicial();
        },

        cambiarEstadoBus: (busId, activo) => {
          socket.emit("cambiar_estado_bus", { busId, activo });
        },

        crearReporteOperativo: async ({ destinatario, accion, detalle, busId }) => {
          const { usuario } = get();
          const res = await fetch(`${API_BASE}/api/reportes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              autorNombre: usuario?.nombre || "Operador",
              destinatario,
              accion,
              detalle,
              busId,
            }),
          });
          if (!res.ok) throw new Error("No se pudo guardar el reporte");
          await get().cargarInicial();
        },
      };
    },
    {
      name: "transporte-storage",
      partialize: (state) => ({
        usuario: state.usuario,
        rutasSeleccionadas: state.rutasSeleccionadas,
        temaOscuro: state.temaOscuro,
      }),
    },
  ),
);
