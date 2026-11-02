import { Router } from "express";
import { register, login, logout, requireAuth, limitAuth } from "../services/AuthService.js";
import ApiResponse from "../responses/ApiResponse.js";

const router = Router();
router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});
for (const [path, handler] of [["/registro", register], ["/login", login]]) {
    router.post(path, limitAuth, async (req, res, next) => {
        try {
            ApiResponse.success(res, await handler(req.body), path === "/registro" ? 201 : 200);
        } catch (error) {
            next(error);
        }
    });
}
router.get("/sesion", requireAuth, (req, res) => ApiResponse.success(res, req.user));
router.post("/logout", requireAuth, (req, res) => {
    logout(req.sessionKey);
    ApiResponse.success(res, null);
});
export default router;