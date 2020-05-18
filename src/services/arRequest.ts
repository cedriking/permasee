import axios from 'axios';
import { IArweaveInfo } from '../interfaces/iarweaveinfo.interface';
import { Cache } from '../middleware/cache';
import { PoolService } from './pool';

class ArRequestService {
    private mainPeer: string = '';
    private peers: string[] = [];
    private cache: Cache;

    constructor() {
        this.cache = new Cache(120); // 2 minutes

        if(process.env.ARWEAVE_NODE_URL) {
            this.mainPeer = process.env.ARWEAVE_NODE_URL;
        } else {
            this.mainPeer = 'https://arweave.net';
        }
        this.peers = [this.mainPeer];

        // Grab peers
        setTimeout(() => this.setPeers(), 1000);
    }

    async get(endpoint: string): Promise<any> {
        const peerIndex = Math.floor(Math.random() * this.peers.length);
        const peer = this.peers[peerIndex];

        return new Promise((resolve, reject) => {
            axios(`${peer}${endpoint}`).then(res => {
                if(res.status === 200) {
                    return resolve(res.data);
                }
                resolve(false);
            }).catch(e => {
                if(e.code === 'ENETUNREACH') {
                    this.peers.splice(peerIndex, 1);
                    return reject();
                }
                reject(e);
            });
        });
    }

    async getInfo(): Promise<IArweaveInfo> {
        const cached = await this.cache.get('arRequest_getInfo');
        if(cached) {
            return cached;
        }

        const res = await axios(`${this.mainPeer}/info`);
        if(res.data && res.data.height) {
            await this.cache.set('arRequest_getInfo', res.data);
            return res.data;
        }

        return;
    }

    private async setPeers() {
        const tmpPeer: string[] = [this.mainPeer];

        const res = await axios(`${this.mainPeer}/peers`);
        if(res.status !== 200) {
            return false;
        }

        const height = (await this.getInfo()).height;
        const go = async (index = 0) => {
            const peer = `http://${res.data[index]}`;
            try {
                const cancelToken = axios.CancelToken.source();
                setTimeout(() => {
                    try {
                        cancelToken.cancel();
                    } catch(e) {}
                }, 1000);
                const r = await axios.get(`${peer}/info`, {timeout: 500, cancelToken: cancelToken.token});
                if(r && r.data && r.data.height && (r.data.height >= (height-5))) {
                    tmpPeer.push(peer);
                    return peer;
                }
            } catch(e) {}

            return;
        }

        const pool = new PoolService();
        for(let i = 0, j = res.data.length; i < j; i++) {
            pool.add(() => go(i));
        }

        await pool.run(+process.env.POOL_THREADS);
        this.peers = tmpPeer;

        console.log(`Peers updated, total peers: ${this.peers.length}`);
        setTimeout(() => this.setPeers(), 60000*10);

        return true;
    }
}

export const arRequestService = new ArRequestService();