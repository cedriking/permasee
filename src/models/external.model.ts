import { Typegoose, prop, Ref } from "@hasezoey/typegoose";
import { DBTransaction } from "./transaction.model";
import { DBTerm } from "./term.model";

export enum DBExternalType {
    PERMAWEB = 'permaweb',
    SOURCEWEB = 'source'
};

export class DBExternal extends Typegoose {
    @prop({ref: DBTerm, required: true})
    term!: Ref<DBTerm>;

    @prop({required: true, ref: DBTransaction})
    transaction!: Ref<DBTransaction>;

    @prop({ enum: DBExternalType })
    linkType?: DBExternalType;

    @prop({default: Date.now})
    createdAt: Date;

    @prop({default: Date.now})
    updatedAt: Date;
}

export const ExternalModel = new DBExternal().getModelForClass(DBExternal);