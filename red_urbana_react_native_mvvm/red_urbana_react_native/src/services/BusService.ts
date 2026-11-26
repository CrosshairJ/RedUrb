import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import { Bus, DriverReport, RouteLine, ServiceAlert, Stop } from "../models";

const BASE_URL = API_BASE_URL;

export const socket: Socket = io(BASE_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
});

type RawBus = {
  id: string;
  linea: string;
  nombreLinea: string;
  conductorNombre: string;
  activo: boolean;
  estado: string;
  destino: string;
  segundosParaLlegar: number;
  enParada: boolean;
  paraderoActualId: string | null;
  paraderoActualNombre: string | null;
  lat: number;
  lng: number;
  pasajeros?: string[];
};

type RawRuta = {
  id: string;
  nombre: string;
  color: string;
  paraderos: { id: string; nombre: string; lat: number; lng: number; index: number }[];
  coordenadas: [number, number][];
};

const mapBus = (raw: RawBus): Bus => ({
  id: raw.id,
  linea: raw.linea,
  line: raw.nombreLinea || `Línea ${raw.linea}`,
  conductorNombre: raw.conductorNombre || "Sin asignar",
  destination: raw.destino || "Sin destino",
  seconds: raw.segundosParaLlegar ?? 0,
  active: Boolean(raw.activo),
  status: raw.estado || (raw.activo ? "En ruta" : "Inactivo"),
  inStop: Boolean(raw.enParada),
  currentStopId: raw.paraderoActualId || null,
  currentStopName: raw.paraderoActualNombre || null,
  passengers: raw.pasajeros || [],
  coordinate: {
    latitude: raw.lat,
    longitude: raw.lng,
  },
});

const mapRuta = (raw: RawRuta): RouteLine => ({
  id: raw.id,
  nombre: raw.nombre,
  color: raw.color,
  paraderos: (raw.paraderos || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    index: p.index,
    coordinate: { latitude: p.lat, longitude: p.lng },
  })),
  coordenadas: (raw.coordenadas || []).map(([latitude, longitude]) => ({ latitude, longitude })),
});

let busesState: Bus[] = [];
let routesState: RouteLine[] = [];
let selectedStopState: Stop | null = null;

type BusListener = (buses: Bus[]) => void;
type RouteListener = (routes: RouteLine[]) => void;
type StopListener = (stop: Stop | null) => void;
type BoardingListener = (res: { ok: boolean; mensaje: string; busId?: string }) => void;

const busListeners = new Set<BusListener>();
const routeListeners = new Set<RouteListener>();
const stopListeners = new Set<StopListener>();
const boardingListeners = new Set<BoardingListener>();

let alertsState: ServiceAlert[] = [];
let reportsState: DriverReport[] = [];
let alertOptionsState: string[] = [
  "Tráfico / Retraso",
  "Falla mecánica",
  "Desvío de ruta",
  "Incidente con pasajero",
];
type AlertListener = (alerts: ServiceAlert[]) => void;
type ReportListener = (reports: DriverReport[]) => void;
const alertListeners = new Set<AlertListener>();
const reportListeners = new Set<ReportListener>();

const notifyBuses = () => busListeners.forEach((fn) => fn(busesState));
const notifyRoutes = () => routeListeners.forEach((fn) => fn(routesState));
const notifyStop = () => stopListeners.forEach((fn) => fn(selectedStopState));
const notifyAlerts = () => alertListeners.forEach((fn) => fn(alertsState));
const notifyReports = () => reportListeners.forEach((fn) => fn(reportsState));

socket.on("estado_inicial", (data: {
  rutas?: RawRuta[];
  buses?: RawBus[];
  alertas?: ServiceAlert[];
  reportes?: DriverReport[];
  opcionesAlerta?: string[];
}) => {
  if (!data) return;
  if (Array.isArray(data.rutas)) {
    routesState = data.rutas.map(mapRuta);
    notifyRoutes();
  }
  if (Array.isArray(data.buses)) {
    busesState = data.buses.map(mapBus);
    notifyBuses();
  }
  if (Array.isArray(data.alertas)) {
    alertsState = data.alertas;
    notifyAlerts();
  }
  if (Array.isArray(data.reportes)) {
    reportsState = data.reportes;
    notifyReports();
  }
  if (Array.isArray(data.opcionesAlerta) && data.opcionesAlerta.length > 0) {
    alertOptionsState = data.opcionesAlerta;
  }
});

socket.on("actualizacion_buses", (buses: RawBus[]) => {
  if (!Array.isArray(buses)) return;
  busesState = buses.map(mapBus);
  notifyBuses();
});

socket.on("actualizacion_alertas", (alertas: ServiceAlert[]) => {
  if (!Array.isArray(alertas)) return;
  alertsState = alertas;
  notifyAlerts();
});

socket.on("actualizacion_reportes", (reportes: DriverReport[]) => {
  if (!Array.isArray(reportes)) return;
  reportsState = reportes;
  notifyReports();
});

socket.on("nueva_alerta", (alerta: ServiceAlert) => {
  if (!alerta) return;
  if (!alertsState.some((a) => a.id === alerta.id)) {
    alertsState = [alerta, ...alertsState];
    notifyAlerts();
  }
});

socket.on("respuesta_abordaje", (res: { ok: boolean; mensaje: string; busId?: string }) => {
  if (!res) return;
  boardingListeners.forEach((fn) => fn(res));
});

export const BusService = {
  async loadInitial(): Promise<void> {
    try {
      const [rRes, eRes] = await Promise.all([
        fetch(`${BASE_URL}/api/rutas`),
        fetch(`${BASE_URL}/api/estado`),
      ]);
      if (rRes.ok) {
        const rawRutas = (await rRes.json()) as RawRuta[];
        routesState = rawRutas.map(mapRuta);
        notifyRoutes();
      }
      if (eRes.ok) {
        const estado = (await eRes.json()) as {
          buses?: RawBus[];
          alertas?: ServiceAlert[];
          reportes?: DriverReport[];
          opcionesAlerta?: string[];
        };
        if (Array.isArray(estado.buses)) {
          busesState = estado.buses.map(mapBus);
          notifyBuses();
        }
        if (Array.isArray(estado.alertas)) {
          alertsState = estado.alertas;
          notifyAlerts();
        }
        if (Array.isArray(estado.reportes)) {
          reportsState = estado.reportes;
          notifyReports();
        }
        if (Array.isArray(estado.opcionesAlerta) && estado.opcionesAlerta.length > 0) {
          alertOptionsState = estado.opcionesAlerta;
        }
      }
    } catch {}
  },

  getBuses(): Bus[] {
    return busesState;
  },

  getRoutes(): RouteLine[] {
    return routesState;
  },

  getSelectedStop(): Stop | null {
    return selectedStopState;
  },

  setSelectedStop(stop: Stop | null) {
    selectedStopState = stop;
    notifyStop();
  },

  subscribe(fn: BusListener): () => void {
    busListeners.add(fn);
    return () => busListeners.delete(fn);
  },

  subscribeRoutes(fn: RouteListener): () => void {
    routeListeners.add(fn);
    return () => routeListeners.delete(fn);
  },

  subscribeSelectedStop(fn: StopListener): () => void {
    stopListeners.add(fn);
    return () => stopListeners.delete(fn);
  },

  subscribeBoarding(fn: BoardingListener): () => void {
    boardingListeners.add(fn);
    return () => boardingListeners.delete(fn);
  },

  toggleBus(busId: string, activo: boolean, conductorNombre?: string) {
    socket.emit("cambiar_estado_bus", { busId, activo, conductorNombre });
  },

  boardBus(busId: string, pasajero: string, paraderoId: string) {
    socket.emit("subir_bus", { busId, pasajero, paraderoId });
  },

  alightBus(busId: string, pasajero: string) {
    socket.emit("bajar_bus", { busId, pasajero });
  },

  getAlerts(): ServiceAlert[] {
    return alertsState;
  },

  getAlertOptions(): string[] {
    return alertOptionsState;
  },

  subscribeAlerts(fn: AlertListener): () => void {
    alertListeners.add(fn);
    return () => alertListeners.delete(fn);
  },

  sendAlert(data: { busId: string; conductorNombre: string; tipo: string; descripcion: string }) {
    socket.emit("crear_alerta", data);
  },

  getReports(): DriverReport[] {
    return reportsState;
  },

  subscribeReports(fn: ReportListener): () => void {
    reportListeners.add(fn);
    return () => reportListeners.delete(fn);
  },
};
