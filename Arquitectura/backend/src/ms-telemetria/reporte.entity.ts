import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("reportes")
export class ReporteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  autorNombre: string;

  @Column()
  destinatario: string;

  @Column()
  accion: string;

  @Column()
  detalle: string;

  @Column()
  busId: string;

  @Column()
  hora: string;
}
