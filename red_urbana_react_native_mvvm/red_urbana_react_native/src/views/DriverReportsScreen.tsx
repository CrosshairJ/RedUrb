import React from "react";
import { View } from "react-native";
import { useDriverReportsViewModel, useTheme } from "../viewmodels";
import { BodyText, Card, Heading, Page } from "./components";

export function DriverReportsScreen() {
  const { colors } = useTheme();
  const { reports } = useDriverReportsViewModel();

  return (
    <Page>
      <Heading>Tus Reportes</Heading>
      {reports.length === 0 ? (
        <Card>
          <BodyText style={{ color: colors.muted }}>
            No tienes reportes asignados por el operador en este momento.
          </BodyText>
        </Card>
      ) : (
        reports.map((rep) => (
          <Card key={rep.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <BodyText style={{ fontWeight: "800", fontSize: 16 }}>
                {rep.accion} · Bus {rep.busId}
              </BodyText>
              <BodyText style={{ color: colors.muted, fontSize: 12 }}>{rep.hora}</BodyText>
            </View>
            <BodyText style={{ color: colors.muted, fontSize: 12 }}>
              Enviado por: {rep.autorNombre}
            </BodyText>
            <BodyText>{rep.detalle}</BodyText>
          </Card>
        ))
      )}
    </Page>
  );
}
