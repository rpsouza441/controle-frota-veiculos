import { User } from "../types";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type PublicSettings = {
  corporateEmailDomain: string;
};

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  getCurrentUser(token: string): Promise<User>;
  getPublicSettings(): Promise<PublicSettings>;
}
