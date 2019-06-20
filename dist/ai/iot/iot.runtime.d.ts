import { IotStatus } from './iot.status';
import { Instance } from '../typedef/Instance';
export declare class IotRuntime {
    status: IotStatus;
    private client;
    private timer;
    private children;
    private log;
    private hap;
    private host;
    private port;
    uninitialized(): boolean;
    constructor(serialNumber: string, productId: number, productVersion: number, deviceLTPK: string, deviceLTSK: string, serverLTPK: string, children: Instance[], log: Function, hap: any, host: string, port: number);
    did(): string;
    connect(host: string, port: number, uri: string): Promise<void>;
    disconnect(): void;
    getAccessKey(): Promise<string>;
    resetAccessKey(): Promise<string>;
    private getProperties(query);
    private setProperties(query);
    private asyncSetProperties(query);
    private asyncGetProperties(query);
    private invokeAction(query);
    private getChildren(query);
    private onDisconnect();
    private cancelTimer();
    private doKeepalive();
    private checkClient();
    private getProperty(o);
    private getAccessoryInformation(o);
    private setProperty(o);
    private setAccessoryInformation(o);
    private readCharacteristic(aid, iid);
    private writeCharacteristic(aid, iid, value);
}
