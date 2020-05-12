import {Router} from 'express';

interface IControllerBase {
    path: string;
    router: Router;
    initRoutes(): any
}

export default IControllerBase