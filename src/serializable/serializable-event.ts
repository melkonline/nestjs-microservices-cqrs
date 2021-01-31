import {IEvent} from "@nestjs/cqrs";

export interface ISerializableEvent extends IEvent {
    json():string;
    fromJson(json: string): void;
    fromObj(jsonObj: any): void;
}

export abstract class SerializableEvent implements ISerializableEvent {
    json(): string {
        return JSON.stringify(this);
    }

    fromJson(json: string) {
        const jsonObj = JSON.parse(json);
        for (let propName in jsonObj) {
            if (jsonObj.hasOwnProperty(propName) && this.hasOwnProperty(propName)) {
                (this as any)[propName] = jsonObj[propName];
            }
        }
    }

    fromObj(jsonObj: any) {
        for (let propName in jsonObj) {
            if (jsonObj.hasOwnProperty(propName) && this.hasOwnProperty(propName)) {
                (this as any)[propName] = jsonObj[propName];
            }
        }
    }
}
