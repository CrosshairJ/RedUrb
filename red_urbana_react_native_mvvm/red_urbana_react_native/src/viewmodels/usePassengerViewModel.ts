import { useEffect, useMemo, useState } from "react";
import { Bus, Stop } from "../models";
import { BusService } from "../services";
import { useAuth } from "./AuthViewModel";

export function usePassengerViewModel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [allBuses, setAllBuses] = useState<Bus[]>(() => BusService.getBuses());
  const [selectedStop, setSelectedStop] = useState<Stop | null>(() => BusService.getSelectedStop());
  const [boardingMessage, setBoardingMessage] = useState("");

  useEffect(() => {
    BusService.loadInitial();
    const unsubBuses = BusService.subscribe(setAllBuses);
    const unsubStop = BusService.subscribeSelectedStop(setSelectedStop);
    const unsubBoarding = BusService.subscribeBoarding((res) => {
      setBoardingMessage(res.mensaje);
    });
    return () => {
      unsubBuses();
      unsubStop();
      unsubBoarding();
    };
  }, []);

  const buses = useMemo(() => {
    const query = search.toLowerCase();
    return allBuses.filter((b) => `${b.id} ${b.line} ${b.destination}`.toLowerCase().includes(query));
  }, [search, allBuses]);

  const passengerName = user?.name || "Pasajero";

  const canBoard = (bus: Bus) =>
    bus.active &&
    bus.inStop &&
    Boolean(selectedStop) &&
    bus.currentStopId === selectedStop?.id;

  const isAboard = (bus: Bus) => bus.passengers.includes(passengerName);

  const boardBus = (busId: string) => {
    if (!selectedStop) return;
    BusService.boardBus(busId, passengerName, selectedStop.id);
  };

  const alightBus = (busId: string) => {
    BusService.alightBus(busId, passengerName);
    setBoardingMessage("");
  };

  return {
    search,
    setSearch,
    buses,
    resultCount: buses.length,
    selectedStop,
    boardingMessage,
    canBoard,
    isAboard,
    boardBus,
    alightBus,
  };
}
