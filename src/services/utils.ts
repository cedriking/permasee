import readline from 'readline';

class UtilsService {
    static async pause(timeout = 1000) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), timeout);
        });
    }
}

export default UtilsService;