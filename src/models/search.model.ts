import { Typegoose, prop, instanceMethod, InstanceType } from "@hasezoey/typegoose";

export class DBSearch extends Typegoose {
    @prop({required: true, trim: true, lowercase: true, index: true, unique: true})
    term: string;

    @prop({required: true, min: 1, default: 1})
    searched: number;

    @prop({required: true, default: Date.now})
    createdAt: Date;

    @prop({required: true, default: Date.now})
    updatedAt: Date;

    @instanceMethod
    async increment(this: InstanceType<DBSearch>) {
        this.searched++;
        this.updatedAt = new Date();
        return this.save();
    }
}

export const SearchModel = new DBSearch().getModelForClass(DBSearch);