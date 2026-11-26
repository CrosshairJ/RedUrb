import { useState } from "react";
import { FormResult } from "./FormResult";
import { useAuth } from "./AuthViewModel";
import { useTheme } from "./ThemeViewModel";

export function useProfileViewModel() {
  const { user, changePassword, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const submitPasswordChange = async (): Promise<FormResult> => {
    if (!oldPass) {
      return {
        ok: false,
        title: "Campo requerido",
        message: "Ingresa tu contraseña actual.",
      };
    }
    if (newPass.length < 6) {
      return {
        ok: false,
        title: "Contraseña inválida",
        message: "La nueva contraseña debe tener al menos 6 caracteres.",
      };
    }
    if (oldPass === newPass) {
      return {
        ok: false,
        title: "Sin cambios",
        message: "La nueva contraseña debe ser diferente a la actual.",
      };
    }
    if (newPass !== confirm) {
      return {
        ok: false,
        title: "No coincide",
        message: "La confirmación de la nueva contraseña no coincide.",
      };
    }

    const res = await changePassword(oldPass, newPass);
    if (!res.ok) {
      return {
        ok: false,
        title: "Error",
        message: res.error || "La contraseña actual no es correcta.",
      };
    }

    setOldPass("");
    setNewPass("");
    setConfirm("");
    return { ok: true, title: "Éxito", message: "La contraseña fue actualizada." };
  };

  return {
    user,
    dark,
    toggleDark,
    logout,
    oldPass,
    setOldPass,
    newPass,
    setNewPass,
    confirm,
    setConfirm,
    submitPasswordChange,
  };
}
