import Arweave from 'arweave/node';

let ar: Arweave;
if(process.env.ARWEAVE_NODE_URL) {
    const regex = /(https?):\/\/([\w\d\.]+):?(\d+)?/;
    const fragments = process.env.ARWEAVE_NODE_URL.match(regex);

    ar = Arweave.init({ host: fragments[2], protocol: fragments[1], port: fragments[1] === 'https'? 443 : (fragments.length === 4? fragments[3] : '80') });
} else {
    ar = Arweave.init({ host: 'arweave.net', protocol: 'https', port: 443 });
}

export const arweave = ar;

class ArRequestService {
    static async get(endpoint: string): Promise<any> {
        const res = await arweave.api.get(endpoint);
        if(res.status === 200) {
            return res.data;
        }
        
        console.log(res);
        return false;
    }
}

export default ArRequestService;