import { RouteWhitelister } from "@middlewares/authentification";
import { Express } from "express";
import passport, { AuthenticateOptions } from "passport";

import TemplateRoutes from "./templateRoutes";

export default class AuthRoutes extends TemplateRoutes {
    private readonly _defaultLoginAuthenticateOptions: Readonly<AuthenticateOptions> = {
        failureRedirect: this._clientUrl + "/auth/login/failure",
        successRedirect: this._clientUrl + "/auth/login/success"
    };
    private readonly _defaultRegisterAuthenticateOptions: Readonly<AuthenticateOptions> = {
        failureRedirect: this._clientUrl + "/auth/register/failure",
        successRedirect: this._clientUrl + "/auth/register/success"
    };

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app);

        this._init();

        routeWhitelister("/auth/local");
        routeWhitelister("/auth/discord");
        routeWhitelister("/auth/github");
        routeWhitelister("/auth/google");
    }

    private _init() {

        /**
         * @swagger
         * /auth/logout:
         *   post:
         *     description: Logout
         *     tags:
         *       - Auth
         *     responses:
         *       200:
         *         description: Logout
         *       401:
         *         description: Unauthorized
         */
        this._route("post", "/auth/logout", (req, res, next) =>
            req.logout((error) => {
                if (error)
                    return next(error);
                res.sendStatus(200);
            })
        );

        /**
         * @swagger
         * /auth/local/login:
         *   get:
         *     description: Login with local strategy
         *     tags:
         *       - Auth
         *       - Local
         *     parameters:
         *       - name: email
         *         type: string
         *         in: query
         *         required: true
         *         format: email
         *       - name: password
         *         description: Minimum 5 characters
         *         type: string
         *         in: query
         *         required: true
         *         format: password
         *     responses:
         *       302:
         *         description: Redirect to /auth/login/success or /auth/login/failure depending on the result
         */
        this._route("get", "/auth/local/login", passport.authenticate("local-login", this._defaultLoginAuthenticateOptions));

        /**
         * @swagger
         * /auth/local/register:
         *   get:
         *     description: Register with local strategy
         *     tags:
         *       - Auth
         *       - Local
         *     parameters:
         *       - name: email
         *         type: string
         *         in: query
         *         required: true
         *         format: email
         *       - name: password
         *         description: Minimum 5 characters
         *         type: string
         *         in: query
         *         required: true
         *         format: password
         *       - name: firstName
         *         description: User first name, only for registration
         *         type: string
         *         in: query
         *         required: true
         *       - name: lastName
         *         description: User last name, only for registration
         *         type: string
         *         in: query
         *         required: true
         *     responses:
         *       302:
         *         description: Redirect to /auth/register/success or /auth/register/failure depending on the result
         */
        this._route("get", "/auth/local/register", passport.authenticate("local-register", this._defaultRegisterAuthenticateOptions));

        /**
         * @swagger
         * /auth/discord/login:
         *   get:
         *     description: Login with discord strategy
         *     tags:
         *       - Auth
         *       - Discord
         *     responses:
         *       302:
         *         description: Successfully redirected to discord auth page
         */
        this._route("get", "/auth/discord/login", passport.authenticate("discord-login"));
        this._route("get", "/auth/discord/login/callback", passport.authenticate("discord-login", this._defaultLoginAuthenticateOptions));
        /**
         * @swagger
         * /auth/discord/register:
         *   get:
         *     description: Register with discord strategy
         *     tags:
         *       - Auth
         *       - Discord
         *     responses:
         *       302:
         *         description: Successfully redirected to discord auth page
         */
        this._route("get", "/auth/discord/register", passport.authenticate("discord-register"));
        this._route("get", "/auth/discord/register/callback", passport.authenticate("discord-register", this._defaultRegisterAuthenticateOptions));

        /**
         * @swagger
         * /auth/github/login:
         *   get:
         *     description: Login with github strategy
         *     tags:
         *       - Auth
         *       - GitHub
         *     responses:
         *       302:
         *         description: Successfully redirected to github auth page
         */
        this._route("get", "/auth/github/login", passport.authenticate("github-login"));
        // GitHub auth callbacks must be the same base between login and register
        this._route("get", "/auth/github/callback/login", passport.authenticate("github-login", this._defaultLoginAuthenticateOptions));
        /**
         * @swagger
         * /auth/github/register:
         *   get:
         *     description: Register with github strategy
         *     tags:
         *       - Auth
         *       - GitHub
         *     responses:
         *       302:
         *         description: Successfully redirected to github auth page
         */
        this._route("get", "/auth/github/register", passport.authenticate("github-register"));
        // GitHub auth callbacks must be the same base between login and register
        this._route("get", "/auth/github/callback/register", passport.authenticate("github-register", this._defaultRegisterAuthenticateOptions));

        /**
         * @swagger
         * /auth/google/login:
         *   get:
         *     description: Login with google strategy
         *     tags:
         *       - Auth
         *       - Google
         *     responses:
         *       302:
         *         description: Successfully redirected to google auth page
         */
        this._route("get", "/auth/google/login", passport.authenticate("google-login"));
        this._route("get", "/auth/google/login/callback", passport.authenticate("google-login", this._defaultLoginAuthenticateOptions));
        /**
         * @swagger
         * /auth/google/register:
         *   get:
         *     description: Register with google strategy
         *     tags:
         *       - Auth
         *       - Google
         *     responses:
         *       302:
         *         description: Successfully redirected to google auth page
         */
        this._route("get", "/auth/google/register", passport.authenticate("google-register"));
        this._route("get", "/auth/google/register/callback", passport.authenticate("google-register", this._defaultRegisterAuthenticateOptions));

    }
}