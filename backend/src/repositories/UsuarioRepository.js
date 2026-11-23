import RecordRepository from './RecordRepository.js'
class UsuarioRepository extends RecordRepository {
  constructor() {
    super('usuarios')
  }
  findByEmail(email) {
    return this.findAll().find((user) => user.email === email)
  }
}
export default new UsuarioRepository()
