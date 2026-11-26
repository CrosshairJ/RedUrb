import { useState } from "react";
import { Profile } from "../models";
import { FormResult } from "./FormResult";
import { useAuth } from "./AuthViewModel";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegisterViewModel() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>("Pasajero");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  const togglePasswordVisibility = () => setShowPass((prev) => !prev);

  const submit = async (): Promise<FormResult> => {
    const nombre = name.trim();
    const correo = email.trim().toLowerCase();

    if (nombre.length < 2) {
      return {
        ok: false,
        title: "Campo requerido",
        message: "Ingresa tu nombre completo (mínimo 2 caracteres).",
      };
    }
    if (!correo) {
      return {
        ok: false,
        title: "Campo requerido",
        message: "Ingresa tu correo electrónico.",
      };
    }
    if (!EMAIL_REGEX.test(correo)) {
      return {
        ok: false,
        title: "Correo inválido",
        message: "Ingresa un correo electrónico válido.",
      };
    }
    if (password.length < 6) {
      return {
        ok: false,
        title: "Contraseña insegura",
        message: "La contraseña debe tener al menos 6 caracteres.",
      };
    }
    if (password !== confirm) {
      return {
        ok: false,
        title: "No coincide",
        message: "La confirmación de contraseña no coincide.",
      };
    }

    const res = await register({
      name: nombre,
      email: correo,
      password,
      profile,
    });
    if (!res.ok) {
      return {
        ok: false,
        title: "Error de registro",
        message: res.error || "No fue posible crear la cuenta.",
      };
    }

    return {
      ok: true,
      title: "Registro exitoso",
      message: "Ahora inicia sesión con tu correo y contraseña.",
    };
  };

  return {
    name,
    setName,
    email,
    setEmail,
    profile,
    setProfile,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPass,
    togglePasswordVisibility,
    submit,
  };
}
