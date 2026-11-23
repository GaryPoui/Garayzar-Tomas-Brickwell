export const isStaff = (user) => ['ADMIN', 'RECEPCIONISTA'].includes(user?.rol)
export const isAdmin = (user) => user?.rol === 'ADMIN'
export const publicUser = ({ id, nombre, email, rol, fechaNacimiento, telefono, activo }) => ({
  id,
  nombre,
  email,
  rol,
  fechaNacimiento,
  telefono,
  activo,
})
