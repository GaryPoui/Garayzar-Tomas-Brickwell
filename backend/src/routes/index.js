import { Router } from "express";
import reservaRoutes from "./reservaRoutes.js";
import catalogoRoutes from "./catalogoRoutes.js";

const router = Router();

router.use("/reservas", reservaRoutes);
router.use("/catalogo", catalogoRoutes);

export default router;
