import "module-alias/register.js";
import HealthRoutes from "@api/health";
import initExpress from "./init/express";

async function main() {
    const app = await initExpress();

    app.use((req, res, next) => {
        console.log(`[${req.method}]`, req.url);
        next();
    });

    new HealthRoutes(app);
}

main();