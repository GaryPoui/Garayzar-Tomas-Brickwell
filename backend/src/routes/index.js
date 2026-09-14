import { Router } from "express";
import reservaRoutes from "./reservaRoutes.js";

const router = Router();

router.use("/reservas", reservaRoutes);

export default router;
