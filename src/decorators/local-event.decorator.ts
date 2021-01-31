import 'reflect-metadata';
import {LOCAL_EVENT_METADATA} from "./constants";

export const LocalEvent = (): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(LOCAL_EVENT_METADATA, true, target);
    };
};
