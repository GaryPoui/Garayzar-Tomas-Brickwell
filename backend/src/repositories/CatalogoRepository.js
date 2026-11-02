import Sector from "../models/Sector.js";
import Paquete from "../models/Paquete.js";

const sectores = [
    {
        ...new Sector(1, "Frente al escenario", 80000, 24, true),
        tipo: "Living VIP",
        cercania: "Primera fila",
        fila: 1,
        descripcion: "Living para grupos, frente al escenario.",
        personasPorMesa: 6,
    },
    {
        ...new Sector(2, "Pista", 45000, 16, true),
        tipo: "Mesa de pista",
        cercania: "Zona central",
        fila: 2,
        descripcion: "Mesa en el centro del salón, junto a la pista.",
        personasPorMesa: 4,
    },
    {
        ...new Sector(3, "Barra", 30000, 8, true),
        tipo: "Mesa alta",
        cercania: "Fondo del salón",
        fila: 3,
        descripcion: "Mesa alta junto a la barra, alejada del escenario.",
        personasPorMesa: 2,
    },
];

const mesas = sectores.flatMap((sector) =>
    Array.from({ length: 4 }, (_, columna) => ({
        id: (sector.id - 1) * 4 + columna + 1,
        nombre: `${["V", "P", "B"][sector.id - 1]}${columna + 1}`,
        sector: sector.id,
        capacidad: sector.personasPorMesa,
        precio: sector.precio,
        fila: sector.fila,
        columna: columna + 1,
    })),
);

const paquetes = [
    new Paquete(1, "Solo mesa", "Sin consumición anticipada.", 0, true),
    {
        ...new Paquete(
            2,
            "Smirnoff + Speed",
            "Smirnoff 700 ml + 4 Speed de 250 ml + hielo.",
            38000,
            true,
        ),
        imagen: "bar",
    },
    {
        ...new Paquete(
            3,
            "Smirnoff + Sprite",
            "Smirnoff 700 ml + 2 Sprite de 1,5 l + hielo.",
            34000,
            true,
        ),
        imagen: "bar",
    },
    {
        ...new Paquete(
            4,
            "Branca + Coca-Cola",
            "Fernet Branca 750 ml + 2 Coca-Cola de 1,5 l + hielo.",
            42000,
            true,
        ),
        imagen: "whisky",
    },
    {
        ...new Paquete(
            5,
            "Gin + tónicas",
            "Gin 700 ml + 4 tónicas de 269 ml + limón e hielo.",
            45000,
            true,
        ),
        imagen: "citrus",
    },
];

export default {
    obtener() {
        return {
            moneda: "ARS",
            referencia:
                "Plano orientativo y tarifas de referencia, sujetos a confirmación del local.",
            sectores,
            mesas,
            paquetes,
        };
    },
};
