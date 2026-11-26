import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("alertas")
export class AlertaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  busId: string;

  @Column()
  linea: string;

  @Column()
  conductorNombre: string;

  @Column()
  tipo: string;

  @Column()
  descripcion: string;

  @Column()
  hora: string;

  @Column("float")
  lat: number;

  @Column("float")
  lng: number;
}
