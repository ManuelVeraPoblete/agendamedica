import { PatientRepository } from './patients.repository.js';

export class PatientService {
  #repo;

  constructor() {
    this.#repo = new PatientRepository();
  }

  async create(doctorId, data) {
    return this.#repo.create({ doctorId, ...data });
  }

  async listByDoctor(doctorId) {
    return this.#repo.findByDoctor(doctorId);
  }
}
