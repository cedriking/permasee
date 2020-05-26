import { prop, Typegoose, arrayProp, index } from '@hasezoey/typegoose';

@index({id: 'text'}, {unique: true, weights: {id: 4}})
@index({owner: 'text', title: 'text', description: 'text', body: 'text'}, {weights: {owner: 4, title: 3, description: 2, body: 1}, partialFilterExpression: { body: { $exists: false } }})
export class DBTransaction extends Typegoose {
    @prop({required: true, unique: true, trim: true})
    id!: string;

    @prop({required: true, trim: true})
    owner!: string;

    @prop({index: true, trim: true})
    target?: string;

    @prop({required: true, min: 0})
    block_height!: number;

    @prop({default: '', trim: true, index: true})
    title: string;

    @prop({default: '', trim: true})
    description: string;

    @prop({default: '', trim: true})
    body: string;

    @prop({default: '', trim: true})
    tags: string;

    @prop({required: true})
    createdAt!: Date;

    @prop({required: true, index: true})
    block_hash!: string;

    @prop({default: Date.now})
    savedAt?: Date;
}

export const TransactionModel = new DBTransaction().getModelForClass(DBTransaction);