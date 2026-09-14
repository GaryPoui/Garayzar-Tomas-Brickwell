import { BadRequestError } from "../exceptions/AppError.js";
import { Messages } from "../enums/Messages.js";

const camposObligatorios = [
    "fecha",
    "horario",
    "cliente",
    "sector",
    "paquete",
    "precioTotal",
    "anticipo"
];

export const validarCamposReserva = (datos) => {
    const faltanCampos = camposObligatorios.some((campo) => {
        const valor = datos[campo];
        return valor === undefined || valor === null || valor === "";
    });

    if (faltanCampos) {
        throw new BadRequestError(Messages.MISSING_REQUIRED_FIELDS);
    }

    const precioTotal = Number(datos.precioTotal);
    const anticipo = Number(datos.anticipo);

    if (
        Number.isNaN(precioTotal) ||
        Number.isNaN(anticipo) ||
        precioTotal < 0 ||
        anticipo < 0
    ) {
        throw new BadRequestError(Messages.INVALID_PRICE);
    }
};

export const validarFechaReserva = (fecha) => {
    const fechaReserva = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(fechaReserva.getTime())) {
        throw new BadRequestError(Messages.INVALID_RESERVATION_DATE);
    }

    const manana = new Date();
    manana.setHours(0, 0, 0, 0);
    manana.setDate(manana.getDate() + 1);

    if (fechaReserva < manana) {
        throw new BadRequestError(Messages.INVALID_RESERVATION_DATE);
    }
};
