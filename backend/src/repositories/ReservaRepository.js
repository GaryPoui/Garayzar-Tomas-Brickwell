const reservas = [];
let siguienteId = 1;

class ReservaRepository {
    findAll() {
        return reservas;
    }

    findById(id) {
        return reservas.find((reserva) => String(reserva.id) === String(id));
    }

    create(reserva) {
        reserva.id = siguienteId++;
        reservas.push(reserva);
        return reserva;
    }

    update(id, datosActualizados) {
        const indice = reservas.findIndex(
            (reserva) => String(reserva.id) === String(id)
        );

        if (indice === -1) {
            return null;
        }

        reservas[indice] = {
            ...reservas[indice],
            ...datosActualizados,
            id: reservas[indice].id
        };

        return reservas[indice];
    }

    delete(id) {
        const indice = reservas.findIndex(
            (reserva) => String(reserva.id) === String(id)
        );

        if (indice === -1) {
            return null;
        }

        const [reservaEliminada] = reservas.splice(indice, 1);
        return reservaEliminada;
    }
}

export default new ReservaRepository();
