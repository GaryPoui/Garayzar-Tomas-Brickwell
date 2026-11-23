import RecordRepository from './RecordRepository.js'
class SesionRepository extends RecordRepository {
  constructor() {
    super('sesiones')
  }
  async findByKey(key) {
    return (await this.findAll()).find((session) => session.key === key)
  }
  async revokeUser(id) {
    for (const session of await this.findAll())
      if (session.usuario === id) await this.delete(session.id)
  }
}
export default new SesionRepository()
