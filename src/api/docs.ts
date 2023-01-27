import { Express } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { RouteWhitelister } from "@middlewares/authentification";
import swaggerJSDocConfig from "../swaggerJsDoc";
import TemplateRoutes from "./templateRoutes";

export default class DocumentationRoutes extends TemplateRoutes {

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app, {});

        this._init();

        routeWhitelister("/docs");

        app.use("/docs", swaggerUi.serve);
    }

    private _init() {

        /**
         * @swagger
         * /docs:
         *   get:
         *     description: Swagger documentation
         *     tags:
         *       - Documentation
         *     responses:
         *       200:
         *         description: Successfully sent
         */
        this._route("get", "/docs", swaggerUi.setup(swaggerJsDoc(swaggerJSDocConfig)));

    }
}