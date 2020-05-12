export class PoolService {
    private queue = [];

    async add(fx) {
        this.queue.push(fx);
    }

    async run(parallel:number = 3) {
        const results = [];
        const jobs = [];

        for(let i = 0; i < Math.min(parallel, this.queue.length); i++) {
            jobs.push(this.runJob(results));
        }
        await Promise.all(jobs);

        this.queue = [];
        return results;
    }

    private async runJob(results: any[]) {
        results.push(await this.queue.shift()());
        if(this.queue.length) {
            await this.runJob(results);
        }
    }
}