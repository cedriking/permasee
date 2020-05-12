import { prop, Typegoose, arrayProp } from '@hasezoey/typegoose';

export class DBTransaction extends Typegoose {
    @prop({required: true, unique: true, index: true, trim: true})
    id!: string;

    @prop({required: true, index: true, trim: true})
    owner!: string;

    @prop({index: true, trim: true})
    target?: string;

    @prop({required: true, min: 0})
    block_height!: number;

    @prop()
    tags: string;

    @prop({required: true})
    createdAt!: Date;

    @prop({required: true, index: true})
    block_hash!: string;

    @prop({default: Date.now})
    savedAt?: Date;
}

export const TransactionModel = new DBTransaction().getModelForClass(DBTransaction);