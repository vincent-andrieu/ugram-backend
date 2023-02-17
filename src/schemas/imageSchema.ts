import TemplateSchema from "./templateSchema";
import mongoose, { FilterQuery } from "mongoose";
import Image from "@classes/image";
import { ObjectId } from "../utils";

const imageSchema = new mongoose.Schema<Image>(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        description: { type: String, required: true },
        url: { type: String, required: true },
        hashtags: [{ type: String }],
        tags: [{ type: String, ref: "users" }],
        createdAt: { type: Date, default: Date.now }
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

export default class ImageSchema extends TemplateSchema<Image> {
    constructor() {
        super(Image, "images", imageSchema);
    }

    public async deleteUserImages(userId: ObjectId): Promise<void> {
        await this._model.deleteMany({
            author: userId
        });
    }

    public async getPaginatedImagesByUser(
        userId: ObjectId,
        page: number,
        size: number
    ) {
        const images = await this._model.find({ author: userId }, undefined, {
            skip: page * size,
            limit: size
        }).sort({ createdAt: -1 });

        return images.map((image) => new Image(image.toObject()));
    }

    public async getPaginatedImages(
        page: number,
        size: number,
        search?: string,
        userFilter: Array<ObjectId> = []
    ) {
        const query: FilterQuery<Image> = {
            $and: [{ _id: { $nin: userFilter } }]
        };
        if (search)
            query.$and?.push({
                $or: [
                    { description: { $regex: search, $options: "i" } },
                    { hashtags: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } }
                ]
            });
        const images = await this._model.find(query, undefined, {
            skip: page * size,
            limit: size
        }).sort({ createdAt: -1 });

        return images.map((image) => new Image(image.toObject()));
    }

    public async uploadPost(
        userId: ObjectId,
        url: string,
        description: string,
        tags: ObjectId[],
        hashtags: Array<string>
    ): Promise<Image> {
        const image = new Image({
            author: userId,
            url,
            description,
            tags,
            hashtags
        } as Image);

        return this.add(image);
    }

    public async updatePost(
        imageId: ObjectId,
        userId: ObjectId,
        description: string,
        tags: ObjectId[],
        hashtags: Array<string>
    ): Promise<Image> {
        const image = await this._model.findOneAndUpdate(
            {
                _id: imageId,
                author: userId
            },
            {
                description,
                tags,
                hashtags
            }
        );

        if (!image) throw new Error("Image not found");

        return new Image(image.toObject());
    }

    public async deletePost(imageId: ObjectId, userId: ObjectId): Promise<void> {
        await this._model.findOneAndDelete({
            _id: imageId,
            author: userId
        });
    }
}