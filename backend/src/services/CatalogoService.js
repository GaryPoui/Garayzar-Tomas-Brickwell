import CatalogoRepository from "../repositories/CatalogoRepository.js";
import ReservaRepository from "../repositories/ReservaRepository.js";
import { BadRequestError, ConflictError } from "../exceptions/AppError.js";

export function validarFechaCatalogo(fecha) {
    const parsed = new Date(`${fecha}T12:00:00`);
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha || "") ||
        Number.isNaN(parsed.getTime()) ||
        `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}` !==
            fecha
    ) {
        throw new BadRequestError(
            "Ingresá una fecha válida para consultar las mesas.",
        );
    }
}

export function mesaOcupada(mesa, fecha, excluir) {
    return ReservaRepository.findAll().some(
        (reserva) =>
            reserva.id !== Number(excluir) &&
            reserva.fecha === fecha &&
            Number(reserva.mesa) === Number(mesa) &&
            ["PENDIENTE", "CONFIRMADA", "ACTIVA"].includes(reserva.estado),
    );
}

export function prepararMesa(datos, excluir) {
    if (datos.mesa === undefined) return {};
    const catalogo = CatalogoRepository.obtener();
    const mesa = catalogo.mesas.find((item) => item.id === Number(datos.mesa));
    const sector =
        mesa && catalogo.sectores.find((item) => item.id === mesa.sector);
    if (!mesa || !sector.disponible)
        throw new BadRequestError("Seleccioná una mesa válida.");
    const personas = Number(datos.personas);
    if (
        !Number.isSafeInteger(personas) ||
        personas < 1 ||
        personas > mesa.capacidad
    ) {
        throw new BadRequestError(
            `La mesa ${mesa.nombre} admite entre 1 y ${mesa.capacidad} personas.`,
        );
    }
    const seleccion = datos.combos ?? [];
    if (!Array.isArray(seleccion) || seleccion.length > 4) {
        throw new BadRequestError("Seleccioná combos válidos.");
    }
    const ids = new Set();
    const combos = seleccion.map((item) => {
        const paquete = catalogo.paquetes.find(
            (entry) =>
                entry.id === Number(item?.id) &&
                entry.precio > 0 &&
                entry.activo,
        );
        const cantidad = Number(item?.cantidad);
        if (
            !paquete ||
            ids.has(paquete.id) ||
            !Number.isSafeInteger(cantidad) ||
            cantidad < 1 ||
            cantidad > 10
        ) {
            throw new BadRequestError(
                "Cada combo debe tener una cantidad entre 1 y 10, sin duplicados.",
            );
        }
        ids.add(paquete.id);
        return {
            id: paquete.id,
            nombre: paquete.nombre,
            cantidad,
            precioUnitario: paquete.precio,
            subtotal: paquete.precio * cantidad,
        };
    });
    if (
        ["PENDIENTE", "CONFIRMADA", "ACTIVA"].includes(
            datos.estado || "PENDIENTE",
        ) &&
        mesaOcupada(mesa.id, datos.fecha, excluir)
    ) {
        throw new ConflictError(
            "Esa mesa ya está reservada para la fecha elegida. Seleccioná otra mesa.",
        );
    }
    return {
        mesa: mesa.id,
        personas,
        sector: sector.id,
        paquete: combos[0]?.id || 1,
        combos,
        detalleMesa: {
            ...mesa,
            sectorNombre: sector.nombre,
            tipo: sector.tipo,
            cercania: sector.cercania,
        },
        precioTotal:
            mesa.precio +
            combos.reduce((total, item) => total + item.subtotal, 0),
    };
}

export default {
    obtener(fecha, excluir) {
        const catalogo = CatalogoRepository.obtener();
        if (fecha !== undefined) validarFechaCatalogo(fecha);
        return {
            ...catalogo,
            fecha: fecha || null,
            mesas: catalogo.mesas.map((mesa) => ({
                ...mesa,
                disponible: fecha
                    ? !mesaOcupada(mesa.id, fecha, excluir)
                    : null,
            })),
        };
    },
};
