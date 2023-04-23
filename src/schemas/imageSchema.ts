import mongoose from "mongoose";

import Image, { Reaction } from "@classes/image";
import User from "@classes/user";
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
        reactions: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
                reaction: { type: String, enum: Object.values(Reaction) }
            }
        ],
        comments: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
                author: { type: String, required: true },
                comment: { type: String, required: true },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        thumbnail: {
            url: { type: String, required: true },
            key: { type: String, required: true, select: false }
        },
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

    public async get(id: Array<ObjectId>, projection?: string): Promise<Array<Image>>;
    public async get(id: ObjectId, projection?: string): Promise<Image>;
    public async get(id: Array<ObjectId> | ObjectId, projection?: string): Promise<Array<Image> | Image | never> {
        if (Array.isArray(id))
            return super.get(id, projection);
        else {
            const result = await super.get(id, projection, !projection || projection?.includes("reactions.user") ? "reactions.user" : undefined);

            if (result.reactions)
                result.reactions = result.reactions.map((userReaction) => {
                    delete (userReaction.user as User).auth;

                    userReaction.user = new User(userReaction.user);
                    return userReaction;
                });
            return result;
        }
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
        size: number
    ) {
        const images = await this._model.find({}, undefined, {
            skip: page * size,
            limit: size
        })
            .sort({ createdAt: -1 })
            .populate("author");

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
                {
                    $lookup: {
                        from: "users",
                        localField: "author",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $addFields: {
                        author: {
                            $first: "$author"
                        }
                    }
                },
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

    public async doesImageGotUserReaction(imageId: ObjectId, userId: ObjectId, reaction: Reaction): Promise<boolean> {
        const image = await this._model.findOne({
            _id: imageId,
            reactions: {
                $elemMatch: {
                    user: userId,
                    reaction: reaction
                }
            }
        });

        return !!image;
    }

    public async addReaction(imageId: ObjectId, userId: ObjectId, reaction: Reaction): Promise<void> {
        await this._model.updateOne({
            _id: imageId
        }, {
            $push: {
                reactions: {
                    user: userId,
                    reaction
                }
            }
        });
    }

    public async getPopularTags(): Promise<Array<{ tag: string }>> {
        const result = await this._model.aggregate([
            {
                $unwind: "$hashtags"
            },
            {
                $group: {
                    _id: "$hashtags",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 10
            }
        ]);
        return result;
    }

    public async getPopularUsers(): Promise<Array<{ user: User }>> {
        const topReferencedUsers = await this._model.aggregate([
            {
                $unwind: "$tags"
            },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    user: 1,
                    count: 1
                }
            }
        ]);

        return topReferencedUsers;
    }

    public async addComment(user: User, comment: string, imageId: ObjectId): Promise<void> {
        await this._model.updateOne({
            _id: imageId
        }, {
            $push: {
                comments: {
                    user: user._id,
                    author: user.useName || user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName,
                    comment: comment
                }
            }
        }
        );
    }
}