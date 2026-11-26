import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useMapViewModel, useTheme } from "../viewmodels";

export function MapScreen() {
  const { colors, dark } = useTheme();
  const vm = useMapViewModel();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: 16,
          gap: 6,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>
          Mapa de Red Urbana
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {vm.selectedStop
            ? `Paradero actual: ${vm.selectedStop.nombre}`
            : "Toca un paradero en el mapa para ubicarte"}
        </Text>
      </View>

      <MapView
        style={{ flex: 1 }}
        region={vm.region}
        onRegionChangeComplete={vm.setRegion}
        showsUserLocation={false}
        showsCompass
        showsScale
      >
        {vm.routes.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.coordenadas}
            strokeColor={route.color}
            strokeWidth={4}
          />
        ))}

        {vm.stops.map((stop) => {
          const isSelected = vm.selectedStop?.id === stop.id;
          return (
            <Marker
              key={stop.id}
              coordinate={stop.coordinate}
              title={stop.nombre}
              description="Toca para esperar en este paradero"
              onPress={() => vm.selectStop(stop)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={{
                  width: isSelected ? 22 : 16,
                  height: isSelected ? 22 : 16,
                  borderRadius: 11,
                  backgroundColor: isSelected ? colors.success : colors.primary,
                  borderWidth: 2.5,
                  borderColor: dark ? "#09090B" : "#FFFFFF",
                }}
              />
            </Marker>
          );
        })}

        {vm.activeBuses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={bus.coordinate}
            title={`${bus.id} · ${bus.line}`}
            description={`${bus.status} · ${bus.destination}`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                backgroundColor: bus.inStop ? "#D97706" : "#09090B",
                borderColor: "#FFFFFF",
                borderWidth: 2,
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 15 }}>🚌</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
