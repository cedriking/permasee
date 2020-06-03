import readline from 'readline';

export default class UtilsService {
    static async pause(timeout = 1000) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), timeout);
        });
    }

    static async htmlToText(body: string) {
        body = body.replace(/&nbsp;/g, ' ');
        body = body.replace(/<style([\s\S]*?)<\/style>/gi, '');
        body = body.replace(/<script([\s\S]*?)<\/script>/gi, '');
        body = body.replace(/<\/div>/ig, '\n');
        body = body.replace(/<\/li>/ig, '\n');
        body = body.replace(/<li>/ig, '  *  ');
        body = body.replace(/<\/ul>/ig, '\n');
        body = body.replace(/<\/p>/ig, '\n');
        body = body.replace(/<br\s*[\/]?>/gi, "\n");
        body = body.replace(/<[^>]+>/ig, '');
        body = body.replace(/&zwnj;|&raquo;|&laquo;|&gt;/g, '');
        body = body.replace(/[\n ]+/g, ' ');

        return body;
    }
}