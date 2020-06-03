import RedisCache from 'node-cache-redis';
import MemoryCache from 'memory-cache';

export default class CacheService {
    private isRedis: boolean = false;
    private _client: any;
    private ttl: number;

    public get client() {
        return this._client;
    }

    constructor(ttl: number = (60*5), purge: number = (60*30)) {
        this.ttl = ttl;

        this._client = new RedisCache({
            name: 'CacheService',
            redisOptions: {
                url: process.env.REDIS_URL
            },
            ttlInSeconds: ttl
        });

        this._client.store.ping().then(() => {
            // this._client.deleteAll(); // flush stored data, testing only
            this.isRedis = true;
        }).catch(e => {
            this._client = MemoryCache;
            // this._client.clear();
            this.isRedis = false;
        });
    }

    async set(key: string, data: any, ttl: number = 0): Promise<boolean> {
        const tmpTtl = ttl || this.ttl;
        if(this.isRedis) {
            return await this._client.set(key, data, tmpTtl);
        } 

        return this._client.put(key, data, tmpTtl * 1000);
    }

    async get(key: string): Promise<any> {
        if(this.isRedis) {
            return await this._client.get(key);
        }

        return this._client.get(key);
    }
}