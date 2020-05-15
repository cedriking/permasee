import ArRequestService, { arweave } from "./arRequest";
import ITransaction from "../interfaces/transaction.interface";
import UtilsService from "./utils";
import { PoolService } from "./pool";
import { DBTransaction, TransactionModel } from "../models/transaction.model";
import esClient from "./elastic";
import Transaction from "arweave/node/lib/transaction";

class TransactionService {
    private threads = 5;

    constructor(threads: number = 5) {
        this.threads = threads;
    }

    async getByTxId(txid: string): Promise<Transaction> {
        return arweave.transactions.get(txid);
    }

    async getTxDetails(txid: string): Promise<ITransaction> {
        const tx: Transaction = await this.getByTxId(txid);
        const signature = tx.get('signature');
        let data: string = '';

        if(tx.data && tx.data.length) {
            try {
                data = tx.get('data', {decode: true, string: true});
            } catch(e) {}
        }
        
        const owner = await arweave.wallets.ownerToAddress(tx.owner);
        const tags: any = {};

        if(tx.tags && tx.tags.length) {
            // @ts-ignore
            tx.get('tags').forEach(tag => {
                try {
                    const name = tag.get('name', {decode: true, string: true});
                    const value = tag.get('value', {decode: true, string: true});
                    tags[name] = value;
                } catch(e) {}
            });
        }

        // @ts-ignore
        const transaction: ITransaction = tx;
        transaction.signature = signature;
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

            const promises = [];
            for(let i = index, j = index+threads; i < j; i++) {
                if(!transactions[i]) continue;

                promises.push(new Promise(async resolve => {
                    const tx = await this.getTxDetails(transactions[i]);
                    if(tx) result.push(tx);
                    
                    resolve();
                }));
            }

            await Promise.all(promises);

            await UtilsService.pause(300);
            return go((index+threads));
        }
        await go();

        return result;
    }

    async getTxsWithContentType(transactions: string[], contentType: string|string[], blockHeight: number): Promise<ITransaction[]> {
        const length = transactions.length;
        const threads = length < this.threads? length : this.threads;

        const result: ITransaction[] = [];
        let tested = 0;

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
                console.log(e);
                await UtilsService.pause(300);
                return go(index);
            }

            tested++;
            await UtilsService.updateLine(`-- Tested tx ${tested}/${length} on block ${blockHeight} (${parseInt(((tested)/length*100).toString())}%)`);
            return true;
        }

        const pool = new PoolService();
        for(let i = 0, j = transactions.length; i < j; i++) {
            pool.add(async () => go(i));
        }

        await pool.run(+process.env.POOL_THREADS);
        await UtilsService.stopLine();
        await UtilsService.pause(300);

     
     
        return result;
    }

    static async search(term: string, start: number = 0, limit: number = 25) {
        let body = {
            index: 'transactions',
            type: 'webpage',
            size: limit,
            from: start,
            body: {
                query: {
                    multi_match: {
                        query: term,
                        fields: ['title^3', 'description^2', 'body', 'txid^4', 'owner^4'],
                        fuzziness: 2
                    }
                }
            }
        };

        const res = await esClient.search(body);
        return res.hits;
    }

    static async saveTransaction(tx: ITransaction) {
        await this.saveToElastic(tx);
        await this.saveToMongo(tx);

        return true;
    }

    static async saveToElastic(transaction: ITransaction) {
        let title = '';
        try {
            title = transaction.data.toString().match(/<title[^>]*>([^<]+)<\/title>/)[1];
        } catch(e) {}

        let description = '';
        try {
            description = transaction.data.toString().match(/meta name="description" content="(.*)"/i)[1];
        } catch(e) {}

        let body = transaction.data.toString().match(/<body[^>]*>(.*?)<\/body>/is)[1];
        body = body.replace(/&nbsp;/g, ' ');
        body = body.replace(/<[^>]*(>|$)|&zwnj;|&raquo;|&laquo;|&gt;/g, '');
        body = body.replace(/  +/g, ' ');
        body = body.replace(/\n+/g, '\n');
        body = body.replace(/\t+/g, '\t');

        const txData = {
            title,
            description,
            body,
            txid: transaction.id,
            owner: transaction.owner,
            tags: transaction.tags
        };

        return new Promise((resolve, reject) => {
            esClient.index({
                index: 'transactions',
                id: transaction.id,
                type: 'webpage',
                body: txData
            }, function(err, resp, status) {
                //console.log(err, resp, status);
                if(err) reject(err);
                resolve();
            });
        });
    }

    static async saveToMongo(transaction: ITransaction) {
        const txData = {
            id: transaction.id,
            owner: transaction.owner,
            target: transaction.target,
            createdAt: new Date(transaction.timestamp * 1000),
            block_hash: transaction.block_hash,
            block_height: transaction.block_height,
            tags: JSON.stringify(transaction.tags)
        };

        try {
            const tx: DBTransaction = await TransactionModel.create(txData);
            // @ts-ignore
            tx.save();
        } catch(e) {
            const tx: DBTransaction = await TransactionModel.findOne({id: txData.id});
            for(let key in txData) {
                tx[key] = txData[key];
            }
            // @ts-ignore
            tx.save();
        }

        return true;
    }
}

export default TransactionService;