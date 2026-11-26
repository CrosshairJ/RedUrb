import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Redis from "ioredis";
import * as mqtt from "mqtt";
import * as amqp from "amqplib";
import { BusEntity } from "./bus.entity";
import { AlertaEntity } from "./alerta.entity";
import { ReporteEntity } from "./reporte.entity";
import { OPCIONES_ALERTA, ParaderoRuta, RUTAS_TALCA, RutaUrbana } from "./rutas.data";

export interface BusEstado {
  id: string;
  linea: string;
  nombreLinea: string;
  conductorNombre: string;
  activo: boolean;
  estado: string;
  destino: string;
  segundosParaLlegar: number;
  enParada: boolean;
  segundosEnParada: number;
  paraderoActualId: string | null;
  paraderoActualNombre: string | null;
  lat: number;
  lng: number;
  indiceRuta: number;
  pasajeros: string[];
}

export interface AlertaEstado {
  id: number;
  busId: string;
  linea: string;
  conductorNombre: string;
  tipo: string;
  descripcion: string;
  hora: string;
  lat: number;
  lng: number;
}

export interface ReporteEstado {
  id: number;
  autorNombre: string;
  destinatario: string;
  accion: string;
  detalle: string;
  busId: string;
  hora: string;
}

const TICK_MS = 200;
const SEGUNDOS_EN_PARADA = 5;

const BUSES_SEMILLA: Partial<BusEntity>[] = [
  {
    id: "A",
    linea: "1",
    nombreLinea: "Línea 1",
    conductorNombre: "Conde Orlok",
    activo: true,
    indiceRuta: 1,
  },
  {
    id: "B",
    linea: "2",
    nombreLinea: "Línea 2",
    conductorNombre: "Thomas Hutter",
    activo: true,
    indiceRuta: 1,
  },
  {
    id: "C",
    linea: "3",
    nombreLinea: "Línea 3",
    conductorNombre: "Herr Knock",
    activo: false,
    indiceRuta: 0,
  },
  {
    id: "D",
    linea: "1",
    nombreLinea: "Línea 1",
    conductorNombre: "Friedrich Harding",
    activo: false,
    indiceRuta: 95,
  },
];

@Injectable()
export class TelemetriaService implements OnModuleInit, OnModuleDestroy {
  private redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });
  private mqttClient: mqtt.MqttClient | null = null;
  private rabbitChannel: amqp.Channel | null = null;
  private busesMap = new Map<string, BusEstado>();
  private busParadaMsRestantes = new Map<string, number>();
  private alertasList: AlertaEstado[] = [];
  private reportesList: ReporteEstado[] = [];
  private ticker: NodeJS.Timeout | null = null;
  private tickCounter = 0;
  private onTickCallback: ((buses: BusEstado[]) => void) | null = null;
  private onEstadoCambioCallback: (() => void) | null = null;

  constructor(
    @InjectRepository(BusEntity) private pgBusRepo: Repository<BusEntity>,
    @InjectRepository(BusEntity, "sqlite_local") private sqliteBusRepo: Repository<BusEntity>,
    @InjectRepository(AlertaEntity) private pgAlertaRepo: Repository<AlertaEntity>,
    @InjectRepository(AlertaEntity, "sqlite_local") private sqliteAlertaRepo: Repository<AlertaEntity>,
    @InjectRepository(ReporteEntity) private pgReporteRepo: Repository<ReporteEntity>,
    @InjectRepository(ReporteEntity, "sqlite_local") private sqliteReporteRepo: Repository<ReporteEntity>,
  ) {}

  private obtenerRuta(linea: string): RutaUrbana {
    return RUTAS_TALCA.find((r) => r.id === linea) ?? RUTAS_TALCA[0];
  }

  private encontrarProximoParadero(ruta: RutaUrbana, indice: number): ParaderoRuta {
    for (const p of ruta.paraderos) {
      if (p.index > indice) {
        return p;
      }
    }
    return ruta.paraderos[0];
  }

  private pasosHastaParadero(ruta: RutaUrbana, indiceActual: number, indiceParadero: number): number {
    if (indiceParadero >= indiceActual) {
      return indiceParadero - indiceActual;
    }
    return ruta.coordenadas.length - indiceActual + indiceParadero;
  }

  private calcularSegundos(pasos: number): number {
    return Math.max(1, Math.ceil((pasos * TICK_MS) / 1000));
  }

  async onModuleInit() {
    this.redis.connect().catch(() => {});

    try {
      this.mqttClient = mqtt.connect(process.env.MQTT_URL || "mqtt://localhost:1883", {
        reconnectPeriod: 2000,
      });
      this.mqttClient.on("connect", () => this.mqttClient?.subscribe("transporte/gps/+"));
      this.mqttClient.on("error", () => {});
    } catch {}

    try {
      const conn = await amqp.connect(process.env.RABBIT_URL || "amqp://localhost:5672");
      this.rabbitChannel = await conn.createChannel();
      await this.rabbitChannel.assertQueue("eventos_transporte", { durable: true });
    } catch {
      this.rabbitChannel = null;
    }

    await this.inicializarDatos();
    this.iniciarSimulacion();
  }

  onModuleDestroy() {
    if (this.ticker) clearInterval(this.ticker);
  }

  registrarOnTick(cb: (buses: BusEstado[]) => void, onEstadoCambio?: () => void) {
    this.onTickCallback = cb;
    if (onEstadoCambio) {
      this.onEstadoCambioCallback = onEstadoCambio;
    }
  }

  private async inicializarDatos() {
    for (const repo of [this.pgBusRepo, this.sqliteBusRepo]) {
      try {
        const existentes = await repo.find();
        const busA = existentes.find((e) => e.id === "A");
        const tieneNosferatu = busA && busA.conductorNombre === "Conde Orlok";
        if (existentes.length === 0 || !busA || !tieneNosferatu) {
          await repo.clear();
          await repo.save(BUSES_SEMILLA);
        }
      } catch {}
    }

    let entidades: BusEntity[] = [];
    try {
      entidades = await this.pgBusRepo.find({ order: { id: "ASC" } });
    } catch {}
    if (entidades.length === 0) {
      entidades = await this.sqliteBusRepo.find({ order: { id: "ASC" } });
    }

    for (const b of entidades) {
      const ruta = this.obtenerRuta(b.linea);
      const total = ruta.coordenadas.length;
      const idx = ((b.indiceRuta % total) + total) % total;
      const [lat, lng] = ruta.coordenadas[idx];
      const prox = this.encontrarProximoParadero(ruta, idx);
      const pasos = this.pasosHastaParadero(ruta, idx, prox.index);

      this.busParadaMsRestantes.set(b.id, 0);

      this.busesMap.set(b.id, {
        id: b.id,
        linea: b.linea,
        nombreLinea: b.nombreLinea,
        conductorNombre: b.conductorNombre,
        activo: b.activo,
        estado: b.activo ? "En ruta" : "Inactivo",
        destino: prox.nombre,
        segundosParaLlegar: b.activo ? this.calcularSegundos(pasos) : 0,
        enParada: false,
        segundosEnParada: 0,
        paraderoActualId: null,
        paraderoActualNombre: null,
        lat,
        lng,
        indiceRuta: idx,
        pasajeros: [],
      });
    }

    let alertasDb: AlertaEntity[] = [];
    try {
      alertasDb = await this.pgAlertaRepo.find({ order: { id: "DESC" } });
    } catch {}
    if (alertasDb.length === 0) {
      try {
        alertasDb = await this.sqliteAlertaRepo.find({ order: { id: "DESC" } });
      } catch {}
    }
    this.alertasList = alertasDb.map((a) => ({
      id: a.id,
      busId: a.busId,
      linea: a.linea,
      conductorNombre: a.conductorNombre,
      tipo: a.tipo,
      descripcion: a.descripcion,
      hora: a.hora,
      lat: a.lat,
      lng: a.lng,
    }));

    let reportesDb: ReporteEntity[] = [];
    try {
      reportesDb = await this.pgReporteRepo.find({ order: { id: "DESC" } });
    } catch {}
    if (reportesDb.length === 0) {
      try {
        reportesDb = await this.sqliteReporteRepo.find({ order: { id: "DESC" } });
      } catch {}
    }
    this.reportesList = reportesDb.map((r) => ({
      id: r.id,
      autorNombre: r.autorNombre,
      destinatario: r.destinatario,
      accion: r.accion,
      detalle: r.detalle,
      busId: r.busId,
      hora: r.hora,
    }));
  }

  private async persistirBus(bus: BusEstado) {
    const datos = {
      activo: bus.activo,
      indiceRuta: bus.indiceRuta,
      conductorNombre: bus.conductorNombre,
    };
    await this.sqliteBusRepo.update({ id: bus.id }, datos).catch(() => {});
    await this.pgBusRepo.update({ id: bus.id }, datos).catch(() => {});
  }

  private iniciarSimulacion() {
    if (this.ticker) clearInterval(this.ticker);

    this.ticker = setInterval(async () => {
      this.tickCounter += 1;
      let huboCambio = false;

      for (const bus of this.busesMap.values()) {
        if (!bus.activo) continue;
        huboCambio = true;
        const ruta = this.obtenerRuta(bus.linea);
        const total = ruta.coordenadas.length;

        if (bus.enParada) {
          const restanteMs = (this.busParadaMsRestantes.get(bus.id) ?? 0) - TICK_MS;
          if (restanteMs > 0) {
            this.busParadaMsRestantes.set(bus.id, restanteMs);
            bus.segundosEnParada = Math.ceil(restanteMs / 1000);
            bus.segundosParaLlegar = bus.segundosEnParada;
            bus.estado = "En parada";
            bus.destino = bus.paraderoActualNombre || bus.destino;
          } else {
            this.busParadaMsRestantes.set(bus.id, 0);
            bus.enParada = false;
            bus.segundosEnParada = 0;
            bus.paraderoActualId = null;
            bus.paraderoActualNombre = null;

            bus.indiceRuta = (bus.indiceRuta + 1) % total;
            const [lat, lng] = ruta.coordenadas[bus.indiceRuta];
            const prox = this.encontrarProximoParadero(ruta, bus.indiceRuta);
            const pasos = this.pasosHastaParadero(ruta, bus.indiceRuta, prox.index);

            bus.lat = lat;
            bus.lng = lng;
            bus.estado = "En ruta";
            bus.destino = prox.nombre;
            bus.segundosParaLlegar = this.calcularSegundos(pasos);
          }
        } else {
          const siguienteIndice = (bus.indiceRuta + 1) % total;
          bus.indiceRuta = siguienteIndice;
          const [lat, lng] = ruta.coordenadas[siguienteIndice];
          bus.lat = lat;
          bus.lng = lng;

          const paraderoLlegada = ruta.paraderos.find((p) => p.index === siguienteIndice);
          if (paraderoLlegada) {
            this.busParadaMsRestantes.set(bus.id, SEGUNDOS_EN_PARADA * 1000);
            bus.enParada = true;
            bus.segundosEnParada = SEGUNDOS_EN_PARADA;
            bus.paraderoActualId = paraderoLlegada.id;
            bus.paraderoActualNombre = paraderoLlegada.nombre;
            bus.estado = "En parada";
            bus.destino = paraderoLlegada.nombre;
            bus.segundosParaLlegar = SEGUNDOS_EN_PARADA;
            await this.persistirBus(bus);
          } else {
            const prox = this.encontrarProximoParadero(ruta, siguienteIndice);
            const pasos = this.pasosHastaParadero(ruta, siguienteIndice, prox.index);
            bus.estado = "En ruta";
            bus.destino = prox.nombre;
            bus.segundosParaLlegar = this.calcularSegundos(pasos);
          }
        }

        if (this.tickCounter % 5 === 0) {
          await this.publicarEvento(bus);
        }
        if (this.tickCounter % 20 === 0) {
          await this.persistirBus(bus);
        }
      }

      if (huboCambio && this.onTickCallback) {
        this.onTickCallback(this.obtenerBuses());
      }
    }, TICK_MS);
  }

  async publicarEvento(bus: BusEstado) {
    const mensaje = JSON.stringify(bus);
    await this.redis.set(`bus:${bus.id}`, mensaje).catch(() => {});

    try {
      if (this.mqttClient?.connected) {
        this.mqttClient.publish(`transporte/gps/${bus.id.toLowerCase()}`, mensaje);
      }
    } catch {}

    try {
      this.rabbitChannel?.sendToQueue("eventos_transporte", Buffer.from(mensaje));
    } catch {}
  }

  obtenerRutas() {
    return RUTAS_TALCA;
  }

  obtenerOpcionesAlerta() {
    return OPCIONES_ALERTA;
  }

  obtenerBuses(): BusEstado[] {
    return Array.from(this.busesMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  obtenerAlertas(): AlertaEstado[] {
    return this.alertasList;
  }

  obtenerReportes(): ReporteEstado[] {
    return this.reportesList;
  }

  obtenerBusPorConductor(nombreConductor?: string, busId?: string): BusEstado | undefined {
    if (busId && this.busesMap.has(busId)) {
      return this.busesMap.get(busId);
    }
    if (nombreConductor) {
      const encontrado = Array.from(this.busesMap.values()).find(
        (b) => b.conductorNombre.toLowerCase() === nombreConductor.toLowerCase(),
      );
      if (encontrado) return encontrado;
    }
    return this.busesMap.get("A") ?? this.obtenerBuses()[0];
  }

  async asignarConductorABus(busId: string, conductorNombre: string): Promise<BusEstado | null> {
    const bus = this.busesMap.get(busId);
    if (!bus) return null;

    const nombre = (conductorNombre || "").trim() || "Sin asignar";
    for (const otro of this.busesMap.values()) {
      if (otro.id !== busId && otro.conductorNombre.toLowerCase() === nombre.toLowerCase()) {
        otro.conductorNombre = "Sin asignar";
        await this.persistirBus(otro);
      }
    }

    bus.conductorNombre = nombre;
    await this.persistirBus(bus);
    if (this.onEstadoCambioCallback) this.onEstadoCambioCallback();
    return bus;
  }

  async desasignarConductorEliminado(nombreConductor: string) {
    let cambio = false;
    for (const bus of this.busesMap.values()) {
      if (bus.conductorNombre.toLowerCase() === nombreConductor.toLowerCase()) {
        bus.conductorNombre = "Sin asignar";
        await this.persistirBus(bus);
        cambio = true;
      }
    }
    if (cambio && this.onEstadoCambioCallback) {
      this.onEstadoCambioCallback();
    }
  }

  async cambiarEstadoBus(busId: string, activo?: boolean, conductorNombre?: string): Promise<BusEstado | null> {
    const bus = this.obtenerBusPorConductor(conductorNombre, busId);
    if (!bus) return null;

    const nuevoEstado = typeof activo === "boolean" ? activo : !bus.activo;
    bus.activo = nuevoEstado;

    if (!nuevoEstado) {
      bus.estado = "Inactivo";
      bus.segundosParaLlegar = 0;
    } else {
      const ruta = this.obtenerRuta(bus.linea);
      if (bus.enParada && (this.busParadaMsRestantes.get(bus.id) ?? 0) > 0) {
        bus.estado = "En parada";
        bus.segundosParaLlegar = bus.segundosEnParada;
      } else {
        const prox = this.encontrarProximoParadero(ruta, bus.indiceRuta);
        const pasos = this.pasosHastaParadero(ruta, bus.indiceRuta, prox.index);
        bus.estado = "En ruta";
        bus.destino = prox.nombre;
        bus.segundosParaLlegar = this.calcularSegundos(pasos);
      }
    }

    await this.persistirBus(bus);
    await this.publicarEvento(bus);
    if (this.onEstadoCambioCallback) this.onEstadoCambioCallback();
    return bus;
  }

  subirPasajero(busId: string, pasajero: string, paraderoId: string): { ok: boolean; mensaje: string } {
    const bus = this.busesMap.get(busId);
    if (!bus) return { ok: false, mensaje: "Bus no encontrado" };
    if (!bus.activo) return { ok: false, mensaje: "El bus está inactivo" };
    if (!bus.enParada || bus.paraderoActualId !== paraderoId) {
      return { ok: false, mensaje: "El bus debe estar detenido en tu paradero para subir" };
    }

    for (const otro of this.busesMap.values()) {
      otro.pasajeros = otro.pasajeros.filter((p) => p !== pasajero);
    }
    if (!bus.pasajeros.includes(pasajero)) {
      bus.pasajeros = [...bus.pasajeros, pasajero];
    }
    return { ok: true, mensaje: "Pasajero a bordo" };
  }

  bajarPasajero(busId: string, pasajero: string): { ok: boolean } {
    const bus = this.busesMap.get(busId);
    if (!bus) return { ok: false };
    bus.pasajeros = bus.pasajeros.filter((p) => p !== pasajero);
    return { ok: true };
  }

  async crearAlerta(datos: {
    busId?: string;
    conductorNombre?: string;
    tipo: string;
    descripcion?: string;
  }): Promise<AlertaEstado | null> {
    const bus = this.obtenerBusPorConductor(datos.conductorNombre, datos.busId);
    if (!bus) return null;

    const hora = new Date().toTimeString().slice(0, 8);
    const payload = {
      busId: bus.id,
      linea: bus.nombreLinea,
      conductorNombre: datos.conductorNombre || bus.conductorNombre,
      tipo: OPCIONES_ALERTA.includes(datos.tipo) ? datos.tipo : OPCIONES_ALERTA[0],
      descripcion: (datos.descripcion || "").trim() || "Sin descripción adicional",
      hora,
      lat: bus.lat,
      lng: bus.lng,
    };

    let guardada: AlertaEntity | null = null;
    try {
      guardada = await this.pgAlertaRepo.save(payload);
    } catch {}
    const guardadaSqlite = await this.sqliteAlertaRepo.save(payload);
    const finalEntity = guardada ?? guardadaSqlite;

    const alerta: AlertaEstado = {
      id: finalEntity.id,
      busId: finalEntity.busId,
      linea: finalEntity.linea,
      conductorNombre: finalEntity.conductorNombre,
      tipo: finalEntity.tipo,
      descripcion: finalEntity.descripcion,
      hora: finalEntity.hora,
      lat: finalEntity.lat,
      lng: finalEntity.lng,
    };

    this.alertasList = [alerta, ...this.alertasList];

    try {
      this.rabbitChannel?.sendToQueue("eventos_transporte", Buffer.from(JSON.stringify({ evento: "alerta", alerta })));
    } catch {}

    return alerta;
  }

  async crearReporte(datos: {
    autorNombre: string;
    destinatario: string;
    accion: string;
    detalle: string;
    busId?: string;
  }): Promise<ReporteEstado> {
    const hora = new Date().toTimeString().slice(0, 8);
    const payload = {
      autorNombre: (datos.autorNombre || "Operador").trim(),
      destinatario: (datos.destinatario || "Operaciones").trim(),
      accion: (datos.accion || "Seguimiento").trim(),
      detalle: (datos.detalle || "").trim() || "Sin detalle adicional",
      busId: (datos.busId || "General").trim(),
      hora,
    };

    let guardadoPg: ReporteEntity | null = null;
    try {
      guardadoPg = await this.pgReporteRepo.save(payload);
    } catch {}
    const guardadoSqlite = await this.sqliteReporteRepo.save(payload);
    const finalEntity = guardadoPg ?? guardadoSqlite;

    const reporte: ReporteEstado = {
      id: finalEntity.id,
      autorNombre: finalEntity.autorNombre,
      destinatario: finalEntity.destinatario,
      accion: finalEntity.accion,
      detalle: finalEntity.detalle,
      busId: finalEntity.busId,
      hora: finalEntity.hora,
    };

    this.reportesList = [reporte, ...this.reportesList];
    if (this.onEstadoCambioCallback) {
      this.onEstadoCambioCallback();
    }
    return reporte;
  }
}
