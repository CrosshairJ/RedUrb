export type ServiceAlert = {
  id: number;
  busId: string;
  linea: string;
  conductorNombre: string;
  tipo: string;
  descripcion: string;
  hora: string;
  lat: number;
  lng: number;
};

export type DriverReport = {
  id: number;
  autorNombre: string;
  destinatario: string;
  accion: string;
  detalle: string;
  busId: string;
  hora: string;
};
