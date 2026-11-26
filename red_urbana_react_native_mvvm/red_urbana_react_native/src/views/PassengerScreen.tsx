import React from "react";
import { Text, View } from "react-native";
import { usePassengerViewModel, useTheme } from "../viewmodels";
import {
  BodyText,
  Card,
  Divider,
  Field,
  Heading,
  Page,
  PrimaryButton,
  SecondaryButton,
} from "./components";

export function PassengerScreen() {
  const { colors, dark } = useTheme();
  const vm = usePassengerViewModel();

  return (
    <Page>
      <View style={{ backgroundColor: colors.primary, borderRadius: 18, padding: 20, gap: 6 }}>
        <Text style={{ color: dark ? "#09090B" : "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
          PARADERO SELECCIONADO
        </Text>
        <Text style={{ color: dark ? "#09090B" : "#FFFFFF", fontSize: 22, fontWeight: "900" }}>
          {vm.selectedStop ? vm.selectedStop.nombre : "Sin paradero"}
        </Text>
        <Text style={{ color: dark ? "#27272A" : "#E4E4E7", fontSize: 13 }}>
          {vm.selectedStop
            ? "Solo puedes subir cuando un bus esté en este paradero."
            : "Ve a la pestaña Mapa y toca un paradero para vincularte."}
        </Text>
      </View>

      {vm.boardingMessage !== "" && (
        <Card>
          <BodyText style={{ fontWeight: "700" }}>{vm.boardingMessage}</BodyText>
        </Card>
      )}

      <Heading>Busca tu recorrido</Heading>
      <Field label="Bus, línea o destino..." value={vm.search} onChangeText={vm.setSearch} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Heading>Buses disponibles</Heading>
        <BodyText style={{ color: colors.muted, fontWeight: "700" }}>
          {vm.resultCount} unidades
        </BodyText>
      </View>

      {vm.resultCount === 0 ? (
        <Card>
          <BodyText>No se encontraron recorridos.</BodyText>
        </Card>
      ) : (
        vm.buses.map((bus) => {
          const aboard = vm.isAboard(bus);
          const boardEnabled = vm.canBoard(bus);

          return (
            <Card key={bus.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.soft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🚌</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <BodyText style={{ fontWeight: "800", fontSize: 16 }}>{bus.line}</BodyText>
                  <BodyText style={{ color: colors.muted }}>{bus.id}</BodyText>
                </View>
                <Text
                  style={{
                    color: bus.active ? colors.success : colors.danger,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  {bus.active ? (bus.inStop ? "En parada" : "Activo") : "Inactivo"}
                </Text>
              </View>

              <Divider margin={6} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <BodyText style={{ color: colors.muted, fontSize: 12 }}>
                    {bus.inStop ? "Paradero actual" : "Destino"}
                  </BodyText>
                  <BodyText style={{ fontWeight: "700" }}>{bus.destination}</BodyText>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
                    {!bus.active
                      ? "Inactivo"
                      : bus.inStop
                        ? `${bus.seconds} seg`
                        : `${bus.seconds} seg`}
                  </Text>
                  <BodyText style={{ color: colors.muted, fontSize: 11 }}>
                    {!bus.active
                      ? "Fuera de servicio"
                      : bus.inStop
                        ? "En parada"
                        : "Para llegar"}
                  </BodyText>
                </View>
              </View>

              {aboard ? (
                <SecondaryButton title="Bajarse del bus" onPress={() => vm.alightBus(bus.id)} />
              ) : (
                <PrimaryButton
                  title={boardEnabled ? "Subirse al bus" : "Disponible en tu paradero"}
                  disabled={!boardEnabled}
                  onPress={() => vm.boardBus(bus.id)}
                />
              )}
            </Card>
          );
        })
      )}
    </Page>
  );
}
