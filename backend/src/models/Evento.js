class Evento {
    constructor(id, nombre, fecha, descripcion, precioEntrada, capacidadMaxima, entradasDisponibles, estado, flyer) {
        this.id = id;
        this.nombre = nombre;
        this.fecha = fecha;
        this.descripcion = descripcion;
        this.precioEntrada = precioEntrada;
        this.capacidadMaxima = capacidadMaxima;
        this.entradasDisponibles = entradasDisponibles;
        this.estado = estado;
        this.flyer = flyer;
    }
}

export default Evento;
