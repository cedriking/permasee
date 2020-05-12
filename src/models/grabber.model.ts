import { prop, Typegoose, staticMethod, ModelType, arrayProp, instanceMethod, InstanceType } from '@hasezoey/typegoose';

export class GrabberStats extends Typegoose {
    @prop({required: true})
    currentBlock!: number;

    @prop({required: true, default: Date.now})
    updatedAt!: Date;

    @instanceMethod
    async updateCurrentBlock(this: InstanceType<GrabberStats>, newValue: number) {
        if(this.currentBlock < newValue) {
            this.currentBlock = newValue;
            this.updatedAt = new Date();
            return this.save();
        }

        return true;
    }

    @staticMethod
    static async get(this: ModelType<GrabberStats>) {
        return this.findOne({});
    }
}

export const GrabberStatsModel = new GrabberStats().getModelForClass(GrabberStats);