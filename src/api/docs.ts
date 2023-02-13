import { Express } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { RouteWhitelister } from "@middlewares/authentification";
import swaggerJSDocConfig from "../swaggerJsDoc";
import TemplateRoutes from "./templateRoutes";

export default class DocumentationRoutes extends TemplateRoutes {

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app, {});

        routeWhitelister("/docs");

        app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerJSDocConfig)));
    }

}