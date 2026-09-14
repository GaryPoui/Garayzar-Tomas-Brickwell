import ReservaRepository from "../repositories/ReservaRepository.js";
import Reserva from "../models/Reserva.js";
import { Messages } from "../enums/Messages.js";
import { EstadosReserva } from "../enums/EstadoReserva.js";
import {
    BadRequestError,
    NotFoundError
} from "../exceptions/AppError.js";
import {
    validarCamposReserva,
    validarFechaReserva
} from "../utils/reservaValidator.js";

class ReservaService {
    obtenerTodas() {
        return ReservaRepository.findAll();
    }

    obtenerPorId(id) {
        const reserva = ReservaRepository.findById(id);

        if (!reserva) {
            throw new NotFoundError(Messages.RESERVATION_NOT_FOUND);
        }

        return reserva;
    }

    crear(datos) {
        validarCamposReserva(datos);
        validarFechaReserva(datos.fecha);

        const nuevaReserva = new Reserva(
            null,
            datos.fecha,
            datos.horario,
            EstadosReserva.PENDIENTE,
            datos.cliente,
            datos.sector,
            datos.paquete,
            Number(datos.precioTotal),
            Number(datos.anticipo)
        );

        return ReservaRepository.create(nuevaReserva);
    }

    modificar(id, datos) {
        const reservaExistente = this.obtenerPorId(id);

        const datosActualizados = {
            ...reservaExistente,
            ...datos,
            id: reservaExistente.id
        };

        validarCamposReserva(datosActualizados);

        if (datos.fecha !== undefined) {
            validarFechaReserva(datos.fecha);
        }

        if (
            datosActualizados.estado &&
            !Object.values(EstadosReserva).includes(datosActualizados.estado)
        ) {
            throw new BadRequestError(Messages.INVALID_RESERVATION_STATUS);
        }

        if (datos.precioTotal !== undefined) {
            datosActualizados.precioTotal = Number(datos.precioTotal);
        }

        if (datos.anticipo !== undefined) {
            datosActualizados.anticipo = Number(datos.anticipo);
        }

        return ReservaRepository.update(id, datosActualizados);
    }

    eliminar(id) {
        this.obtenerPorId(id);
        return ReservaRepository.delete(id);
    }
}

export default new ReservaService();
