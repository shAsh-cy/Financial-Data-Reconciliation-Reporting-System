export type TokenResponse = {
  access_token: string;
  token_type: "bearer" | string;
};

export type UserRead = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "accountant" | "viewer" | string;
};

