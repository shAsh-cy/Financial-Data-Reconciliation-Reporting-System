import type { TokenResponse, UserRead } from "../../../types/auth";
import { getApiClient } from "../../../api/client";

export const authApi = {
  async login(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);

    const res = await getApiClient().post<TokenResponse>("/api/v1/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data;
  },

  async me(): Promise<UserRead> {
    const res = await getApiClient().get<UserRead>("/api/v1/auth/me");
    return res.data;
  },
};

