import { arRequestService } from "./arRequest";
import ITransaction from "../interfaces/transaction.interface";
import UtilsService from "./utils";
import { PoolService } from "./pool";
import { TransactionModel } from "../models/transaction.model";
import Transaction from "arweave/node/lib/transaction";
import Arweave from "arweave/node";
import Progress from 'cli-progress';

export default class TransactionService {
    private threads = 5;

    constructor(threads: number = 5) {
        this.threads = threads;
    }

    async getByTxId(txid: string): Promise<Transaction> {
        return arRequestService.get(`/tx/${txid}`);
    }

    async getTxDetails(txid: string): Promise<ITransaction> {
        const tx: Transaction = await this.getByTxId(txid);
        let data: string = '';

        if(tx.data && tx.data.length) {
            try {
                data = Buffer.from(tx.data, 'base64').toString('utf8');
            } catch(e) {}
        }
        
        const owner = await Arweave.utils.bufferTob64Url(await Arweave.crypto.hash(Arweave.utils.b64UrlToBuffer(tx.owner)));
        const tags: any = {};

        if(tx.tags && tx.tags.length) {
            for(let tag of tx.tags) {
                const name = Buffer.from(tag['name'], 'base64').toString('utf8');
                const value = Buffer.from(tag['value'], 'base64').toString('utf8');
                tags[name] = value;
            }
        }

        // @ts-ignore
        const transaction: ITransaction = tx;
        transaction.data = data;
        transaction.tags = tags;
        transaction.owner = owner;

        return transaction;
    }

    async getAllTxDetails(transactions: string[]): Promise<ITransaction[]> {
        const length = transactions.length;
        const threads = length < this.threads? length : this.threads;

        const result: ITransaction[] = [];
        const go = async (index = 0) => {
            if(index >= length) {
                return true;
            }

            const pool = new PoolService();
            for(let i = index, j = index+threads; i < j; i++) {
                if(!transactions[i]) continue;

                pool.add(async () => {
                    try {
                        const tx = await this.getTxDetails(transactions[i]);
                        if(tx) result.push(tx);
                        return tx;
                    } catch(e) {
                        if(!e.message.includes('404')) console.log(e);
                    }
                    
                    return false;
                });
            }

            await pool.run(+process.env.POOL_THREADS);

            await UtilsService.pause(300);
            return go((index+threads));
        }
        await go();

        return result;
    }

    async getTxsWithContentType(transactions: string[], contentType: string|string[], blockHeight: number, mprogress?: Progress.MultiBar): Promise<ITransaction[]> {
        const length = transactions.length;
        const result: ITransaction[] = [];

        const pbar = mprogress.create(length, 0, {
            block: blockHeight
        });

        const go = async (index = 0) => {
            if(index >= length) {
                return true;
            }

            try {
                const tx = await this.getTxDetails(transactions[index]);
                if(tx && tx.tags["Content-Type"]) {
                    if(typeof contentType === 'string' && tx.tags["Content-Type"] === contentType) {
                        result.push(tx);
                    } else {
                        for(let i = 0, j = contentType.length; i < j; i++) {
                            if(tx.tags["Content-Type"] === contentType[i]) {
                                result.push(tx);
                            }
                        }
                    }
                }
            } catch(e) {
                if(!e.message.includes('404')) console.log(e);
                await UtilsService.pause(300);
                return go(index);
            }

            if(pbar) pbar.increment();
            return true;
        }

        const pool = new PoolService();
        for(let i = 0, j = transactions.length; i < j; i++) {
            pool.add(async () => go(i));
        }

        await pool.run(+process.env.POOL_THREADS);
        if(pbar) {
            pbar.stop();
            mprogress.remove(pbar);
        }
        await UtilsService.pause(300);

     
     
        return result;
    }

    static async search(term: string, start: number = 0, limit: number = 25, fields: string[] = ['title^3', 'description^2', 'body', 'txid^4', 'owner^4']) {
        return await TransactionModel.find({$text: {$search: term}}).limit(25);
    }

    static async saveTransaction(tx: ITransaction) {
        await this.saveToMongo(tx);
        return true;
    }

    static async saveToMongo(transaction: ITransaction) {
        let title = '';
        try {
            title = transaction.data.toString().match(/<title[^>]*>([^<]+)<\/title>/)[1];
        } catch(e) {}

        let description = '';
        try {
            description = transaction.data.toString().match(/meta name="description" content="(.*)"/i)[1];
        } catch(e) {}

        let body = '';
        try {
            body = transaction.data.toString().match(/<body[^>]*>(.*?)<\/body>/is)[1];
        } catch(e) {
            if(!title.length) {
                body = transaction.data.toString();
            }
        }

        title = await UtilsService.htmlToText(title);
        description = await UtilsService.htmlToText(description);
        body = await UtilsService.htmlToText(body);

        // remove tags that have null, issue on a few results that have a few tags as null
        const keys = Object.keys(transaction.tags);
        for(let i = 0, j = keys.length; i < j; i++) {
            if(transaction.tags[keys[i]] === "null") {
                delete transaction.tags[keys[i]];
            }
        }

        const txData = {
            id: transaction.id,
            owner: transaction.owner,
            target: transaction.target,
            createdAt: new Date(transaction.timestamp * 1000),
            block_hash: transaction.block_hash,
            block_height: transaction.block_height,
            title,
            description,
            body,
            tags: JSON.stringify(transaction.tags)
        };

        try {
            await TransactionModel.create(txData);
        } catch(e) {
            const tx = await TransactionModel.findOne({id: txData.id});
            if(tx) {
                for(let key in txData) {
                    tx[key] = txData[key];
                }
                await tx.save();
            } else {
                console.log(e);
            }
        }

        return true;
    }
}