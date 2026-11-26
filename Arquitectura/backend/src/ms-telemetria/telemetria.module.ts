import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TelemetriaService } from "./telemetria.service";
import { TelemetriaController } from "./telemetria.controller";
import { TransporteGateway } from "./transporte.gateway";
import { BusEntity } from "./bus.entity";
import { AlertaEntity } from "./alerta.entity";
import { ReporteEntity } from "./reporte.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusEntity, AlertaEntity, ReporteEntity]),
    TypeOrmModule.forFeature([BusEntity, AlertaEntity, ReporteEntity], "sqlite_local"),
  ],
  controllers: [TelemetriaController],
  providers: [TelemetriaService, TransporteGateway],
  exports: [TelemetriaService],
})
export class TelemetriaModule {}
