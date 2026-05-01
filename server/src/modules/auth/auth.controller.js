import { validationResult } from 'express-validator';
import { AuthService } from './auth.service.js';
import { AppError } from '../../shared/errors/AppError.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class AuthController {
  #service;

  constructor() {
    this.#service = new AuthService();
    this.login = this.login.bind(this);
    this.me    = this.me.bind(this);
  }

  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 422));
    }

    try {
      const result = await this.#service.login(req.body.username, req.body.password);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  me(req, res) {
    sendSuccess(res, { user: req.user });
  }
}
