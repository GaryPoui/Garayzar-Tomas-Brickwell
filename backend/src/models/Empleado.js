import Usuario from './Usuario.js'
export default class Empleado extends Usuario {
  constructor(data) {
    super({ ...data, rol: 'RECEPCIONISTA' })
  }
}
