import mongoose from "mongoose";

import TemplateSchema from "./templateSchema";
import Image from "@classes/image";
import { ObjectId } from "utils";

const imageSchema = new mongoose.Schema<Image>({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "images", required: true },
    description: { type: String, required: true },
    hashtags: [
        { type: String }
    ],
    tags: [
        { type: String, ref: "users" }
    ],
    createdAt: { type: Date, default: Date.now }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export default class ImageSchema extends TemplateSchema<Image> {

    constructor() {
        super(imageSchema);
    }

    public async deleteUserImages(userId: ObjectId): Promise<void> {
        await this._model.deleteMany({
            author: userId
        });
    }

}