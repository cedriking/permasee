import readline from 'readline';

class UtilsService {
    static async pause(timeout = 1000) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), timeout);
        });
    }

    static async updateLine(str: string) {
        // @ts-ignore
        readline.clearLine(process.stdout);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(str);
    }

    static async stopLine() {
        process.stdout.write('\n');
    }
}

export default UtilsService;