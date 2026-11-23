import RecordRepository from './RecordRepository.js'
class UsuarioRepository extends RecordRepository {
  constructor() {
    super('usuarios')
  }
  async findByEmail(email) {
    return (await this.findAll()).find((user) => user.email === email)
  }
}
export default new UsuarioRepository()
