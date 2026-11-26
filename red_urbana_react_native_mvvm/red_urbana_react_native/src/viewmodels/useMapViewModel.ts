import { useEffect, useMemo, useState } from "react";
import { Bus, RouteLine, Stop } from "../models";
import { BusService } from "../services";

const INITIAL_REGION = {
  latitude: -35.4264,
  longitude: -71.6565,
  latitudeDelta: 0.022,
  longitudeDelta: 0.022,
};

export type MapRegion = typeof INITIAL_REGION;

export function useMapViewModel() {
  const [region, setRegion] = useState<MapRegion>(INITIAL_REGION);
  const [buses, setBuses] = useState<Bus[]>(() => BusService.getBuses());
  const [routes, setRoutes] = useState<RouteLine[]>(() => BusService.getRoutes());
  const [selectedStop, setSelectedStop] = useState<Stop | null>(() => BusService.getSelectedStop());

  useEffect(() => {
    BusService.loadInitial();
    const unsubBuses = BusService.subscribe(setBuses);
    const unsubRoutes = BusService.subscribeRoutes(setRoutes);
    const unsubStop = BusService.subscribeSelectedStop(setSelectedStop);
    return () => {
      unsubBuses();
      unsubRoutes();
      unsubStop();
    };
  }, []);

  const activeBuses = useMemo(() => buses.filter((b) => b.active), [buses]);

  const stops = useMemo(() => {
    const vistos = new Set<string>();
    const lista: Stop[] = [];
    for (const r of routes) {
      for (const s of r.paraderos) {
        if (!vistos.has(s.id)) {
          vistos.add(s.id);
          lista.push(s);
        }
      }
    }
    return lista;
  }, [routes]);

  const selectStop = (stop: Stop) => {
    BusService.setSelectedStop(stop);
  };

  return {
    region,
    setRegion,
    activeBuses,
    routes,
    stops,
    selectedStop,
    selectStop,
  };
}
