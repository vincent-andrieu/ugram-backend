import { Express } from "express";

import User, { RawUser } from "@classes/user";
import ImageSchema from "@schemas/imageSchema";
import UserSchema from "@schemas/userSchema";
import AWSService from "../init/aws";
import { isObjectId, toObjectId } from "../utils";
import TemplateRoutes from "./templateRoutes";

export default class UserRoutes extends TemplateRoutes {
    private _awsService = new AWSService();
    private _userSchema = new UserSchema();
    private _imageSchema = new ImageSchema();

    constructor(app: Express) {
        super(app);

        this._init();
    }

    private _init() {
        /**
         * @swagger
         * definitions:
         *   User:
         *     type: object
         *     properties:
         *       _id:
         *         type: string
         *         format: ObjectId
         *         example: 63d2f127e7efe7d7c86eb35f
         *       useName:
         *         type: string
         *       firstName:
         *         type: string
         *       lastName:
         *         type: string
         *       email:
         *         type: string
         *         format: email
         *       avatar:
         *         type: string
         *         format: Base64 or URL
         *       phone:
         *         description: Phone number starting with +
         *         type: string
         *         format: phone
         *       registrationDate:
         *         description: Date of registration (JS Date)
         *         type: string
         *         format: date-time
         */

        /**
         * @swagger
         * /user:
         *   get:
         *     description: Get the authenticated user or a user by id
         *     tags:
         *       - User
         *     parameters:
         *       - name: id
         *         description: User ID
         *         type: string
         *         in: path
         *     responses:
         *       200:
         *         schema:
         *           $ref: '#/definitions/User'
         *       401:
         *         description: Unauthorized
         */
        this._route<never, RawUser>("get", "/user", async (req, res) => {
            res.send(req.user);
        });

        this._route("get", "/user/popular", async (_, res) => {
            const result = await this._imageSchema.getPopularUsers();

            res.send(result);
        });

        this._route<never, RawUser>("get", "/user/:id", async (req, res) => {
            try {
                const result = await this._userSchema.get(toObjectId(req.params.id));

                res.send(result);
            } catch (error) {
                res.sendStatus(404);
            }
        });

        /**
         * @swagger
         * /users:
         *   get:
         *     description: Get a list of users
         *     tags:
         *       - User
         *     parameters:
         *       - name: page
         *         description: Page number. Default 0
         *         type: number
         *         in: query
         *       - name: size
         *         description: Page size. Default 10
         *         type: number
         *         in: query
         *       - name: search
         *         description: Search string to search a user by use name, first name, last name, email or phone
         *         type: string
         *         in: query
         *       - name: userFilter
         *         description: Array of user IDs to exclude from the result
         *         type: array
         *         items:
         *           type: string
         *         in: query
         *     responses:
         *       200:
         *         description: List of users
         *         schema:
         *           type: array
         *           items:
         *             $ref: '#/definitions/User'
         *       400:
         *         description: Invalid parameters
         *       401:
         *         description: Unauthorized
         */
        this._route<never, Array<RawUser> | string>("get", "/users", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");
            const page = Number(req.query.page || 0);
            const size = Number(req.query.size || 10);
            const search = req.query.search;
            const userFilter = (req.query.userFilter as Array<string>)?.map((userId: string) => toObjectId(userId)) || [];

            if (Number.isNaN(page) || Number.isNaN(size) || page < 0 || size < 0 ||
                (search && typeof search !== "string") ||
                !Array.isArray(userFilter) || userFilter.some((userId) => !isObjectId(userId))
            )
                return res.status(400).send("Invalid parameters");
            userFilter.push(req.user._id);
            const result = await this._userSchema.getPaginatedUsers(page, size, search, userFilter);

            res.send(result);
        });

        /**
         * @swagger
         * /user:
         *   put:
         *     description: Update the authenticated user
         *     tags:
         *       - User
         *     parameters:
         *       - name: firstName
         *         description: First name
         *         type: string
         *         in: body
         *       - name: lastName
         *         description: Last name
         *         type: string
         *         in: body
         *       - name: email
         *         description: Email
         *         type: string
         *         format: email
         *         in: body
         *       - name: phone
         *         description: Phone number starting with +
         *         type: string
         *         format: phone
         *         in: body
         *     responses:
         *       200:
         *         description: Updated user
         *         schema:
         *           $ref: '#/definitions/User'
         *       400:
         *         description: Invalid parameters
         *       401:
         *         description: Unauthorized
         */
        this._route<RawUser>("put", "/user", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");
            if (Object.keys(req.body).length === 0)
                return res.status(400).send("Invalid parameters");
            const user = new User(req.body);
            let fields = "";

            if (user.useName)
                fields += " useName";
            if (user.firstName)
                fields += " firstName";
            if (user.lastName)
                fields += " lastName";
            if (user.email)
                fields += " email";
            if (user.phone)
                fields += " phone";
            const result = await this._userSchema.updateById(req.user._id, user, fields);

            res.send(result);
        });

        /**
         * @swagger
         * /user:
         *   delete:
         *     description: Delete the authenticated user
         *     tags:
         *       - User
         *     responses:
         *       200:
         *         description: User deleted
         *       401:
         *         description: Unauthorized
         */
        this._route("delete", "/user", async (req, res, next) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");

            const images = await this._imageSchema.getUserImages(req.user._id, "key");

            if (images.length > 0)
                await this._awsService.s3.deleteObjects({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Bucket: this._awsService.bucket,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Delete: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        Objects: images.map((image) => ({ Key: image.key }))
                    }
                });

            await Promise.all([
                this._imageSchema.deleteUserImages(req.user._id),
                this._userSchema.delete(req.user._id)
            ]);

            req.logout((error) => {
                if (error)
                    return next(error);
                res.sendStatus(200);
            });
        });
    }
}