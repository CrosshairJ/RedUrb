import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../viewmodels";

type ButtonProps = { title: string; onPress: () => void; disabled?: boolean };

export function PrimaryButton({ title, onPress, disabled }: ButtonProps) {
  const { colors, dark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? colors.border : colors.primary,
        borderRadius: 12,
        padding: 15,
        alignItems: "center",
      }}
    >
      <Text style={{ color: disabled ? colors.muted : dark ? "#09090B" : "#FFFFFF", fontWeight: "800" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, disabled }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        borderColor: disabled ? colors.border : colors.primary,
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: disabled ? colors.muted : colors.primary, fontWeight: "700" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
