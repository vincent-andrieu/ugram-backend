import { Express } from "express";
import { env } from "process";
import sharp from "sharp";
import { RequestBody } from "swagger-jsdoc";

import Image, { Reaction, THUMBNAIL_CONFIG } from "@classes/image";
import { RouteWhitelister } from "@middlewares/authentification";
import ImageSchema from "@schemas/imageSchema";
import NotificationsSchema from "@schemas/notificationsSchema";
import UserSchema from "@schemas/userSchema";
import AWSService from "../init/aws";
import { isObjectId, ObjectId, toObjectId } from "../utils";
import TemplateRoutes from "./templateRoutes";

export default class ImageRoutes extends TemplateRoutes {
    private _awsService = new AWSService();
    private _userSchema = new UserSchema();
    private _imageSchema = new ImageSchema();
    private _notificationsSchema = new NotificationsSchema();

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
     *     description: Get image by ID with users reactions
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
            async (req, _, next) => {
                const tags: string | null = req.body?.tags || null;
                const checkedTags: Array<ObjectId> = tags?.split(",")?.map((tag) => toObjectId(tag)) || [];

                if (checkedTags)
                    if (!(await this._userSchema.exist(checkedTags)))
                        throw "Tagged users not found";

                next();
            },
            this._awsService.multer.single("file"),
            async (req, _, next) => {
                if (!req.file)
                    throw "Invalid file";
                const response = await fetch((req.file as Express.MulterS3.File).location);
                const arrayBuffer = await response.arrayBuffer();
                const buffer: Buffer = Buffer.alloc(arrayBuffer.byteLength);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < buffer.length; i++)
                    buffer[i] = view[i];
                const image = sharp(buffer).resize(THUMBNAIL_CONFIG.size.width, THUMBNAIL_CONFIG.size.height).png();
                const key = `${Date.now().toString()}_thumbnail`;

                await this._awsService.s3.putObject({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Bucket: this._awsService.bucket,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Key: key,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Body: await image.toBuffer(),
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    ContentType: "image/png"
                });
                req.body.thumbnail = {
                    url: `https://${this._awsService.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
                    key
                };

                next();
            },
            async (req, res) => {
                if (!req.user?._id)
                    throw new Error("Authenticated user not found");
                if (!req.file)
                    throw "Invalid file";
                const description = req.body.description || "";
                const tags: string | null = req.body?.tags || null;
                const checkedTags: Array<ObjectId> = tags?.split(",")?.map((tag) => toObjectId(tag)) || [];
                const hashtags: string = req.body.hashtags || "";
                let parsedHashtags = hashtags.split(",");

                if (parsedHashtags.length === 1 && parsedHashtags[0] === "")
                    parsedHashtags = [];

                const image = await this._imageSchema.add(new Image({
                    author: req.user._id,
                    description,
                    url: (req.file as Express.MulterS3.File).location,
                    key: (req.file as Express.MulterS3.File).key,
                    tags: checkedTags,
                    hashtags: parsedHashtags,
                    thumbnail: req.body.thumbnail
                }));

                res.send(image);

                const user = await this._userSchema.get(req.user._id, "useName firstName lastName");
                const userName = user.useName || (user?.lastName ? user?.firstName + " " + user?.lastName : user?.firstName);
                this._notificationsSchema.addUserNotification(checkedTags, "You were tagged in " + userName + "'s post");
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

                const user = await this._userSchema.get(req.user._id, "useName firstName lastName");
                const userName = user.useName || (user?.lastName ? user?.firstName + " " + user?.lastName : user?.firstName);
                this._notificationsSchema.addUserNotification(checkedTags, "You were tagged in " + userName + "'s post");
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
     *         description: Search string to search by hashtags and description
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

                if ((!page && typeof page !== "number") || !size || page < 0 || size < 0)
                    return res.status(400).send("Invalid parameters");
                const result = await this._imageSchema.getPaginatedImages(
                    page,
                    size
                );

                res.send(result);
            }
        );

        /**
         * @swagger
         * /image/search:
         *   get:
         *     description: Get list of all images from all users by a search string
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
         *         description: Search string to search by hashtags and description. Hashtags must start by # and words split by space.
         *         type: string
         *         in: query
         *     responses:
         *       200:
         *         description: Search result successfully returned
         *         schema:
         *           type: object
         *           properties:
         *             hashtags:
         *               type: array
         *               items:
         *                 $ref: '#/definitions/Image'
         *             description:
         *               type: array
         *               items:
         *                 $ref: '#/definitions/Image'
         *       400:
         *         description: Invalid parameters
         *       401:
         *         description: Unauthorized
         */
        this._route<never, { hashtags: Array<Image>, description: Array<Image> }>("get", "/image/search", async (req, res) => {
            const page = Number(req.query.page) || 0;
            const size = Number(req.query.size) || 10;
            const search = req.query.search;

            if ((!page && typeof page !== "number") || !size || page < 0 || size < 0 || typeof search !== "string")
                throw "Invalid parameters";

            const hashtags: Array<string> = [];
            const description: Array<string> = [];

            search.split(" ").forEach((word) => {
                if (word.startsWith("#")) {
                    if (word.length > 1)
                        hashtags.push(word.substring(1));
                } else
                    description.push(word);
            });

            res.send(await this._imageSchema.getSearchPaginatedImages(page, size, hashtags, description.join(" ")));
        });

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
        this._route<never, Array<Image>>(
            "get",
            "/image/user/:id",
            async (req, res) => {
                const target = toObjectId(req.params.id);
                const page = Number(req.query.page) || 0;
                const size = Number(req.query.size) || 10;
                const search = req.query.search || "";

                if ((!page && typeof page !== "number") || !size || page < 0 || size < 0 || target === null ||
                    (search && typeof search !== "string"))
                    throw "Invalid parameters";
                const result = await this._imageSchema.getPaginatedImagesByUser(
                    target,
                    page,
                    size
                );

                res.send(result);
            }
        );


        /**
         * @swagger
         * /image/{id}/reaction:
         *   post:
         *     description: Add user reaction to an image
         *     tags:
         *       - Image
         *       - Reaction
         *     parameters:
         *       - name: id
         *         description: Image ID
         *         type: string
         *         in: path
         *       - name: reaction
         *         description: Reaction name (love, joy, thumbs_up, thumbs_down, sad, sweat_smile)
         *         type: string
         *         in: body
         *     responses:
         *       200:
         *         description: Reaction successfully added
         *       400:
         *         description: Invalid parameters
         *       401:
         *         description: Unauthorized
         */
        this._route<{ reaction: Reaction }, never>("post", "/image/:id/reaction", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");
            const target = toObjectId(req.params.id);
            const reaction = req.body.reaction;

            if (!isObjectId(target) || !reaction || !Image.isValidReaction(reaction))
                throw "Invalid parameters";

            if (await this._imageSchema.doesImageGotUserReaction(target, req.user._id, reaction))
                throw "User already reacted with this reaction";

            await this._imageSchema.addReaction(target, req.user._id, reaction);

            res.sendStatus(200);

            try {
                const image = await this._imageSchema.get(target, "author");

                if (image.author && !(image.author._id || image.author as ObjectId).equals(req.user._id))
                    this._notificationsSchema.addUserNotification(image.author._id || image.author as ObjectId, (req.user.useName || (req.user.lastName && req.user.firstName) ? `${req.user.firstName} ${req.user.lastName}` : req.user.firstName) + " reacted to your image");
            } catch (error) {
                console.warn(error);
            }
        });

        /**
         * @swagger
         * /image/tags/popular:
         *   get:
         *     description: Get list of popular tags
         *     tags:
         *       - Image
         *       - Hashtags
         *     responses:
         *       200:
         *         description: List of popular tags
         *       401:
         *         description: Unauthorized
         */
        this._route<never, { tag: string }[]>("get", "/image/tags/popular", async (_, res) => {
            const result = await this._imageSchema.getPopularTags();
            res.send(result);
        });

        /**
         * @swagger
         * /image/:id/comment:
         *   post:
         *     description: Add comment to an image
         *     tags:
         *       - Image
         *     parameters:
         *      - name: user
         *      description: User ID
         *      type: string
         *    in: body
         *      - name: comment
         *      description: Comment
         *      type: string
         *      in: body
         *     responses:
         *       200:
         *       400:
         *         description: Invalid parameters
         */
        this._route<{ user: string, comment: string }, never>("post", "/image/:id/comment", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");
            const id = req.params.id;
            if (!isObjectId(id))
                throw "Invalid parameters";

            const { user, comment } = req.body;
            if (!comment || !user)
                throw "Invalid parameters";

            const fullUser = await this._userSchema.get(toObjectId(user));

            await this._imageSchema.addComment(fullUser, comment, toObjectId(id));
            res.sendStatus(200);

            try {
                if (fullUser._id && !fullUser._id.equals(req.user._id))
                    this._notificationsSchema.addUserNotification(fullUser._id, (req.user.useName || (req.user.lastName && req.user.firstName) ? `${req.user.firstName} ${req.user.lastName}` : req.user.firstName) + " commented on your image");
            } catch (error) {
                console.warn(error);
            }
        });
    }
}