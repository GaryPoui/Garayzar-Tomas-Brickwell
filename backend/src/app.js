import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    "https://garypoui.github.io,http://localhost:5173,http://127.0.0.1:5173"
)
    .split(",")
    .map((origin) => origin.trim());
app.use(
    cors({
        origin: (origin, callback) =>
            callback(null, !origin || allowedOrigins.includes(origin)),
    }),
);
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            message: "API de Brickell's funcionando correctamente.",
        },
    });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
