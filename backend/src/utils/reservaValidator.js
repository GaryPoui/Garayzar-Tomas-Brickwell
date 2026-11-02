import { BadRequestError } from "../exceptions/AppError.js";
import { Messages } from "../enums/Messages.js";
import { validarFechaCatalogo } from "../services/CatalogoService.js";

const camposObligatorios = [
    "fecha",
    "horario",
    "cliente",
    "sector",
    "paquete",
    "precioTotal",
    "anticipo",
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
        !Number.isFinite(precioTotal) ||
        !Number.isFinite(anticipo) ||
        precioTotal < 0 ||
        anticipo < 0 ||
        anticipo > precioTotal
    ) {
        throw new BadRequestError(Messages.INVALID_PRICE);
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.horario)) {
        throw new BadRequestError("Ingresá un horario válido.");
    }
    for (const campo of ["cliente", "sector", "paquete"]) {
        if (
            !Number.isSafeInteger(Number(datos[campo])) ||
            Number(datos[campo]) < 1
        ) {
            throw new BadRequestError(
                "Los identificadores deben ser enteros mayores que cero.",
            );
        }
    }
};

export const validarFechaReserva = (fecha) => {
    validarFechaCatalogo(fecha);
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
