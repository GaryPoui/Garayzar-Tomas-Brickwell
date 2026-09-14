class Reserva {
    constructor(
        id,
        fecha,
        horario,
        estado,
        cliente,
        sector,
        paquete,
        precioTotal,
        anticipo
    ) {
        this.id = id;
        this.fecha = fecha;
        this.horario = horario;
        this.estado = estado;
        this.cliente = cliente;
        this.sector = sector;
        this.paquete = paquete;
        this.precioTotal = precioTotal;
        this.anticipo = anticipo;
    }
}

export default Reserva;
