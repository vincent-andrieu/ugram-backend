import { NextFunction, Request, Response } from "express";

export function loggerMiddleware(request: Request, _: Response, next: NextFunction) {
    console.log(`[\x1b[33m${request.method}\x1b[0m]`, "\x1b[32m" + request.url + "\x1b[0m");

    next();
}

export function errorLoggerMiddleware(error: Error, request: Request, _: Response, next: NextFunction) {
    console.error(`[\x1b[33m${request.method}\x1b[0m | \x1b[36mERROR\x1b[0m]`, "\x1b[32m" + request.url + "\x1b[0m", "=>", "\x1b[31m" + error.message + "\x1b[0m");

    next(error);
}