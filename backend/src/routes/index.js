import { Router } from "express";
import reservaRoutes from "./reservaRoutes.js";
import catalogoRoutes from "./catalogoRoutes.js";
import authRoutes from "./authRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/reservas", reservaRoutes);
router.use("/catalogo", catalogoRoutes);

export default router;
