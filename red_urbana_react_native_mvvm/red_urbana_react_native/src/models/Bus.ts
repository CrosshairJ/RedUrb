export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Stop = {
  id: string;
  nombre: string;
  coordinate: Coordinate;
  index: number;
};

export type RouteLine = {
  id: string;
  nombre: string;
  color: string;
  paraderos: Stop[];
  coordenadas: Coordinate[];
};

export type Bus = {
  id: string;
  linea: string;
  line: string;
  conductorNombre: string;
  destination: string;
  seconds: number;
  active: boolean;
  status: string;
  inStop: boolean;
  currentStopId: string | null;
  currentStopName: string | null;
  passengers: string[];
  coordinate: Coordinate;
};
