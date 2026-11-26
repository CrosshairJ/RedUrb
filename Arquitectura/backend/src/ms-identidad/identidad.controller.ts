import { Controller, Post, Get, Delete, Body, Param } from "@nestjs/common";
import { IdentidadService } from "./identidad.service";
import { TelemetriaService } from "../ms-telemetria/telemetria.service";

@Controller("api")
export class IdentidadController {
  constructor(
    private readonly identidadService: IdentidadService,
    private readonly telemetriaService: TelemetriaService,
  ) {}

  @Post("login")
  login(@Body() body: { correo: string; clave: string }) {
    return this.identidadService.login(body.correo, body.clave);
  }

  @Post("registro")
  registrar(@Body() body: { correo: string; clave: string; nombre: string; rol?: string }) {
    return this.identidadService.registrar(body);
  }

  @Get("conductores")
  listarConductores() {
    return this.identidadService.listarConductores();
  }

  @Post("conductores")
  crearConductor(@Body() body: { nombre: string; correo: string; clave: string }) {
    return this.identidadService.crearConductor(body);
  }

  @Delete("conductores/:id")
  async eliminarConductor(@Param("id") id: string) {
    const res = await this.identidadService.eliminarConductor(Number(id));
    await this.telemetriaService.desasignarConductorEliminado(res.nombre);
    return res;
  }

  @Post("cambiar-clave")
  cambiarClave(@Body() body: { correo: string; claveActual: string; claveNueva: string }) {
    return this.identidadService.cambiarClave(body);
  }
}
