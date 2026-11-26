import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "./ms-identidad/usuario.entity";
import { BusEntity } from "./ms-telemetria/bus.entity";
import { AlertaEntity } from "./ms-telemetria/alerta.entity";
import { ReporteEntity } from "./ms-telemetria/reporte.entity";
import { IdentidadModule } from "./ms-identidad/identidad.module";
import { TelemetriaModule } from "./ms-telemetria/telemetria.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "admin",
      password: process.env.DB_PASS || "admin123",
      database: process.env.DB_NAME || "transporte_db",
      entities: [Usuario, BusEntity, AlertaEntity, ReporteEntity],
      synchronize: true,
    }),
    TypeOrmModule.forRoot({
      name: "sqlite_local",
      type: "better-sqlite3",
      database: process.env.SQLITE_PATH || "transporte_local.sqlite",
      entities: [Usuario, BusEntity, AlertaEntity, ReporteEntity],
      synchronize: true,
    }),
    IdentidadModule,
    TelemetriaModule,
  ],
})
export class AppModule {}
