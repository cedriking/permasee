import App from './app'

import bodyParser from 'body-parser'
import compress from "compression";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import helmet from 'helmet';
import minify from 'express-minify';
import loggerMiddleware from './middleware/logger';
import path from 'path';

import HomeController from './controllers/home.controller';

import mongoose from 'mongoose';
import OutController from './controllers/out.controller';
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });


const app = new App({
    port: 5000,
    controllers: [
        new OutController(),
        new HomeController()
    ],
    middleWares: [
        helmet(),
        cookieParser(),
        compress({}),
        minify({ cache: path.join(__dirname, 'cache') }),
        methodOverride(),
        bodyParser.json(),
        bodyParser.urlencoded({ extended: true }),
        loggerMiddleware
    ]
});

app.listen();