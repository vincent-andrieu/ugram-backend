import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { RouteParameters } from "express-serve-static-core";

export default class TemplateRoutes {

    constructor(protected _app: Express) {}

    protected _route<ReqBody = unknown, ResBody = unknown, P = RouteParameters<string>>(method: "get" | "post" | "put" | "delete", route: string, ...handlers: Array<RequestHandler<P, ResBody, ReqBody>>) {
        return this._app[method](route, handlers
            .map((handler) => (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) =>
                this._wrapper<P, ResBody, ReqBody>(req, res, next, handler)
            )
        );
    }

    private _wrapper<P, ResBody, ReqBody>(request: Request<P, ResBody, ReqBody>, response: Response<ResBody>, next: NextFunction, handler: RequestHandler<P, ResBody, ReqBody>): void {
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