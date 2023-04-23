import { Express } from "express";

import Notification from "@classes/notification";
import NotificationsSchema from "@schemas/notificationsSchema";
import TemplateRoutes from "./templateRoutes";

export default class NotificationsRoutes extends TemplateRoutes {
    private _notificationsSchema = new NotificationsSchema();

    constructor(app: Express) {
        super(app);

        this._init();
    }

    private _init() {
        /**
         * @swagger
         * definitions:
         *   Notification:
         *     type: object
         *     properties:
         *       _id:
         *         type: string
         *         format: ObjectId
         *         example: 63d2f127e7efe7d7c86eb35f
         *       message:
         *         type: string
         *       user:
         *         $ref: '#/definitions/User'
         *       description:
         *         type: string
         *       createdAt:
         *         type: string
         *         format: date-time
         */

        /**
         * @swagger
         * /notifications:
         *   get:
         *     description: Get user notifications
         *     tags:
         *       - Notifications
         *     parameters:
         *       - name: page
         *         description: Page number
         *         type: integer
         *         in: query
         *         default: 0
         *         required: false
         *       - name: size
         *         description: Page size
         *         type: integer
         *         in: query
         *         default: 10
         *         required: false
         *     responses:
         *       200:
         *         description: User notifications successfully retrieved
         *         schema:
         *           type: array
         *           items:
         *             $ref: '#/definitions/Notification'
         *       401:
         *         description: Unauthorized
         */
        this._route<never, Array<Notification>>("get", "/notifications", async (req, res) => {
            if (!req.user?._id)
                throw new Error("Authenticated user not found");
            const page = Number(req.query.page || 0);
            const size = Number(req.query.size || 10);

            if (Number.isNaN(page) || Number.isNaN(size) || page < 0 || size < 0)
                throw "Invalid parameters";
            const notifications = await this._notificationsSchema.getUserPaginatedNotifications(req.user._id, page, size);

            res.send(notifications);
        });

    }
}