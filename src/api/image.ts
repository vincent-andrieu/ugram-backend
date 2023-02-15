import { Express } from "express";

import User from "@classes/user";
import Image from "@classes/image";
import UserSchema from "@schemas/userSchema";
import TemplateRoutes from "./templateRoutes";
import { toObjectId, isObjectId } from "../utils";
import ImageSchema from "@schemas/imageSchema";
import { upload } from "../init/aws";
import mongoose from "mongoose";
import { ObjectId } from "utils";
import { RequestBody } from "swagger-jsdoc";

export default class ImageRoutes extends TemplateRoutes {
  private _userSchema = new UserSchema();
  private _imageSchema = new ImageSchema();
  private _upload = upload;

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
     *         type: array
     *       hashtags:
     *         type: array
     */

    /**
     * @swagger
     * /image/{id}:
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
    this._route<never, Image>("get", "/image/:id", async (req, res) => {
      const user_id =
        req.user?._id ||
        new mongoose.Types.ObjectId("63ea693806a23d323fee1388");
      if (!user_id) {
        throw new Error("Authenticated user not found");
      }

      const image = await this._imageSchema.getImageById(
        toObjectId(req.params.id)
      );

      if (!image) throw new Error("Image not found");

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
     *           $ref: '#/definitions/Image'
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
        const user_id =
          req.user?._id;
        if (!user_id) {
          throw new Error("Authenticated user not found");
        }

        const url = (req.file as Express.MulterS3.File).location;

        await this._userSchema.updateAvatar(user_id, url);

        res.send({ url });
      }
    );

    /**
     * @swagger
     * /image/post:
     *   post:
     *     description: Uploads an avatar image
     *     tags:
     *       - User
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
     *           type: object
     *           items:
     *             $ref: '#/definitions/Image'
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
        const user_id =
          req.user?._id
        if (!user_id) {
          throw new Error("Authenticated user not found");
        }

        const description = (req.body as RequestBody).description || "";
        let tags = (req.body as RequestBody).tags;
        let hashtags = (req.body as RequestBody).hashtags || "";
        hashtags = hashtags?.split(",");
        tags = tags?.split(",");

        const url = (req.file as Express.MulterS3.File).location;

        const taggedUsers: User[] = await this._userSchema.getUsersByIds(tags);

        const taggedUsersIds: ObjectId[] = taggedUsers.map((user) => user._id!);

        const image = await this._imageSchema.uploadPost(
          user_id,
          url,
          description,
          taggedUsersIds,
          hashtags
        );

        res.send(image);
      }
    );

    /**
     * @swagger
     * /image/post/{id}:
     *   post:
     *     description: Deletes a post image
     *     tags:
     *       - Image
     *       - User
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
      const user_id = req.user?._id || toObjectId("63ea693806a23d323fee1388");
      if (!user_id) {
        throw new Error("Authenticated user not found");
      }

      const id = toObjectId(req.params.id);

      await this._imageSchema.deletePost(id, user_id);

      res.status(200);
    });

    /**
     * @swagger
     * /image/list:
     *   get:
     *     description: Get list of all images from all users
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
     *         description: Search string to search a user by first name, last name, email or phone
     *         type: string
     *         in: query
     *       - name: imageFilter
     *         description: Array of user IDs to exclude from the result
     *         type: array
     *         items:
     *           type: string
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
        //
        if (!req.user?._id) throw new Error("Authenticated user not found");
        const page = Number(req.query.page) || 0;
        const size = Number(req.query.size) || 10;
        const search = req.query.search;
        const imageFilter =
          (req.query.imageFilter as Array<string>)?.map((userId: string) =>
            toObjectId(userId)
          ) || [];

        if (
          !page ||
          !size ||
          page < 0 ||
          size < 0 ||
          (search && typeof search !== "string") ||
          !Array.isArray(imageFilter) ||
          imageFilter.some((userId) => !isObjectId(userId))
        )
          return res.status(400).send("Invalid parameters");
        imageFilter.push(req.user._id);
        const result = await this._imageSchema.getPaginatedImages(
          page,
          size,
          search,
          imageFilter
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
     *         description: Search string to search a user by first name, last name, email or phone
     *         type: string
     *         in: query
     *       - name: userFilter
     *         description: Array of user IDs to exclude from the result
     *         type: array
     *         items:
     *           type: string
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
     *             $ref: '#/definitions/User'
     *       400:
     *         description: Invalid parameters
     *       401:
     *         description: Unauthorized
     */
    this._route<never, Array<Image> | string>(
      "get",
      "/image/list/:id",
      async (req, res) => {
        if (!req.user?._id) throw new Error("Authenticated user not found");
        const target = toObjectId(req.params.id);
        const page = Number(req.query.page) || 0;
        const size = Number(req.query.size) || 10;
        const search = req.query.search;
        const imageFilter =
          (req.query.imageFilter as Array<string>)?.map((userId: string) =>
            toObjectId(userId)
          ) || [];

        if (
          !page ||
          !size ||
          page < 0 ||
          size < 0 ||
          target === null ||
          (search && typeof search !== "string") ||
          !Array.isArray(imageFilter) ||
          imageFilter.some((userId) => !isObjectId(userId))
        )
          return res.status(400).send("Invalid parameters");
        imageFilter.push(req.user._id);
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
