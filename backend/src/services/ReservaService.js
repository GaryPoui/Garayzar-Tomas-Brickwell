import ReservaRepository from "../repositories/ReservaRepository.js";
import Reserva from "../models/Reserva.js";
import { prepararMesa } from "./CatalogoService.js";
import { Messages } from "../enums/Messages.js";
import { EstadosReserva } from "../enums/EstadoReserva.js";
import { BadRequestError, NotFoundError } from "../exceptions/AppError.js";
import {
    validarCamposReserva,
    validarFechaReserva,
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
        if (!datos || typeof datos !== "object" || Array.isArray(datos))
            throw new BadRequestError(Messages.INVALID_DATA);
        datos = { ...datos, estado: EstadosReserva.PENDIENTE };
        const seleccion = prepararMesa(datos);
        datos = { ...datos, ...seleccion };
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
            Number(datos.anticipo),
        );

        Object.assign(nuevaReserva, seleccion);
        return ReservaRepository.create(nuevaReserva);
    }

    modificar(id, datos) {
        const reservaExistente = this.obtenerPorId(id);
        if (!datos || typeof datos !== "object" || Array.isArray(datos))
            throw new BadRequestError(Messages.INVALID_DATA);

        const datosActualizados = {
            ...reservaExistente,
            ...Object.fromEntries(
                Object.entries(datos).filter(([campo]) =>
                    [
                        "fecha",
                        "horario",
                        "estado",
                        "cliente",
                        "sector",
                        "paquete",
                        "precioTotal",
                        "anticipo",
                        "mesa",
                        "personas",
                        "combos",
                    ].includes(campo),
                ),
            ),
            id: reservaExistente.id,
        };

        Object.assign(
            datosActualizados,
            prepararMesa(datosActualizados, reservaExistente.id),
        );
        validarCamposReserva(datosActualizados);

        if (datos.fecha !== undefined) {
            validarFechaReserva(datos.fecha);
        }

        if (!Object.values(EstadosReserva).includes(datosActualizados.estado)) {
            throw new BadRequestError(Messages.INVALID_RESERVATION_STATUS);
        }

        if (datos.precioTotal !== undefined && !datosActualizados.mesa) {
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
