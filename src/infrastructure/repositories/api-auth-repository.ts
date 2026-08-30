import type { AuthRepository } from "@/core/interfaces/repositories";
import type { AuthUser, Session } from "@/core/types";
import apiClient from "@/infrastructure/api/api-client";

interface LoginResponse {
  user: AuthUser;
  token: string;
}

export class ApiAuthRepository implements AuthRepository {
  async login(username: string, password: string): Promise<AuthUser> {
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        username: username.trim().toLowerCase(),
        password,
      });

      const { user, token } = response.data;

      localStorage.setItem("authToken", token);
      const session: Session = {
        user,
        issuedAt: new Date().toISOString(),
      };
      localStorage.setItem("session", JSON.stringify(session));

      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("session");
    }
  }

  async getSession(): Promise<Session | null> {
    const sessionData = localStorage.getItem("session");
    if (!sessionData) return null;

    try {
      const session: Session = JSON.parse(sessionData);
      const response = await apiClient.get<AuthUser>("/auth/session");
      return {
        user: response.data,
        issuedAt: session.issuedAt,
      };
    } catch (error) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("session");
      return null;
    }
  }
}

export const apiAuthRepository = new ApiAuthRepository();
