import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("buses")
export class BusEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  linea: string;

  @Column()
  nombreLinea: string;

  @Column()
  conductorNombre: string;

  @Column({ default: false })
  activo: boolean;

  @Column({ default: 0 })
  indiceRuta: number;
}
