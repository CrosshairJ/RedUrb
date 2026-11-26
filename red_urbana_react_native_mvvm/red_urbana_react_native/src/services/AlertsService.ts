import { ServiceAlert } from "../models";
import { BusService } from "./BusService";

export const AlertsService = {
  getAlerts(): ServiceAlert[] {
    return BusService.getAlerts();
  },

  getOptions(): string[] {
    return BusService.getAlertOptions();
  },

  subscribe(fn: (alerts: ServiceAlert[]) => void): () => void {
    return BusService.subscribeAlerts(fn);
  },

  sendAlert(data: { busId: string; conductorNombre: string; tipo: string; descripcion: string }) {
    BusService.sendAlert(data);
  },
};
