// Usuario demo. El hash se genera con bcrypt al iniciar el módulo.
import bcrypt from 'bcryptjs';
import { User } from './models/user.model.js';

export const USERS: User[] = [
  {
    id: 'usr-1',
    fullName: 'Demo Tonsorium',
    email: 'demo@tonsorium.com',
    phone: undefined,
    preferredShop: 'Barber Chamos',
    passwordHash: bcrypt.hashSync('Demo12345', 10),
    createdAt: new Date().toISOString(),
  },
];
