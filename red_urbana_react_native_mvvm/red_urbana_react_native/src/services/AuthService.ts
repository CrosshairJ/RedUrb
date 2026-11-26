import { API_URL } from "../config/api";
import { User } from "../models";

export type AuthActionResult = {
  ok: boolean;
  user?: User;
  error?: string;
};

export const AuthService = {
  async register(newUser: User): Promise<AuthActionResult> {
    try {
      const res = await fetch(`${API_URL}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: newUser.email.trim().toLowerCase(),
          clave: newUser.password,
          nombre: newUser.name.trim(),
          rol: newUser.profile,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.message || "No fue posible crear la cuenta." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "No fue posible conectar con el servidor." };
    }
  },

  async login(email: string, password: string): Promise<AuthActionResult> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email.trim().toLowerCase(),
          clave: password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.message || "Credenciales incorrectas." };
      }

      return {
        ok: true,
        user: {
          name: data.nombre,
          email: email.trim().toLowerCase(),
          password,
          profile: data.rol === "Conductor" ? "Conductor" : "Pasajero",
        },
      };
    } catch {
      return { ok: false, error: "Servidor no disponible en este momento." };
    }
  },

  async changePassword(user: User, oldPass: string, newPass: string): Promise<AuthActionResult> {
    if (user.password !== oldPass) {
      return { ok: false, error: "La contraseña actual no es correcta." };
    }
    try {
      const res = await fetch(`${API_URL}/cambiar-clave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: user.email.trim().toLowerCase(),
          claveActual: oldPass,
          claveNueva: newPass,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.message || "No se pudo actualizar la contraseña." };
      }
      return { ok: true, user: { ...user, password: newPass } };
    } catch {
      return { ok: false, error: "No fue posible conectar con el servidor." };
    }
  },
};
