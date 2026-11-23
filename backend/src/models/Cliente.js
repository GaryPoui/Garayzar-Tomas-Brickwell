import Usuario from './Usuario.js'
export default class Cliente extends Usuario {
  constructor(data) {
    super({ ...data, rol: 'CLIENTE' })
  }
}
