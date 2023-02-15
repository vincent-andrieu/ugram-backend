import { RouteWhitelister } from "@middlewares/authentification";
import { Express } from "express";
import passport, { AuthenticateOptions } from "passport";

import TemplateRoutes from "./templateRoutes";

export default class AuthRoutes extends TemplateRoutes {
    private readonly _defaultAuthenticateOptions: Readonly<AuthenticateOptions> = {
        // failureRedirect: this._clientUrl + "/auth/login",
        successRedirect: this._clientUrl + "/auth/success"
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
         * /auth/local:
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
         *       - name: firstName
         *         description: User first name, only for registration
         *         type: string
         *         in: query
         *         required: false
         *       - name: lastName
         *         description: User last name, only for registration
         *         type: string
         *         in: query
         *         required: false
         *     responses:
         *       302:
         *         description: Successfully logged in or registered. Redirected to /auth/success
         *       401:
         *         description: Unauthorized
         */
        this._route("get", "/auth/local", passport.authenticate("local", this._defaultAuthenticateOptions));

        /**
         * @swagger
         * /auth/discord:
         *   get:
         *     description: Login with discord strategy
         *     tags:
         *       - Auth
         *       - Discord
         *     responses:
         *       302:
         *         description: Successfully redirected to discord auth page
         *       401:
         *         description: Unauthorized
         */
        this._route("get", "/auth/discord", passport.authenticate("discord"));
        this._route("get", "/auth/discord/callback", passport.authenticate("discord", this._defaultAuthenticateOptions));

        /**
         * @swagger
         * /auth/github:
         *   get:
         *     description: Login with github strategy
         *     tags:
         *       - Auth
         *       - GitHub
         *     responses:
         *       302:
         *         description: Successfully redirected to github auth page
         *       401:
         *         description: Unauthorized
         */
        this._route("get", "/auth/github", passport.authenticate("github"));
        this._route("get", "/auth/github/callback", passport.authenticate("github", this._defaultAuthenticateOptions));

        /**
         * @swagger
         * /auth/google:
         *   get:
         *     description: Login with google strategy
         *     tags:
         *       - Auth
         *       - Google
         *     responses:
         *       302:
         *         description: Successfully redirected to google auth page
         *       401:
         *         description: Unauthorized
         */
        this._route("get", "/auth/google", passport.authenticate("google"));
        this._route("get", "/auth/google/callback", passport.authenticate("google", this._defaultAuthenticateOptions));

    }
}