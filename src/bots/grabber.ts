
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

import esClient from '../services/elastic';
import { GrabberStatsModel, GrabberStats } from '../models/grabber.model';
import { IArweaveInfo } from '../interfaces/iarweaveinfo.interface';
import ArRequestService from '../services/arRequest';
import BlockService from '../services/block';
import TransactionService from '../services/transaction';
import UtilsService from '../services/utils';
import ITransaction from 'interfaces/transaction.interface';
import { PoolService } from '../services/pool';
import IBlock from '../interfaces/iblock.interface';

class Grabber {
    private stats: GrabberStats;
    private nodeHeight = 0;

    async start() {
        console.log('Starting...');

        let statsModel: GrabberStats = await GrabberStatsModel.findOne();
        if(!statsModel) {
            statsModel = await GrabberStatsModel.create({currentBlock: 0});
            this.stats = statsModel;
        }
        this.stats = statsModel;

        // TODO: Grab current block height
        const res:IArweaveInfo = await ArRequestService.get('/info');
        if(res) {
            this.nodeHeight = res.height;
        }

        // Start looking into each missing block
        return this.getBlockDetails(true);
    }

    async getBlockDetails(firstStart = false) {
        if(this.nodeHeight === this.stats.currentBlock) return true;

        const addToEnd = (firstStart && this.stats.currentBlock > 50)? 50 : 100;

        const start = (firstStart && this.stats.currentBlock-50) > 0? (this.stats.currentBlock-50) : this.stats.currentBlock;
        const end = (this.nodeHeight > (this.stats.currentBlock+addToEnd))? (this.stats.currentBlock+addToEnd) : this.nodeHeight;
        console.log(`\nGetting blocks ${start}...${end}`);

        const blocks: IBlock[] = await BlockService.getBlocksByHeight(start, end);
        const transactions: ITransaction[] = await BlockService.getBlockTxsWithType(blocks, 'text/html');
        
        // Save each transaction to elastic and mongodb
        console.log(`- Valid transactions: ${transactions.length}`);
        if(!transactions.length) {
            return this.newBlock(end);
        }

        const pool = new PoolService();
        for(let i = 0, j = transactions.length; i < j; i++) {
            pool.add(async () => TransactionService.saveTransaction(transactions[i]));
        }
        await pool.run(10);
        return this.newBlock(end);
    }

    async newBlock(increment: number = 0) {
        if(increment) await this.stats.updateCurrentBlock(increment);
        await UtilsService.pause(10);
        return this.getBlockDetails();
    }
}

const run = async () => {
    let grabber = new Grabber();
    try {
        await grabber.start();
    } catch(e) {
        console.log(e);
    }

    setTimeout(() => run(), 60000);
};
run();