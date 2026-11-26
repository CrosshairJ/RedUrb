import React from "react";
import { TextInput, View } from "react-native";
import { useTheme } from "../../viewmodels";
import { BodyText } from "./Typography";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
};

export function Field({ label, value, onChangeText, secureTextEntry, keyboardType }: FieldProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <BodyText style={{ fontWeight: "600", fontSize: 13 }}>{label}</BodyText>
      <TextInput
        placeholder={label}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCorrect={keyboardType !== "email-address"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={{
          color: colors.text,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      />
    </View>
  );
}
