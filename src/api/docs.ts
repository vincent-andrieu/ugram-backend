import { Express, NextFunction, Request, Response } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { RouteWhitelister } from "@middlewares/authentification";
import TemplateRoutes from "./templateRoutes";
import swaggerJSDocConfig from "../swaggerJsDoc";

export default class DocumentationRoutes extends TemplateRoutes {

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app);

        this._init();

        routeWhitelister("/docs");
    }

    private _init() {

        this._route("get", "/docs", swaggerUi.setup(swaggerJsDoc(swaggerJSDocConfig), { explorer: true }),
            (_req: Request, res: Response, next: NextFunction) => {
                res.setHeader("Content-Type", "text/html");
                next();
            }
        );

    }
}