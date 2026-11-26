import React from "react";
import { Text, View } from "react-native";
import { useAlertsViewModel, useTheme } from "../viewmodels";
import { BodyText, Card, Heading, Page } from "./components";

export function AlertsScreen() {
  const { colors } = useTheme();
  const { alerts } = useAlertsViewModel();

  return (
    <Page>
      <Heading>Alertas del servicio</Heading>
      {alerts.length === 0 ? (
        <Card>
          <BodyText style={{ color: colors.muted }}>
            No hay alertas registradas en este momento.
          </BodyText>
        </Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.id}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <BodyText style={{ fontWeight: "800", fontSize: 15 }}>{a.tipo}</BodyText>
                  <BodyText style={{ color: colors.muted, fontSize: 12 }}>{a.hora}</BodyText>
                </View>
                <BodyText style={{ color: colors.muted, fontSize: 12 }}>
                  {a.busId} · {a.linea}
                </BodyText>
                <BodyText>{a.descripcion}</BodyText>
              </View>
            </View>
          </Card>
        ))
      )}
    </Page>
  );
}
