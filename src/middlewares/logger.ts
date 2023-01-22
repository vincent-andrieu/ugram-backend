import { NextFunction, Request, Response } from "express";

export function loggerMiddleware(request: Request, _: Response, next: NextFunction) {
    console.log(`[${request.method}]`, request.url);

    next();
}

export function errorLoggerMiddleware(error: Error, request: Request, _: Response, next: NextFunction) {
    console.error(`[ERROR | ${request.method}]`, request.url, "=>", error);

    next(error);
}