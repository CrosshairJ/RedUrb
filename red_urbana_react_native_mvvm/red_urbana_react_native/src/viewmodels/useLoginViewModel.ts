import { useState } from "react";
import { useAuth } from "./AuthViewModel";
import { FormResult } from "./FormResult";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useLoginViewModel() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (): Promise<FormResult> => {
    const correo = email.trim();
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
        message: "Ingresa un correo electrónico con formato válido.",
      };
    }
    if (!password.trim()) {
      return {
        ok: false,
        title: "Campo requerido",
        message: "Ingresa tu contraseña.",
      };
    }

    const res = await login(correo, password);
    if (!res.ok) {
      return {
        ok: false,
        title: "Error de acceso",
        message: res.error || "Credenciales incorrectas o servidor no disponible.",
      };
    }

    return { ok: true, title: "Bienvenido", message: "Sesión iniciada." };
  };

  return { email, setEmail, password, setPassword, submit };
}
