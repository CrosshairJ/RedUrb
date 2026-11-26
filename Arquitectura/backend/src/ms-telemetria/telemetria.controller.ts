import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { TelemetriaService } from "./telemetria.service";

@Controller("api")
export class TelemetriaController {
  constructor(private readonly telemetriaService: TelemetriaService) {}

  @Get("rutas")
  obtenerRutas() {
    return this.telemetriaService.obtenerRutas();
  }

  @Get("estado")
  obtenerEstado() {
    return {
      buses: this.telemetriaService.obtenerBuses(),
      alertas: this.telemetriaService.obtenerAlertas(),
      reportes: this.telemetriaService.obtenerReportes(),
      opcionesAlerta: this.telemetriaService.obtenerOpcionesAlerta(),
    };
  }

  @Post("buses/:id/estado")
  cambiarEstadoBus(
    @Param("id") id: string,
    @Body() body: { activo?: boolean; conductorNombre?: string },
  ) {
    return this.telemetriaService.cambiarEstadoBus(id, body?.activo, body?.conductorNombre);
  }

  @Post("buses/:id/asignar")
  asignarConductor(
    @Param("id") id: string,
    @Body() body: { conductorNombre: string },
  ) {
    return this.telemetriaService.asignarConductorABus(id, body?.conductorNombre);
  }

  @Post("alertas")
  crearAlerta(
    @Body() body: { busId?: string; conductorNombre?: string; tipo: string; descripcion?: string },
  ) {
    return this.telemetriaService.crearAlerta(body);
  }

  @Get("reportes")
  obtenerReportes() {
    return this.telemetriaService.obtenerReportes();
  }

  @Post("reportes")
  crearReporte(
    @Body()
    body: {
      autorNombre: string;
      destinatario: string;
      accion: string;
      detalle: string;
      busId?: string;
    },
  ) {
    return this.telemetriaService.crearReporte(body);
  }
}
