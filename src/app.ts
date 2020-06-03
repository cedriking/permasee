import express from 'express'
import { Application } from 'express'
import IControllerBase from 'interfaces/icontrollerbase.interface';

export default class App {
    public app: Application;
    public port: number;

    constructor(appInit: { port: number; middleWares: any; controllers: any; }) {
        this.app = express();
        this.port = appInit.port;

        this.middlewares(appInit.middleWares);
        this.assets();
        this.routes(appInit.controllers);
        this.template();
    }

    private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
        middleWares.forEach(middleWare => {
            this.app.use(middleWare);
        });
    }

    private routes(controllers: { forEach: (arg0: (controller: IControllerBase) => void) => void; }) {
        controllers.forEach((controller: IControllerBase) => {
            this.app.use(controller.path, controller.router);
        });
    }

    private assets() {
        this.app.use(express.static('public'));
    }

    private template() {
        this.app.set('view engine', 'pug');
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`);
        });
    }
}