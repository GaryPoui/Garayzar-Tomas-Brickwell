import { test } from "node:test";
import assert from "node:assert/strict";
process.env.ADMIN_EMAIL = "admin-catalogo@example.com";
process.env.ADMIN_PASSWORD = "Admin-catalogo-testing-123";
const { default: app } = await import("../src/app.js");

test("catálogo por HTTP: sectores, mesas, precios y fecha válida", async () => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
        const response = await fetch(`${base}/catalogo?fecha=2099-12-01`);
        assert.equal(response.status, 200);
        const { success, data } = await response.json();
        assert.equal(success, true);
        assert.equal(data.sectores.length, 3);
        assert.equal(data.mesas.length, 12);
        assert.equal(data.paquetes.filter((item) => item.precio > 0).length, 4);
        assert.ok(
            data.mesas.every((mesa) => mesa.disponible && mesa.precio > 0),
        );
        assert.equal(
            (await fetch(`${base}/catalogo?fecha=2099-02-31`)).status,
            400,
        );
        const initial = await (await fetch(`${base}/catalogo`)).json();
        assert.ok(initial.data.mesas.every((mesa) => mesa.disponible === null));
        const corsResponse = await fetch(`${base}/catalogo`, {
            headers: { Origin: "https://garypoui.github.io" },
        });
        assert.equal(
            corsResponse.headers.get("access-control-allow-origin"),
            "https://garypoui.github.io",
        );
        const blockedOrigin = await fetch(`${base}/catalogo`, {
            headers: { Origin: "https://otro-sitio.example" },
        });
        assert.equal(
            blockedOrigin.headers.get("access-control-allow-origin"),
            null,
        );
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test("reservas de mesa: total del servidor, capacidad, combos y conflictos", async () => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const registration = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
    });
    const { data: session } = await registration.json();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` };
    const send = (path, method, data) =>
        fetch(`${base}${path}`, {
            method,
            headers,
            body: JSON.stringify(data),
        });
    const datos = {
        fecha: "2099-12-01",
        horario: "23:30",
        cliente: 1,
        mesa: 1,
        personas: 4,
        anticipo: 0,
        combos: [{ id: 2, cantidad: 2 }],
        precioTotal: 1,
    };
    const creadas = [];
    try {
        const created = await send("/reservas", "POST", datos);
        assert.equal(created.status, 201);
        const { data } = await created.json();
        creadas.push(data.id);
        assert.equal(data.precioTotal, 156000);
        assert.equal(data.detalleMesa.nombre, "V1");
        assert.equal(data.combos[0].subtotal, 76000);
        assert.equal((await send("/reservas", "POST", datos)).status, 409);
        const disponible = await (
            await fetch(`${base}/catalogo?fecha=${datos.fecha}`)
        ).json();
        assert.equal(disponible.data.mesas[0].disponible, false);
        const propio = await (
            await fetch(
                `${base}/catalogo?fecha=${datos.fecha}&excluir=${data.id}`,
            )
        ).json();
        assert.equal(propio.data.mesas[0].disponible, true);
        const edit = await send(`/reservas/${data.id}`, "PUT", {
            combos: [{ id: 5, cantidad: 1 }],
            precioTotal: 0,
        });
        assert.equal(edit.status, 200);
        assert.equal((await edit.json()).data.precioTotal, 125000);
        assert.equal(
            (
                await send("/reservas", "POST", {
                    ...datos,
                    mesa: 9,
                    personas: 3,
                })
            ).status,
            400,
        );
        for (const combos of [
            [{ id: 99, cantidad: 1 }],
            [{ id: 2, cantidad: 0 }],
            [
                { id: 2, cantidad: 1 },
                { id: 2, cantidad: 1 },
            ],
            "invalido",
        ]) {
            assert.equal(
                (await send("/reservas", "POST", { ...datos, mesa: 2, combos }))
                    .status,
                400,
            );
        }
        assert.equal(
            (await send(`/reservas/${data.id}`, "PUT", { estado: "" })).status,
            400,
        );
        assert.equal(
            (await send(`/reservas/${data.id}`, "PUT", { estado: "CANCELADA" }))
                .status,
            200,
        );
        const second = await send("/reservas", "POST", {
            ...datos,
            combos: [],
        });
        assert.equal(second.status, 201);
        const secondData = (await second.json()).data;
        creadas.push(secondData.id);
        assert.equal(secondData.precioTotal, 80000);
        assert.equal(
            (
                await send(`/reservas/${data.id}`, "PUT", {
                    estado: "CONFIRMADA",
                })
            ).status,
            409,
        );
        assert.equal(
            (
                await send(`/reservas/${secondData.id}`, "PUT", {
                    mesa: 2,
                    personas: 6,
                })
            ).status,
            200,
        );
        assert.equal((await send("/reservas", "POST", datos)).status, 201);
    } finally {
        const all = await (await fetch(`${base}/reservas`, { headers })).json();
        for (const reserva of all.data)
            await fetch(`${base}/reservas/${reserva.id}`, { method: "DELETE", headers });
        await new Promise((resolve) => server.close(resolve));
    }
});
