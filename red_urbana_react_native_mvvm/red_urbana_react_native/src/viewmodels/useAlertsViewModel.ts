import { useEffect, useState } from "react";
import { ServiceAlert } from "../models";
import { AlertsService, BusService } from "../services";

export function useAlertsViewModel() {
  const [alerts, setAlerts] = useState<ServiceAlert[]>(() => AlertsService.getAlerts());

  useEffect(() => {
    BusService.loadInitial();
    return AlertsService.subscribe(setAlerts);
  }, []);

  return { alerts };
}
