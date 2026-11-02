import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import AppError, { BadRequestError, ConflictError } from "../exceptions/AppError.js";

const deriveKey = promisify(scrypt);
const users = new Map();
const sessions = new Map();
const attempts = new Map();
const duration = 7 * 24 * 60 * 60 * 1000;
const digest = (token) => createHash("sha256").update(token).digest("hex");
const publicUser = ({ id, nombre, email, rol }) => ({ id, nombre, email, rol });
export const isStaff = (user) => ["ADMIN", "RECEPCIONISTA"].includes(user?.rol);

function credentials(data) {
    if (!data || typeof data.email !== "string" || typeof data.password !== "string")
        throw new BadRequestError("Ingresá tu email y contraseña.");
    const email = data.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || data.password.length > 128)
        throw new BadRequestError("Ingresá un email y una contraseña válidos.");
    return { email, password: data.password };
}

function startSession(user) {
    const token = randomBytes(32).toString("hex");
    for (const [key, session] of sessions)
        if (session.expires <= Date.now()) sessions.delete(key);
    sessions.set(digest(token), { user, expires: Date.now() + duration });
    return { user: publicUser(user), token };
}

async function createUser(data, rol) {
    const { email, password } = credentials(data);
    const nombre = typeof data.nombre === "string" ? data.nombre.trim() : "";
    if (nombre.length < 2 || nombre.length > 80 || password.length < 10)
        throw new BadRequestError("Ingresá tu nombre y una contraseña de entre 10 y 128 caracteres.");
    if (users.has(email)) throw new ConflictError("Ya existe una cuenta con ese email.");
    const salt = randomBytes(16).toString("hex");
    const hash = await deriveKey(password, salt, 64);
    if (users.has(email)) throw new ConflictError("Ya existe una cuenta con ese email.");
    const user = { id: users.size + 1, nombre, email, salt, hash, rol };
    users.set(email, user);
    return user;
}

export async function register(data) {
    return startSession(await createUser(data, "CLIENTE"));
}

for (const [prefix, rol, nombre] of [["ADMIN", "ADMIN", "Administración"], ["RECEPCION", "RECEPCIONISTA", "Recepción"]]) {
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];
    if (Boolean(email) !== Boolean(password)) throw new Error(`Configurá ${prefix}_EMAIL y ${prefix}_PASSWORD juntos.`);
    if (email && password) await createUser({ email, password, nombre }, rol);
}

export async function login(data) {
    const { email, password } = credentials(data);
    const user = users.get(email);
    const hash = await deriveKey(password, user?.salt || "brickwell-unknown-user", 64);
    if (!user || !timingSafeEqual(hash, user.hash))
        throw new AppError("Email o contraseña incorrectos.", 401);
    return startSession(user);
}

export function limitAuth(req, res, next) {
    const now = Date.now();
    for (const [key, attempt] of attempts)
        if (attempt.expires <= now) attempts.delete(key);
    const key = req.ip;
    const attempt = attempts.get(key) || { count: 0, expires: now + 15 * 60 * 1000 };
    attempt.count++;
    attempts.set(key, attempt);
    if (attempt.count > 30) return next(new AppError("Demasiados intentos. Probá de nuevo en 15 minutos.", 429));
    next();
}

export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    const key = token ? digest(token) : "";
    const session = sessions.get(key);
    if (!session || session.expires <= Date.now()) {
        sessions.delete(key);
        return next(new AppError("Iniciá sesión para continuar.", 401));
    }
    req.user = publicUser(session.user);
    req.sessionKey = key;
    next();
}

export function logout(key) {
    sessions.delete(key);
}

export function requireStaff(req, res, next) {
    if (!isStaff(req.user)) return next(new AppError("Esta acción requiere permisos de administración o recepción.", 403));
    next();
}