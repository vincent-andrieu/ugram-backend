import mongoose from "mongoose";

import Notification from "@classes/notification";
import { ObjectId } from "utils";
import TemplateSchema from "./templateSchema";

const schema = new mongoose.Schema<Notification>({
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export default class NotificationsSchema extends TemplateSchema<Notification> {
    constructor() {
        super(Notification, "notifications", schema);
    }

    public async getUserPaginatedNotifications(userId: ObjectId, page: number, limit: number): Promise<Array<Notification>> {
        const result = await this._model
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        return result.map((notification) => new Notification(notification.toObject()));
    }

    public async addUserNotification(userId: ObjectId, message: string): Promise<Notification>;
    public async addUserNotification(userId: Array<ObjectId>, message: string): Promise<Array<Notification>>;
    public async addUserNotification(userId: ObjectId | Array<ObjectId>, message: string): Promise<Notification | Array<Notification>> {
        if (Array.isArray(userId)) {
            const notifications = await this._model.insertMany(userId.map((id) => ({
                message,
                user: id
            })));

            return notifications.map((notification) => new Notification(notification.toObject()));
        } else {
            const notification = await this.add(new Notification({
                message,
                user: userId
            }));

            return notification;
        }
    }
}