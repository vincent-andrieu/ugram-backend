import mongoose from "mongoose";

import TemplateObject from "@classes/templateObject";
import { ObjectId } from "utils";

export default abstract class TemplateSchema<T extends TemplateObject> {
    private _model: mongoose.Model<mongoose.Model<T>>;
    private _ctor: new (obj: T) => T = TemplateObject as new (obj: T) => T;

    constructor(schema: mongoose.Schema) {
        this._model = mongoose.model<mongoose.Model<T>>("users", schema);
    }

    public async add(obj: T): Promise<T> {
        return new this._ctor((await this._model.create(obj)).toObject());
    }

    public async get(id: Array<ObjectId>): Promise<Array<T>>;
    public async get(id: ObjectId): Promise<T>;
    public async get(id: Array<ObjectId> | ObjectId): Promise<Array<T> | T | never> {
        if (Array.isArray(id)) {
            const result = await this._model.find({ _id: { $in: id } });

            if (result.length !== id.length)
                throw new Error("TemplateSchema.get(Array) Not found");
            return result.map(obj => new this._ctor(obj.toObject()));
        }  else {
            const result = await this._model.findById(id);

            if (!result)
                throw new Error("TemplateSchema.get(ObjectId) Not found");
            return new this._ctor(result.toObject());
        }
    }

    public async update(obj: T) {
        if (!obj._id)
            throw new Error("TemplateSchema.update(obj) Invalid ID");
        return this.updateById(obj._id, obj);
    }
    public async updateById(id: ObjectId, obj: Omit<T, "_id">): Promise<T | never> {
        const result = await this._model.findByIdAndUpdate(id, obj, { new: true }); // Select fields to update

        if (!result)
            throw new Error("TemplateSchema.update(id, obj) Not found");
        return new this._ctor(result.toObject());
    }

    public async delete(id: Array<ObjectId> | ObjectId): Promise<void | never> {
        if (Array.isArray(id)) {
            const result = await this._model.deleteMany({ _id: { $in: id } });

            if (result.deletedCount !== id.length)
                throw new Error("TemplateSchema.delete(Array) Not found");
        } else {
            const result = await this._model.deleteOne({ _id: id });

            if (result.deletedCount !== 1)
                throw new Error("TemplateSchema.delete(ObjectId) Not found");
        }
    }
}