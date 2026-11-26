import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Usuario } from "./usuario.entity";

const USUARIOS_SEMILLA = [
  { correo: "pasajero@app.cl", clave: "123", nombre: "Ellen Hutter", rol: "Pasajero" },
  { correo: "conductor@app.cl", clave: "123", nombre: "Conde Orlok", rol: "Conductor" },
  { correo: "hutter@app.cl", clave: "123", nombre: "Thomas Hutter", rol: "Conductor" },
  { correo: "knock@app.cl", clave: "123", nombre: "Herr Knock", rol: "Conductor" },
  { correo: "harding@app.cl", clave: "123", nombre: "Friedrich Harding", rol: "Conductor" },
  { correo: "operador@app.cl", clave: "123", nombre: "Profesor Bulwer", rol: "Operador" },
];

@Injectable()
export class IdentidadService implements OnModuleInit {
  constructor(
    @InjectRepository(Usuario) private pgRepo: Repository<Usuario>,
    @InjectRepository(Usuario, "sqlite_local") private sqliteRepo: Repository<Usuario>,
    private jwt: JwtService,
  ) {}

  async onModuleInit() {
    for (const repo of [this.pgRepo, this.sqliteRepo]) {
      try {
        const orlok = await repo.findOne({ where: { nombre: "Conde Orlok" } });
        if (!orlok) {
          await repo.clear();
          await repo.save(USUARIOS_SEMILLA);
        }
      } catch {}
    }
  }

  private generarRespuestaAuth(user: Usuario) {
    const token = this.jwt.sign({ sub: user.id, rol: user.rol, nombre: user.nombre });
    return { token, nombre: user.nombre, rol: user.rol, correo: user.correo };
  }

  async login(correo: string, clave: string) {
    if (!correo || !clave) {
      throw new BadRequestException("Debes ingresar correo y clave");
    }

    const correoNorm = correo.trim().toLowerCase();
    let user = await this.pgRepo.findOne({ where: { correo: correoNorm, clave } }).catch(() => null);
    if (!user) {
      user = await this.sqliteRepo.findOne({ where: { correo: correoNorm, clave } });
    }
    if (!user) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    return this.generarRespuestaAuth(user);
  }

  async registrar(datos: { correo: string; clave: string; nombre: string; rol?: string }) {
    if (!datos.correo || !datos.clave || !datos.nombre) {
      throw new BadRequestException("Faltan datos obligatorios");
    }

    const correoNorm = datos.correo.trim().toLowerCase();
    const existeSqlite = await this.sqliteRepo.findOne({ where: { correo: correoNorm } });
    const existePg = await this.pgRepo.findOne({ where: { correo: correoNorm } }).catch(() => null);
    if (existeSqlite || existePg) {
      throw new BadRequestException("El correo ya está registrado");
    }

    const rolValido = datos.rol === "Conductor" ? "Conductor" : "Pasajero";
    const payload = {
      correo: correoNorm,
      clave: datos.clave,
      nombre: datos.nombre.trim(),
      rol: rolValido,
    };

    const nuevo = await this.sqliteRepo.save(payload);
    await this.pgRepo.save(payload).catch(() => null);

    return this.generarRespuestaAuth(nuevo);
  }

  async listarConductores() {
    let usuarios: Usuario[] = [];
    try {
      usuarios = await this.sqliteRepo.find({ where: { rol: "Conductor" }, order: { id: "ASC" } });
    } catch {}
    if (usuarios.length === 0) {
      try {
        usuarios = await this.pgRepo.find({ where: { rol: "Conductor" }, order: { id: "ASC" } });
      } catch {}
    }
    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
    }));
  }

  async crearConductor(datos: { nombre: string; correo: string; clave: string }) {
    if (!datos.nombre || !datos.correo || !datos.clave) {
      throw new BadRequestException("Debes completar nombre, correo y contraseña");
    }

    const correoNorm = datos.correo.trim().toLowerCase();
    const existeSqlite = await this.sqliteRepo.findOne({ where: { correo: correoNorm } });
    const existePg = await this.pgRepo.findOne({ where: { correo: correoNorm } }).catch(() => null);
    if (existeSqlite || existePg) {
      throw new BadRequestException("Ese correo ya está registrado");
    }

    const payload = {
      correo: correoNorm,
      clave: datos.clave,
      nombre: datos.nombre.trim(),
      rol: "Conductor",
    };

    const creado = await this.sqliteRepo.save(payload);
    await this.pgRepo.save(payload).catch(() => null);
    return {
      id: creado.id,
      nombre: creado.nombre,
      correo: creado.correo,
      rol: creado.rol,
    };
  }

  async eliminarConductor(id: number) {
    let conductor = await this.sqliteRepo.findOne({ where: { id } });
    if (!conductor) {
      conductor = await this.pgRepo.findOne({ where: { id } }).catch(() => null);
    }
    if (!conductor) {
      throw new NotFoundException("Conductor no encontrado");
    }
    if (conductor.rol !== "Conductor") {
      throw new BadRequestException("Solo se pueden eliminar cuentas de conductores");
    }

    const nombreEliminado = conductor.nombre;
    await this.sqliteRepo.delete({ id }).catch(() => {});
    await this.pgRepo.delete({ correo: conductor.correo }).catch(() => {});
    return { ok: true, nombre: nombreEliminado };
  }

  async cambiarClave(datos: { correo: string; claveActual: string; claveNueva: string }) {
    if (!datos.correo || !datos.claveActual || !datos.claveNueva) {
      throw new BadRequestException("Debes completar todos los campos de contraseña");
    }
    if (datos.claveNueva.length < 6) {
      throw new BadRequestException("La nueva contraseña debe tener al menos 6 caracteres");
    }

    const correoNorm = datos.correo.trim().toLowerCase();
    let user = await this.sqliteRepo.findOne({ where: { correo: correoNorm, clave: datos.claveActual } });
    if (!user) {
      user = await this.pgRepo
        .findOne({ where: { correo: correoNorm, clave: datos.claveActual } })
        .catch(() => null);
    }
    if (!user) {
      throw new UnauthorizedException("La contraseña actual no es correcta");
    }

    await this.sqliteRepo.update({ correo: correoNorm }, { clave: datos.claveNueva }).catch(() => {});
    await this.pgRepo.update({ correo: correoNorm }, { clave: datos.claveNueva }).catch(() => {});
    return { ok: true };
  }
}
