import IBlock from "../interfaces/iblock.interface";
import ArRequestService from "./arRequest";
import { PoolService } from "./pool";
import ITransaction from "../interfaces/transaction.interface";
import TransactionService from "./transaction";
import UtilsService from "./utils";

class BlockService {
    static async getByHeight(height: number): Promise<IBlock> {
        return ArRequestService.get(`/block/height/${height}`);
    }

    static async getBlocksByHeight(startingHeight: number, endHeight: number, threads: number = 5): Promise<IBlock[]> {
        const pool = new PoolService();

        let grabbed = 0;
        let total = endHeight-startingHeight+1;
        const get = async (i:number) => {
            try {
                const block = await BlockService.getByHeight(i);

                grabbed++;
                await UtilsService.updateLine(`-- Getting blocks (${parseInt(((grabbed)/total*100).toString())}%)`);
                return block;
            } catch(e) {
                console.log(e);
                return get(i);
            }
        };

        for(let i = startingHeight; i <= endHeight; i++) {
            pool.add(() => get(i));
        }

        const result:IBlock[] = await pool.run(threads);
        await UtilsService.stopLine();

        return result;
    }

    static async getBlockTxsWithType(blocks: IBlock[], contentType: string, threads: number = 10): Promise<ITransaction[]> {
        const pool = new PoolService();

        let transactions: ITransaction[] = [];
        const get = async (block: IBlock) => {
            const transactionService = new TransactionService();
            const tmpTxs: ITransaction[] = await transactionService.getTxsWithContentType(block.txs, 'text/html', block.height);

            for(let i = 0, j = tmpTxs.length; i < j; i++) {
                tmpTxs[i].block_height = block.height;
                tmpTxs[i].block_indep_hash = block.indep_hash;
                tmpTxs[i].timestamp = block.timestamp;
                tmpTxs[i].block_hash = block.hash;
            }

            transactions = transactions.concat(tmpTxs);
        }

        for(let i = 0, j = blocks.length; i < j; i++) {
            if(blocks[i].txs.length) {
                pool.add(() => get(blocks[i]));
            }
        }
        await pool.run(threads);
        return transactions;
    }
}

export default BlockService;