import { Express } from "express";
import { RequestBody } from "swagger-jsdoc";

import Image from "@classes/image";
import ImageSchema from "@schemas/imageSchema";
import UserSchema from "@schemas/userSchema";
import { upload } from "../init/aws";
import { ObjectId, toObjectId } from "../utils";
import TemplateRoutes from "./templateRoutes";

export default class ImageRoutes extends TemplateRoutes {
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
            upload.single("file"),
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");

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
        this._route<never, Image>(
            "post",
            "/image/post",
            upload.single("file"),
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");
                const description = (req.body as RequestBody)?.description || "";

                const tags: string | null = (req.body as RequestBody)?.tags || null;

                const checkedTags = tags?.split(",")?.map((tag) => toObjectId(tag));
                const hashtags: Array<string> = (req.body as RequestBody).hashtags?.split(",");

                const url = (req.file as Express.MulterS3.File).location;
                if (checkedTags)
                    if (!(await this._userSchema.exist(checkedTags)))
                        throw "Tagged users not found";
                const imageSchema = new Image({
                    author: toObjectId(req.user._id),
                    description,
                    url,
                    tags: checkedTags ?? [],
                    hashtags: hashtags ?? [""]
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
        this._route<never, Image>(
            "put",
            "/image/post",
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");

                const description = (req.body as RequestBody).description || "";
                const tags: Array<ObjectId> = ((req.body as RequestBody).tags || "")
                    .split(",")
                    .map((tag: string) => toObjectId(tag));
                const hashtags: Array<string> = (req.body as RequestBody).hashtags?.split(",");
                const imageId = (req.body as RequestBody).imageId;

                if (!(await this._userSchema.exist(tags)))
                    throw "Tagged users not found";

                const image = await this._imageSchema.updatePost(
                    imageId,
                    req.user._id,
                    description,
                    tags,
                    hashtags
                );
                res.send(image);
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

            await this._imageSchema.deletePost(toObjectId(req.params.id), req.user._id);

            res.status(200);
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
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");
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
     * /image/list/{id}:
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
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");
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