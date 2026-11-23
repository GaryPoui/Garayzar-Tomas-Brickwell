// Explicit local demonstration mode. Normal production startup never supplies default accounts.
process.env.HOST = '127.0.0.1'
process.env.ADMIN_EMAIL = 'admin@brickwell.test'
process.env.ADMIN_PASSWORD = 'Brickwell-demo-12345'
process.env.RECEPCION_EMAIL = 'recepcion@brickwell.test'
process.env.RECEPCION_PASSWORD = 'Recepcion-demo-12345'
console.log('Demo local. Administración: admin@brickwell.test / Brickwell-demo-12345')
console.log('Recepción: recepcion@brickwell.test / Recepcion-demo-12345')
await import('../src/server.js')
