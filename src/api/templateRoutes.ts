import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { RouteParameters } from "express-serve-static-core";
import mongoose from "mongoose";
import { env } from "process";

export default class TemplateRoutes {
    protected readonly _clientUrl: string;

    constructor(protected _app: Express) {
        if (!env.CLIENT_URL)
            throw new Error("CLIENT_URL environment variable not found");
        this._clientUrl = env.CLIENT_URL;
        if (this._clientUrl.endsWith("/"))
            this._clientUrl = this._clientUrl.slice(0, -1);
    }

    protected _route<ReqBody = unknown, ResBody = unknown, P = RouteParameters<string>>(method: "get" | "post" | "put" | "delete", route: string, ...handlers: Array<RequestHandler<P, ResBody, ReqBody>>) {
        return this._app[method](route, handlers
            .map((handler) => (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) =>
                this._wrapper<P, ResBody, ReqBody>(req, res, next, handler)
            )
        );
    }

    private _wrapper<P, ResBody, ReqBody>(request: Request<P, ResBody, ReqBody>, response: Response<ResBody>, next: NextFunction, handler: RequestHandler<P, ResBody, ReqBody>): void {
        if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
            response.sendStatus(503);
            console.log("Database not connected:", mongoose.connection.readyState);
            return;
        }

        try {
            handler(request, response, next);
        } catch (error) {
            this._errorHandler(error, request, response, next);
        }
    }

    private _errorHandler<P, ResBody, ReqBody, ReqQuery>(error: unknown, _req: Request<P, ResBody, ReqBody, ReqQuery>, _res: Response, next: NextFunction): void {
        if (typeof error === "string")
            next(new Error(error));
        else if (error instanceof Error)
            next(error);
        else
            next(new Error("Unknown error"));
    }

}