import { Express } from "express";
import { RequestBody } from "swagger-jsdoc";

import Image from "@classes/image";
import { RouteWhitelister } from "@middlewares/authentification";
import ImageSchema from "@schemas/imageSchema";
import UserSchema from "@schemas/userSchema";
import AWSService from "../init/aws";
import { ObjectId, toObjectId } from "../utils";
import TemplateRoutes from "./templateRoutes";

export default class ImageRoutes extends TemplateRoutes {
    private _awsService = new AWSService();
    private _userSchema = new UserSchema();
    private _imageSchema = new ImageSchema();

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app);

        routeWhitelister("/image/list");

        this._init();
    }

    private _init() {
        /**
         * @swagger
         * definitions:
         *   Image:
         *     type: object
         *     properties:
         *       _id:
         *         type: string
         *         format: ObjectId
         *         example: 63d2f127e7efe7d7c86eb35f
         *       url:
         *         type: string
         *         format: URL
         *       author:
         *         $ref: '#/definitions/User'
         *       description:
         *         type: string
         *       tags:
         *          type: array
         *          items:
         *            type: string
         *       hashtags:
         *         type: array
         *         items:
         *           type: string
         */

        /**
     * @swagger
     * /image/list/{id}:
     *   get:
     *     description: Get image by ID
     *     tags:
     *       - Image
     *     parameters:
     *       - name: id
     *         description: Image ID
     *         type: string
     *         in: path
     *     responses:
     *       200:
     *         description: Image object
     *         schema:
     *           $ref: '#/definitions/Image'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<never, Image>("get", "/image/list/:id", async (req, res) => {
            const image = await this._imageSchema.get(
                toObjectId(req.params.id)
            );

            res.send(image);
        });

        /**
     * @swagger
     * /image/avatar:
     *   post:
     *     description: Uploads an avatar image
     *     tags:
     *       - Image
     *     parameters:
     *       - name: file
     *         description: Image file
     *         type: File
     *         in: body
     *     responses:
     *       200:
     *         description: Image url
     *         schema:
     *           type: object
     *           properties:
     *             url:
     *               type: string
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<never, { url: string }>(
            "post",
            "/image/avatar",
            this._awsService.multer.single("file"),
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");

                if (!req.file)
                    throw new Error("No file found in request");
                const url = (req.file as Express.MulterS3.File).location;

                await this._userSchema.updateAvatar(req.user._id, url);

                res.send({ url });
            }
        );

        /**
     * @swagger
     * /image/post:
     *   post:
     *     description: Post an image by a user
     *     tags:
     *       - Image
     *     parameters:
     *       - name: file
     *         description: Image file
     *         type: Form Data
     *         in: body
     *     responses:
     *       200:
     *         description: Image
     *         schema:
     *           $ref: '#/definitions/Image'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<RequestBody, Image>(
            "post",
            "/image/post",
            this._awsService.multer.single("file"),
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");
                const description = req.body?.description || "";
                const tags: string | null = req.body?.tags || null;
                const checkedTags: Array<ObjectId> = tags?.split(",")?.map((tag) => toObjectId(tag)) || [];
                const hashtags: string = req.body?.hashtags || "";
                let parsedHashtags = hashtags.split(",");

                if (parsedHashtags.length === 1 && parsedHashtags[0] === "")
                    parsedHashtags = [];
                if (checkedTags)
                    if (!(await this._userSchema.exist(checkedTags)))
                        throw "Tagged users not found";

                const imageSchema = new Image({
                    author: toObjectId(req.user._id),
                    description,
                    url: (req.file as Express.MulterS3.File).location,
                    key: (req.file as Express.MulterS3.File).key,
                    tags: checkedTags,
                    hashtags: parsedHashtags
                });
                const image = await this._imageSchema.add(
                    imageSchema
                );

                res.send(image);
            }
        );

        /**
     * @swagger
     * /image/post:
     *   put:
     *     description: Update an image fields
     *     tags:
     *       - Image
     *     parameters:
     *       - name: imageId
     *         description: Image ID
     *         type: string
     *         in: body
     *       - name: description
     *         description: Image description
     *         type: string
     *         in: body
     *       - name: tags
     *         description: Image tags
     *         type: string
     *         in: body
     *       - name: hashtags
     *         description: Image hashtags
     *         type: string
     *         in: body
     *     responses:
     *       200:
     *         description: Image
     *         schema:
     *           $ref: '#/definitions/Image'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<RequestBody, Image>(
            "put",
            "/image/post",
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");

                const description = req.body?.description || "";

                const tags: string | null = req.body?.tags || null;

                const checkedTags: Array<ObjectId> = tags?.split(",")?.map((tag) => toObjectId(tag)) || [];
                const hashtags: string = req.body?.hashtags || "";

                let parsedHashtags = hashtags.split(",");
                if (parsedHashtags.length === 1 && parsedHashtags[0] === "")
                    parsedHashtags = [];

                if (checkedTags)
                    if (!(await this._userSchema.exist(checkedTags)))
                        throw "Tagged users not found";

                const result = await this._imageSchema.updatePost(new Image({
                    _id: req.body.imageId,
                    author: req.user._id,
                    description: description,
                    tags: checkedTags,
                    hashtags: parsedHashtags
                }));
                res.send(result);
            }
        );

        /**
     * @swagger
     * /image/post/{id}:
     *   delete:
     *     description: Deletes a post image
     *     tags:
     *       - Image
     *     parameters:
     *       - name: id
     *         description: Image ID
     *         type: string
     *         items:
     *           type: string
     *         in: path
     *     responses:
     *       200:
     *         description: OK
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<never, never>("delete", "/image/post/:id", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");

            const image = await this._imageSchema.getUserImage(req.user._id, toObjectId(req.params.id), "key");

            if (!image._id || !image.key)
                throw "Image not found";
            this._awsService.s3.deleteObject({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                Bucket: this._awsService.bucket,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                Key: image.key
            }, async (error) => {
                if (error)
                    throw error;

                await this._imageSchema.deletePost(image._id as ObjectId, req.user?._id as ObjectId);

                res.sendStatus(200);
            });
        });

        /**
     * @swagger
     * /image/list:
     *   get:
     *     description: Get list of all images from all users
     *     tags:
     *       - Image
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
     *         description: Search string to search a user by first name, last name, email or phone
     *         type: string
     *         in: query
     *     responses:
     *       200:
     *         description: List of images
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Image'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<never, Array<Image> | string>(
            "get",
            "/image/list",
            async (req, res) => {
                const page = Number(req.query.page) || 0;
                const size = Number(req.query.size) || 10;
                const search = req.query.search || "";

                if ((!page && typeof page !== "number") || !size || page < 0 || size < 0 || (search && typeof search !== "string"))
                    return res.status(400).send("Invalid parameters");
                const result = await this._imageSchema.getPaginatedImages(
                    page,
                    size,
                    search
                );

                res.send(result);
            }
        );

        /**
     * @swagger
     * /image/user/{id}:
     *   get:
     *     description: Get list of all images from user
     *     tags:
     *       - Image
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
     *         description: Search string to search a user by first name, last name, email or phone
     *         type: string
     *         in: query
     *       - name: id
     *         description: User ID
     *         type: string
     *         in: path
     *     responses:
     *       200:
     *         description: List of users
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Image'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
        this._route<never, Array<Image> | string>(
            "get",
            "/image/user/:id",
            async (req, res) => {
                const target = toObjectId(req.params.id);
                const page = Number(req.query.page) || 0;
                const size = Number(req.query.size) || 10;
                const search = req.query.search || "";

                if ((!page && typeof page !== "number") || !size || page < 0 || size < 0 || target === null ||
                    (search && typeof search !== "string"))
                    return res.status(400).send("Invalid parameters");
                const result = await this._imageSchema.getPaginatedImagesByUser(
                    target,
                    page,
                    size
                );

                res.send(result);
            }
        );
    }
}