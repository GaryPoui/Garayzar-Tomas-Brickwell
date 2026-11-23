export default class Usuario {
  constructor({
    nombre,
    email,
    salt,
    hash,
    rol,
    fechaNacimiento = null,
    telefono = '',
    activo = true,
  }) {
    Object.assign(this, { nombre, email, salt, hash, rol, fechaNacimiento, telefono, activo })
  }
}
