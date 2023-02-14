import dotenv from "dotenv";
import "module-alias/register.js";
import { env } from "process";
import swaggerUi from "swagger-ui-express";

import AuthRoutes from "@api/auth";
import DocumentationRoutes from "@api/docs";
import HealthRoutes from "@api/health";
import UserRoutes from "@api/user";
import AuthentificationMiddleware from "@middlewares/authentification";
import { errorLoggerMiddleware, loggerMiddleware } from "@middlewares/logger";
import initDatabase from "./init/database";
import initExpress from "./init/express";
import ImageRoutes from "@api/image";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("Server starting...");
    initDatabase();
    const app = await initExpress();
    const authentificationMiddleware = new AuthentificationMiddleware();

    // Middlewares
    app.use(loggerMiddleware);
    app.use(authentificationMiddleware.handler.bind(authentificationMiddleware));

    // Documentation
    if (env.NODE_ENV !== "production")
        new DocumentationRoutes(app, authentificationMiddleware.whitelistRoute);

    // Routes
    new HealthRoutes(app, authentificationMiddleware.whitelistRoute);
    new AuthRoutes(app, authentificationMiddleware.whitelistRoute);
    new UserRoutes(app);
    new ImageRoutes(app);

    // Error middlewares
    app.use(errorLoggerMiddleware);
}

main();
