import mongoose from "mongoose";

import TemplateSchema from "./templateSchema";
import Image from "@classes/image";

const imageSchema = new mongoose.Schema<Image>({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
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

}