import mongoose from "mongoose";

import TemplateObject from "@classes/templateObject";
import { ObjectId } from "../utils";

export default abstract class TemplateSchema<T extends TemplateObject> {
    protected _model: mongoose.Model<mongoose.Model<T>>;

    constructor(protected _ctor: { new(model: T): T }, collectionName: string, schema: mongoose.Schema) {
        this._model = mongoose.model<mongoose.Model<T>>(collectionName, schema);
    }

    public async add(obj: T): Promise<T> {
        return new this._ctor((await this._model.create(obj)).toObject());
    }

    public async get(id: Array<ObjectId>, projection?: string): Promise<Array<T>>;
    public async get(id: ObjectId, projection?: string): Promise<T>;
    public async get(id: Array<ObjectId> | ObjectId, projection?: string): Promise<Array<T> | T | never> {
        if (Array.isArray(id)) {
            const result = await this._model.find({ _id: { $in: id } }, projection);

            if (result.length !== id.length)
                throw new Error("TemplateSchema.get(Array) Not found");
            return result.map(obj => new this._ctor(obj.toObject()));
        }  else {
            const result = await this._model.findById(id, projection);

            if (!result)
                throw new Error("TemplateSchema.get(ObjectId) Not found");
            return new this._ctor(result.toObject());
        }
    }

    public async exist(id: Array<ObjectId>): Promise<boolean>;
    public async exist(id: ObjectId): Promise<boolean>;
    public async exist(id: Array<ObjectId> | ObjectId): Promise<boolean> {
        if (Array.isArray(id)) {
            const result = await this._model.countDocuments({ _id: { $in: id } });

            return result === id.length;
        }  else {
            const result = await this._model.exists({ _id: id });

            return !!result;
        }
    }

    public async update(obj: T) {
        if (!obj._id)
            throw new Error("TemplateSchema.update(obj) Invalid ID");
        return this.updateById(obj._id, obj);
    }
    public async updateById(id: ObjectId, obj: Omit<T, "_id">, fields = ""): Promise<T | never> {
        const result = await this._model.findByIdAndUpdate(id, this._parseFieldsSelector(fields, obj), { new: true });

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

    protected _parseFieldsSelector(fields: string, obj: Record<string, unknown>): Record<string, unknown> {
        if (fields.length === 0)
            return obj;
        let result = {};

        for (const field of fields.split(" "))
            result = {
                ...result,
                ...this._parseConcatenateField(field, obj)
            };

        return result;
    }

    private _parseConcatenateField<Target extends Record<string, unknown>, Source extends Record<string, unknown>>(field: string, obj: Source): Target {
        const result = {} as Target;

        if (field.includes(".")) {
            const fields = field.split(".");
            const parent = fields.shift();

            if (!parent || !obj[parent])
                throw new Error("TemplateSchema._parseConcatenateField Invalid field");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as any)[parent] = this._parseConcatenateField(fields.join("."), obj[parent] as Record<string, unknown>);
        } else
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as any)[field] = obj[field];

        return result;
    }
}