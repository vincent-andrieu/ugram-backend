import { Express } from "express";

import User, { RawUser } from "@classes/user";
import Image from "@classes/image";
import UserSchema from "@schemas/userSchema";
import TemplateRoutes from "./templateRoutes";
import { toObjectId, isObjectId } from "../utils";
import ImageSchema from "@schemas/imageSchema";
import { upload } from "../init/aws";
import multers3 from "multer-s3";

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
     */

        /**
     * @swagger
     * /image/list
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
    this._route<never, {url: string}>(
      "post",
      "/image/avatar",
      upload.single('file'),
      async (req, res) => {
        let id = "ici";

        /* console.log((req.file as Express.MulterS3.File).location); */
        const url = (req.file as Express.MulterS3.File).location;

        res.send({ url });
      }
    );


    /**
     * @swagger
     * /image/list
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
     * /image/list/:id
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
        //
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
          size,
        );

        res.send(result);
      }
    );

  }
}
