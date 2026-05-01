import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export class AuthService {
  #repo;

  constructor() {
    this.#repo = new AuthRepository();
  }

  async login(username, password) {
    const user = await this.#repo.findByUsername(username);

    if (!user || !user.is_active) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const payload = {
      userId:    user.id,
      profileId: user.profile_id,
      role:      user.role,
      name:      user.name,
    };

    if (user.role === 'secretary') {
      payload.doctorIds = await this.#repo.findDoctorIdsBySecretaryId(user.profile_id);
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: {
        id:        user.id,
        profileId: user.profile_id,
        username:  user.username,
        email:     user.email,
        name:      user.name,
        role:      user.role,
        ...(user.specialty    && { specialty:   user.specialty }),
        ...(user.avatar_color && { avatarColor: user.avatar_color }),
        ...(payload.doctorIds && { doctorIds:   payload.doctorIds }),
      },
    };
  }
}
