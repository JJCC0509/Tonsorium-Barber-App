export interface RegisterBody {
  fullName: unknown;
  email: unknown;
  phone?: unknown;
  preferredShop?: unknown;
  password: unknown;
  confirmPassword: unknown;
}

export interface LoginBody {
  email: unknown;
  password: unknown;
  remember?: unknown;
}

export interface AuthUserDTO {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone?: string;
  preferredShop: string;
}

export interface AuthResponseDTO {
  token: string;
  user: AuthUserDTO;
}
