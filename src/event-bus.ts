import {
    EventBus as BaseEventBus,
    IEventBus,
    EventHandlerType,
    IEventHandler,
} from "@nestjs/cqrs";
import {Injectable, OnModuleDestroy} from "@nestjs/common";
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs/dist/command-bus';
import {EVENTS_HANDLER_METADATA} from "@nestjs/cqrs/dist/decorators/constants";
import {LOCAL_EVENT_METADATA} from "./decorators";
import { NestjsMicroservicesCqrs } from './services';
import {ISerializableEvent} from "./serializable";
import {Observable} from "rxjs";

interface EventSplit<T> {
    local: T[];
    global: T[];
}

@Injectable()
export class EventBus<EventBase extends ISerializableEvent = ISerializableEvent>
    extends BaseEventBus<EventBase>
    implements IEventBus<EventBase>, OnModuleDestroy {

    constructor(
        private readonly _commandBus: CommandBus,
        private readonly _moduleRef: ModuleRef,
        private readonly _nmc: NestjsMicroservicesCqrs,
    ) {
        super(_commandBus, _moduleRef);
    }

    private isLocal<T extends EventBase>(event: T): boolean {
        return Reflect.getMetadata(LOCAL_EVENT_METADATA, event.constructor);
    }

    private splitEventsListLocalGlobal<T extends EventBase>(events: T[]): EventSplit<T> {
        const local: T[] = [];
        const global: T[] = [];
        const that = this;
        events.forEach(event => {
            if (that.isLocal(event)) {
                local.push(event);
            } else {
                global.push(event);
            }
        });
        return <EventSplit<T>>{local, global};
    }

    publish<T extends EventBase>(event: T) {
        if (this.isLocal(event)) {
            return this.publishLocally(event);
        } else {
            return this.emit(event);
        }
    }

    publishLocally<T extends EventBase>(event: T) {
        return super.publish(event);
    }

    publishAll<T extends EventBase>(events: T[]) {
        const eventSplit = this.splitEventsListLocalGlobal(events);
        const that = this;
        eventSplit.global.forEach((event) => {
            that.emit(event);
        });
        events = eventSplit.local;
        return this.publishAllLocally(events);
    }

    publishAllLocally<T extends EventBase>(events: T[]) {
        return super.publishAll(events);
    }

    private emit(event: ISerializableEvent): Promise<Observable<any>> | null {
        return this._nmc.emit(event.constructor.name, event.json());
    }

    bind(handler: IEventHandler<EventBase>, name: string) {
        const stream$ = name ? this.ofEventName(name) : this.subject$;
        const subscription = stream$.subscribe((event) => handler.handle(event));
        this.subscriptions.push(subscription);
    }

    protected registerHandler(handler: EventHandlerType<EventBase>) {
        const instance = this._moduleRef.get(handler, { strict: false });
        if (!instance) {
            return;
        }
        const eventsNames = this._reflectEventsNames(handler);
        eventsNames.forEach((event) => {
            if (!this._reflectGlobalEvent(event)) {
                this.subscribeGlobally(event);
            }
        });
        eventsNames.map((event) =>
            this.bind(instance as IEventHandler<EventBase>, event.name),
        );
    }

    private subscribeGlobally(event: FunctionConstructor) {
        const that = this;
        this._nmc.addHandler(
            event.name,
            (name: string, data: any) => {
                const instance: ISerializableEvent = new event() as unknown as ISerializableEvent;
                instance.fromObj(data);
                that.publishLocally(instance as EventBase);
            });
    }

    private _reflectGlobalEvent(
        event: FunctionConstructor,
    ): boolean {
        return Reflect.getMetadata(LOCAL_EVENT_METADATA, event);
    }

    private _reflectEventsNames(
        handler: EventHandlerType<EventBase>,
    ): FunctionConstructor[] {
        return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
    }
}
