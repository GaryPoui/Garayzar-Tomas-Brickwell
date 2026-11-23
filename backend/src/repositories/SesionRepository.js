import RecordRepository from './RecordRepository.js'
class SesionRepository extends RecordRepository {
  constructor() {
    super('sesiones')
  }
  findByKey(key) {
    return this.findAll().find((session) => session.key === key)
  }
  revokeUser(id) {
    for (const session of this.findAll()) if (session.usuario === id) this.delete(session.id)
  }
}
export default new SesionRepository()
