import IBlock from "../interfaces/iblock.interface";
import { arRequestService } from "./arRequest";
import { PoolService } from "./pool";
import ITransaction from "../interfaces/transaction.interface";
import TransactionService from "./transaction";
import UtilsService from "./utils";
import Progress from 'cli-progress';

class BlockService {
    static async getByHeight(height: number): Promise<IBlock> {
        return arRequestService.get(`/block/height/${height}`);
    }

    static async getBlocksByHeight(startingHeight: number, endHeight: number): Promise<IBlock[]> {
        const pool = new PoolService();

        let total = endHeight-startingHeight+1;
        const pbar = new Progress.SingleBar({clearOnComplete:false, hideCursor: true}, Progress.Presets.shades_classic);
        pbar.start(total, 0);

        const get = async (i:number) => {
            try {
                const block = await BlockService.getByHeight(i);
                pbar.increment();
                return block;
            } catch(e) {
                if(!e.message.includes('404')) console.log(e);
                return get(i);
            }
        };

        for(let i = startingHeight; i <= endHeight; i++) {
            pool.add(() => get(i));
        }

        const result:IBlock[] = await pool.run(+process.env.POOL_THREADS);
        pbar.stop();

        return result;
    }

    static async getBlockTxsWithType(blocks: IBlock[], contentType: string): Promise<ITransaction[]> {
        const pool = new PoolService();

        let transactions: ITransaction[] = [];

        const mprogress = new Progress.MultiBar({
            clearOnComplete: true,
            hideCursor: true,
            format: 'Checking txs on block {block} | {bar} | {value}/{total}'
        }, Progress.Presets.shades_grey);

        const get = async (block: IBlock) => {
            const transactionService = new TransactionService();
            const tmpTxs: ITransaction[] = await transactionService.getTxsWithContentType(block.txs, 'text/html', block.height, mprogress);

            const update = (i: number) => {
                tmpTxs[i].block_height = block.height;
                tmpTxs[i].block_indep_hash = block.indep_hash;
                tmpTxs[i].timestamp = block.timestamp;
                tmpTxs[i].block_hash = block.hash;

                return tmpTxs[i];
            };

            const pool = new PoolService();
            for(let i = 0, j = tmpTxs.length; i < j; i++) {
                pool.add(() => update(i));
            }
            await pool.run(+process.env.POOL_THREADS);
            transactions = transactions.concat(tmpTxs);
        }

        for(let i = 0, j = blocks.length; i < j; i++) {
            if(blocks[i].txs.length) {
                pool.add(() => get(blocks[i]));
            }
        }
        await pool.run(+process.env.POOL_THREADS);
        mprogress.stop();

        return transactions;
    }
}

export default BlockService;