import { useEffect, useMemo, useState } from "react";
import { DriverReport } from "../models";
import { BusService } from "../services";
import { useAuth } from "./AuthViewModel";

export function useDriverReportsViewModel() {
  const { user } = useAuth();
  const [allReports, setAllReports] = useState<DriverReport[]>(() => BusService.getReports());

  useEffect(() => {
    BusService.loadInitial();
    return BusService.subscribeReports(setAllReports);
  }, []);

  const driverName = (user?.name || "").toLowerCase();

  const reports = useMemo(
    () => allReports.filter((r) => r.destinatario.toLowerCase() === driverName),
    [allReports, driverName],
  );

  return { reports };
}
