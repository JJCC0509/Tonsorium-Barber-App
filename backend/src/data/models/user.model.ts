export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  preferredShop: string;
  passwordHash: string;
  createdAt: string;
}
