import Usuario from './Usuario.js'
export default class Administrador extends Usuario {
  constructor(data) {
    super({ ...data, rol: 'ADMIN' })
  }
}
