import { isObjectId, NonFunctionProperties, ObjectId, toObjectId } from "../utils";
import TemplateObject from "./templateObject";
import User from "./user";

export default class Image extends TemplateObject {
    author?: ObjectId | User;
    description?: string;
    hashtags?: Array<string>;
    tags?: Array<ObjectId>;
    createdAt?: Date;
    url?: string;
    key?: string; // AWS S3 key

    constructor(image: NonFunctionProperties<Image>) {
        super(image);

        if (image.author)
            this.author = isObjectId(image.author as ObjectId) ? toObjectId(image.author as ObjectId) : new User(image.author);
        this.description = image.description;
        this.hashtags = image.hashtags;
        this.tags = image.tags;
        if (Array.isArray(this.tags))
            this.tags = this.tags.map(tag => toObjectId(tag));
        this.createdAt = image.createdAt || new Date();
        this.url = image.url;
        this.key = image.key;

        this._validation();
    }

    protected _validation() {
        if (this.description && typeof this.description !== "string")
            throw "Invalid description";
        if (this.hashtags && (!Array.isArray(this.hashtags) || this.hashtags.some(hashtag => typeof hashtag !== "string")))
            throw "Invalid hashtags";
        if (this.tags && (!Array.isArray(this.tags) || (this.tags.length > 0 && !(this.tags.some(tag => isObjectId(tag))))))
            throw "Invalid tags";
        if (this.createdAt && (!(this.createdAt instanceof Date) || this.createdAt.getTime() > Date.now()))
            throw "Invalid createdAt";
        if (this.url && typeof this.url !== "string")
            throw "Invalid url";
        if (this.key && typeof this.key !== "string")
            throw "Invalid key";
    }
}