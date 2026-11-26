import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useDriverViewModel, useTheme } from "../viewmodels";
import {
  BodyText,
  Card,
  Field,
  Heading,
  Page,
  PrimaryButton,
  SecondaryButton,
} from "./components";

export function DriverScreen() {
  const { colors, dark } = useTheme();
  const vm = useDriverViewModel();
  const bus = vm.assignedBus;

  const handleSubmitAlert = () => {
    const result = vm.submitAlert();
    Alert.alert(result.title, result.message);
  };

  return (
    <Page>
      <View style={{ backgroundColor: colors.primary, padding: 20, borderRadius: 18, gap: 6 }}>
        <Text style={{ color: dark ? "#09090B" : "#FFFFFF", fontSize: 23, fontWeight: "900" }}>
          Panel del conductor
        </Text>
        <Text style={{ color: dark ? "#27272A" : "#E4E4E7", fontSize: 14 }}>
          {bus ? `${bus.id} · ${bus.line}` : "Cargando unidad..."}
        </Text>
      </View>

      {bus && (
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BodyText style={{ color: colors.muted }}>Estado de la unidad</BodyText>
            <Text
              style={{
                color: bus.active ? colors.success : colors.danger,
                fontWeight: "800",
              }}
            >
              {bus.active ? bus.status : "Inactivo"}
            </Text>
          </View>
          <Heading>{bus.destination}</Heading>
          <BodyText style={{ color: colors.muted }}>
            Pasajeros a bordo: {bus.passengers.length}
          </BodyText>
          {bus.active ? (
            <SecondaryButton title="Parar bus" onPress={vm.toggleBusState} />
          ) : (
            <PrimaryButton title="Iniciar bus" onPress={vm.toggleBusState} />
          )}
        </Card>
      )}

      <Card>
        <BodyText style={{ fontWeight: "800", fontSize: 18 }}>Enviar alerta</BodyText>
        <BodyText style={{ color: colors.muted }}>
          Selecciona el tipo de situación ocurrida en ruta
        </BodyText>

        <View style={{ gap: 8 }}>
          {vm.options.map((opcion) => {
            const selected = vm.selectedOption === opcion;
            return (
              <TouchableOpacity
                key={opcion}
                onPress={() => vm.setSelectedOption(opcion)}
                style={{
                  padding: 13,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.soft,
                }}
              >
                <Text
                  style={{
                    color: selected ? (dark ? "#09090B" : "#FFFFFF") : colors.text,
                    fontWeight: "700",
                  }}
                >
                  {opcion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field
          label="Descripción"
          value={vm.description}
          onChangeText={vm.setDescription}
        />
        <PrimaryButton title="Enviar alerta" onPress={handleSubmitAlert} />
      </Card>
    </Page>
  );
}
