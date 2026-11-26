import { useEffect, useMemo, useState } from "react";
import { Bus } from "../models";
import { AlertsService, BusService } from "../services";
import { useAuth } from "./AuthViewModel";
import { FormResult } from "./FormResult";

export function useDriverViewModel() {
  const { user } = useAuth();
  const options = useMemo(() => AlertsService.getOptions(), []);
  const [selectedOption, setSelectedOption] = useState(options[0] || "Tráfico / Retraso");
  const [description, setDescription] = useState("");
  const [buses, setBuses] = useState<Bus[]>(() => BusService.getBuses());

  useEffect(() => {
    BusService.loadInitial();
    return BusService.subscribe(setBuses);
  }, []);

  const driverName = user?.name || "Conductor";

  const assignedBus = useMemo(() => {
    if (buses.length === 0) return null;
    const match = buses.find(
      (b) => b.conductorNombre.toLowerCase() === driverName.toLowerCase(),
    );
    return match || buses.find((b) => b.id === "A") || buses[0];
  }, [buses, driverName]);

  const toggleBusState = () => {
    if (!assignedBus) return;
    BusService.toggleBus(assignedBus.id, !assignedBus.active, driverName);
  };

  const submitAlert = (): FormResult => {
    if (!assignedBus) {
      return {
        ok: false,
        title: "Sin bus asignado",
        message: "No se encontró una unidad asignada para asociar la alerta.",
      };
    }
    if (!selectedOption) {
      return {
        ok: false,
        title: "Selecciona un tipo",
        message: "Debes elegir una opción de alerta.",
      };
    }
    const texto = description.trim();
    if (!texto) {
      return {
        ok: false,
        title: "Campo requerido",
        message: "Ingresa una descripción breve antes de enviar la alerta.",
      };
    }

    AlertsService.sendAlert({
      busId: assignedBus.id,
      conductorNombre: driverName,
      tipo: selectedOption,
      descripcion: texto,
    });

    setDescription("");
    return {
      ok: true,
      title: "Alerta registrada",
      message: `Se envió la alerta para Bus ${assignedBus.id} con la hora actual.`,
    };
  };

  return {
    assignedBus,
    options,
    selectedOption,
    setSelectedOption,
    description,
    setDescription,
    toggleBusState,
    submitAlert,
  };
}
