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
        description: { type: String },
        url: { type: String, required: true },
        key: { type: String, required: true, select: false },
        hashtags: [{ type: String }],
        tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
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
        })
            .populate("author")
            .sort({ createdAt: -1 });

        return images.map((image) => new Image(image.toObject())) || [];
    }

    public async getPaginatedImages(
        page: number,
        size: number,
        search?: string
    ) {
        const query: FilterQuery<Image> = {};
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
        })
            .sort({ createdAt: -1 })
            .populate("author");

        return images.map((image) => new Image(image.toObject())) || [];
    }

    public async updatePost(image: Image): Promise<Image> {
        const result = await this._model.findOneAndUpdate(
            {
                _id: image._id,
                author: image.author
            },
            {
                description: image.description,
                tags: image.tags,
                hashtags: image.hashtags
            }
        );

        if (!result)
            throw "Image not found";
        return new Image(result.toObject());
    }

    public async deletePost(imageId: ObjectId, userId: ObjectId): Promise<void> {
        await this._model.findOneAndDelete({
            _id: imageId,
            author: userId
        });
    }

    public async getUserImage(userId: ObjectId, imageId: ObjectId, projection?: string): Promise<Image> {
        const image = await this._model.findOne({
            _id: imageId,
            author: userId
        }, projection);

        if (!image)
            throw "Image not found";
        return new Image(image.toObject());
    }

    public async getUserImages(userId: ObjectId, projection?: string): Promise<Array<Image>> {
        const images = await this._model.find({
            author: userId
        }, projection);

        return images.map((image) => new Image(image.toObject()));
    }
}