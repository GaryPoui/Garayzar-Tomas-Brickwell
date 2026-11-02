import { test } from "node:test";
import assert from "node:assert/strict";
process.env.ADMIN_EMAIL = "admin-auth@example.com";
process.env.ADMIN_PASSWORD = "Admin-test-password-123";
process.env.RECEPCION_EMAIL = "recepcion-auth@example.com";
process.env.RECEPCION_PASSWORD = "Recepcion-test-password-123";
const { default: app } = await import("../src/app.js");

test("sesiones y reservas privadas por usuario", async () => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const send = async (path, method = "GET", body, token) => {
        const response = await fetch(`${base}${path}`, {
            method,
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        return { status: response.status, ...(await response.json()) };
    };
    try {
        assert.equal((await send("/reservas")).status, 401);
        assert.equal((await send("/reservas", "POST", {})).status, 401);
        const account = { nombre: "Tomas", email: "tomas@example.com", password: "Una-clave-segura-123" };
        assert.equal((await send("/auth/registro", "POST", { ...account, password: "corta" })).status, 400);
        const first = await send("/auth/registro", "POST", { ...account, rol: "ADMIN" });
        assert.equal(first.status, 201);
        assert.deepEqual(Object.keys(first.data.user).sort(), ["email", "id", "nombre", "rol"]);
        assert.equal(first.data.user.rol, "CLIENTE");
        const admin = await send("/auth/login", "POST", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
        assert.equal(admin.data.user.rol, "ADMIN");
        const reception = await send("/auth/login", "POST", { email: process.env.RECEPCION_EMAIL, password: process.env.RECEPCION_PASSWORD });
        assert.equal(reception.data.user.rol, "RECEPCIONISTA");
        assert.equal((await send("/auth/registro", "POST", account)).status, 409);
        assert.equal((await send("/auth/login", "POST", { ...account, password: "incorrecta" })).status, 401);
        const logged = await send("/auth/login", "POST", { ...account, email: " TOMAS@EXAMPLE.COM " });
        assert.equal(logged.status, 200);
        const token = logged.data.token;
        assert.equal((await send("/auth/sesion", "GET", undefined, token)).data.id, first.data.user.id);
        const second = await send("/auth/registro", "POST", { ...account, email: "otra@example.com" });
        const created = await send("/reservas", "POST", {
            fecha: "2099-12-10", horario: "23:30", cliente: second.data.user.id,
            mesa: 1, personas: 2, anticipo: 0, combos: [],
        }, token);
        assert.equal(created.status, 201);
        assert.equal(created.data.cliente, first.data.user.id);
        const path = `/reservas/${created.data.id}`;
        assert.equal((await send("/reservas", "GET", undefined, second.data.token)).data.length, 0);
        assert.equal((await send(path, "GET", undefined, second.data.token)).status, 404);
        for (const clientToken of [token, second.data.token]) {
            assert.equal((await send(path, "PUT", { estado: "CONFIRMADA" }, clientToken)).status, 403);
            assert.equal((await send(path, "DELETE", undefined, clientToken)).status, 403);
        }
        for (const staffToken of [admin.data.token, reception.data.token]) {
            assert.equal((await send("/reservas", "GET", undefined, staffToken)).data.length, 1);
            assert.equal((await send(path, "GET", undefined, staffToken)).status, 200);
        }
        const edited = await send(path, "PUT", { cliente: second.data.user.id, horario: "23:00", estado: "CONFIRMADA" }, admin.data.token);
        assert.equal(edited.status, 200);
        assert.equal(edited.data.cliente, first.data.user.id);
        assert.equal(edited.data.estado, "CONFIRMADA");
        assert.equal((await send(path, "PUT", { horario: "22:00" }, reception.data.token)).status, 200);
        assert.equal((await send(path, "DELETE", undefined, admin.data.token)).status, 200);
        assert.equal((await send("/auth/logout", "POST", {}, token)).status, 200);
        assert.equal((await send("/reservas", "GET", undefined, token)).status, 401);
        assert.equal((await send("/auth/sesion", "GET", undefined, "0".repeat(64))).status, 401);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});