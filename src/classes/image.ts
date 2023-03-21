import { isObjectId, NonFunctionProperties, ObjectId, toObjectId } from "../utils";
import TemplateObject from "./templateObject";
import User from "./user";

export enum Reaction {
    LOVE = "love",
    JOY = "joy",
    THUMBS_UP = "thumbs_up",
    THUMBS_DOWN = "thumbs_down",
    SAD = "sad",
    SWEAT_SMILE = "sweat_smile"
}

export default class Image extends TemplateObject {
    author?: ObjectId | User;
    description?: string;
    hashtags?: Array<string>;
    tags?: Array<ObjectId>;
    reactions?: Array<{ user: ObjectId | User, reaction: Reaction }>;
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
        if (image.reactions)
            this.reactions = image.reactions.map(userReaction => ({
                user: isObjectId(userReaction.user as ObjectId) ? toObjectId(userReaction.user as ObjectId) : new User(userReaction.user),
                reaction: userReaction.reaction
            }));
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
        if (this.reactions && (!Array.isArray(this.reactions) || this.reactions.some(userReaction => !Image.isValidReaction(userReaction.reaction))))
            throw "Invalid reaction";
        if (this.createdAt && (!(this.createdAt instanceof Date) || this.createdAt.getTime() > Date.now()))
            throw "Invalid createdAt";
        if (this.url && typeof this.url !== "string")
            throw "Invalid url";
        if (this.key && typeof this.key !== "string")
            throw "Invalid key";
    }

    public static isValidReaction(reaction: Reaction | string): boolean {
        return Object.values(Reaction).includes(reaction as Reaction);
    }
}