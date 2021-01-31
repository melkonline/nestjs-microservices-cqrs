import { Injectable } from '@nestjs/common';
import {
    ClientOptions,
    ClientProxyFactory,
    CustomStrategy,
    MessageHandler,
    MicroserviceOptions,
    Server
} from '@nestjs/microservices';
import {ServerFactory} from "@nestjs/microservices/server/server-factory";
import {ClientProxy} from "@nestjs/microservices/client/client-proxy";
import {IEvent} from "@nestjs/cqrs";
import {Observable} from "rxjs";

interface MessageHandlerGlobal extends MessageHandler {
    isGlobal?: boolean;
}

@Injectable()
export class NestjsMicroservicesCqrs<EventBase extends IEvent = IEvent> {
    private options: MicroserviceOptions | undefined;
    private server: Server | undefined;
    private client: ClientProxy | undefined;

    run() {
        if (!this.client) {
            this._createClient();
        }
    }

    init( options: MicroserviceOptions ) {
        return this._createServer(options);
    };

    private _createServer(options: MicroserviceOptions) {
        this.options = options;
        const server = ServerFactory.create(options);
        this.server = server;
        this.client = undefined;
        return { strategy: server } as CustomStrategy;
    }

    private _createClient() {
        this.client = ClientProxyFactory.create(<ClientOptions>this.options);
        this.client.connect();
    }

    addHandler<U>(pattern: string, handler: (name: string, data: any) => U) {
        if (this.server) {
            let oldHandler: MessageHandlerGlobal | null;
            oldHandler = this.server.getHandlerByPattern(pattern);
            let finalHandler: MessageHandlerGlobal;
            if (!(oldHandler && oldHandler.isGlobal)) {
                finalHandler = (data:any, ctx?:any) => {
                    let res: any;
                    if (oldHandler instanceof Function) {
                        res = oldHandler(data, ctx);
                    }
                    handler(pattern, data.value);
                    return Promise.resolve(res);
                };
                finalHandler.isEventHandler = true;
                finalHandler.isGlobal = true;
                this.server.addHandler(pattern, finalHandler, true);
            }
        }
    }

    emit<TResult = any>(pattern: string, data: any): Promise<Observable<TResult>> | null {
        if (this.client) {
            return this.client.emit(pattern, data).toPromise();
        }
        return null;
    }
}
