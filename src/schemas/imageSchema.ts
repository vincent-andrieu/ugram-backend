import mongoose from "mongoose";

import Image from "@classes/image";
import { ObjectId } from "../utils";
import TemplateSchema from "./templateSchema";

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
        }).sort({ createdAt: -1 });

        return images.map((image) => new Image(image.toObject())) || [];
    }

    public async getPaginatedImages(
        page: number,
        size: number
    ) {
        const images = await this._model.find({}, undefined, {
            skip: page * size,
            limit: size
        }).sort({ createdAt: -1 });

        return images.map((image) => new Image(image.toObject())) || [];
    }

    public async getSearchPaginatedImages(
        page: number,
        size: number,
        hashtags: Array<string>,
        description: string
    ): Promise<{ hashtags: Array<Image>, description: Array<Image> }> {
        const descriptionWords = description.split(" ");
        const queries = [
            this._model.find({
                hashtags: {
                    $in: hashtags
                }
            }, undefined, {
                skip: page * size,
                limit: size
            })
                .populate("author")
                .sort({ createdAt: -1 }),

            this._model.aggregate([
                {
                    $addFields: {
                        descriptionWords: {
                            $split: ["$description", " "]
                        }
                    }
                },
                {
                    $match: {
                        descriptionWords: {
                            $in: descriptionWords
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: page * size
                },
                {
                    $limit: size
                },
                // {
                //     $lookup: {
                //         from: "users",
                //         localField: "author",
                //         foreignField: "_id",
                //         as: "author"
                //     }
                // },
                // {
                //     $addFields: {
                //         author: {
                //             $first: "$author"
                //         }
                //     }
                // },
                {
                    $project: {
                        key: 0,
                        descriptionWords: 0,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "author.auth": 0
                    }
                }
            ])
        ];

        const [hashtagsImages, descriptionImages] = await Promise.all(queries);

        return {
            hashtags: hashtagsImages.map((image) => new Image(image.toObject())),
            description: descriptionImages.map((image) => new Image(image))
        };
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