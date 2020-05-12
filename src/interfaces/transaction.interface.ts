interface ITransaction {
    format: number;
    id: string;
    last_tx: string;
    owner: string;
    tags: { 'Content-Type': string };
    target: string;
    quantity: string;
    data: string | Uint8Array;
    data_size: string;
    data_tree: string[];
    data_root: string;
    reward: string;
    signature: string;
    block_height: number;
    timestamp: number;
    block_hash: string;
    block_indep_hash: string;
}

export default ITransaction;