import { isObjectId, NonFunctionProperties, ObjectId, toObjectId } from "../utils";
import TemplateObject from "./templateObject";
import User from "./user";

export default class Notification extends TemplateObject {
    message: string;
    user: ObjectId | User;
    createdAt?: Date;

    constructor(image: NonFunctionProperties<Notification>) {
        super(image);

        this.message = image.message;
        this.user = isObjectId(image.user as ObjectId) ? toObjectId(image.user as ObjectId) : new User(image.user);
        if (image.createdAt)
            this.createdAt = new Date(image.createdAt);

        this._validation();
    }

    protected _validation() {
        if (!this.message || typeof this.message !== "string")
            throw "Invalid message";
        if (this.createdAt && !(this.createdAt instanceof Date))
            throw "Invalid createdAt";
    }
}