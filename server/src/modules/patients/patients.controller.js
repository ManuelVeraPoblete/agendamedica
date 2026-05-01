import { validationResult } from 'express-validator';
import { PatientService } from './patients.service.js';
import { AppError } from '../../shared/errors/AppError.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class PatientController {
  #service;

  constructor() {
    this.#service = new PatientService();
    this.create = this.create.bind(this);
    this.list   = this.list.bind(this);
  }

  async create(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 422));
    }
    try {
      const patient = await this.#service.create(req.user.profileId, req.body);
      sendSuccess(res, { patient }, 201);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const patients = await this.#service.listByDoctor(req.user.profileId);
      sendSuccess(res, { patients });
    } catch (err) {
      next(err);
    }
  }
}
