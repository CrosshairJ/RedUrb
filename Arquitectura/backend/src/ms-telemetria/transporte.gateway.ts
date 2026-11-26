import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { TelemetriaService } from "./telemetria.service";

@WebSocketGateway({ cors: { origin: "*" } })
export class TransporteGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly telemetria: TelemetriaService) {}

  afterInit() {
    this.telemetria.registrarOnTick(
      (buses) => {
        this.server.emit("actualizacion_buses", buses);
      },
      () => {
        this.emitirEstadoCompleto();
      },
    );
  }

  handleConnection(client: Socket) {
    client.emit("estado_inicial", {
      rutas: this.telemetria.obtenerRutas(),
      buses: this.telemetria.obtenerBuses(),
      alertas: this.telemetria.obtenerAlertas(),
      reportes: this.telemetria.obtenerReportes(),
      opcionesAlerta: this.telemetria.obtenerOpcionesAlerta(),
    });
  }

  private emitirEstadoCompleto() {
    this.server.emit("actualizacion_buses", this.telemetria.obtenerBuses());
    this.server.emit("actualizacion_alertas", this.telemetria.obtenerAlertas());
    this.server.emit("actualizacion_reportes", this.telemetria.obtenerReportes());
  }

  @SubscribeMessage("cambiar_estado_bus")
  async cambiarEstadoBus(
    @MessageBody() data: { busId?: string; activo?: boolean; conductorNombre?: string },
  ) {
    await this.telemetria.cambiarEstadoBus(data?.busId || "", data?.activo, data?.conductorNombre);
    this.emitirEstadoCompleto();
  }

  @SubscribeMessage("subir_bus")
  subirBus(
    @MessageBody() data: { busId: string; pasajero: string; paraderoId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const resultado = this.telemetria.subirPasajero(
      data?.busId,
      data?.pasajero || "Pasajero",
      data?.paraderoId,
    );
    client.emit("respuesta_abordaje", { ...resultado, busId: data?.busId });
    if (resultado.ok) {
      this.server.emit("actualizacion_buses", this.telemetria.obtenerBuses());
    }
  }

  @SubscribeMessage("bajar_bus")
  bajarBus(@MessageBody() data: { busId: string; pasajero: string }) {
    this.telemetria.bajarPasajero(data?.busId, data?.pasajero || "Pasajero");
    this.server.emit("actualizacion_buses", this.telemetria.obtenerBuses());
  }

  @SubscribeMessage("crear_alerta")
  async crearAlerta(
    @MessageBody() data: { busId?: string; conductorNombre?: string; tipo: string; descripcion?: string },
  ) {
    const alerta = await this.telemetria.crearAlerta(data);
    if (alerta) {
      this.server.emit("nueva_alerta", alerta);
      this.server.emit("actualizacion_alertas", this.telemetria.obtenerAlertas());
    }
  }

  @SubscribeMessage("crear_reporte")
  async crearReporte(
    @MessageBody()
    data: {
      autorNombre: string;
      destinatario: string;
      accion: string;
      detalle: string;
      busId?: string;
    },
  ) {
    await this.telemetria.crearReporte(data);
    this.server.emit("actualizacion_reportes", this.telemetria.obtenerReportes());
  }
}
