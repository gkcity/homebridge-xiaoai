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
    private getProperties;
    private setProperties;
    private asyncSetProperties;
    private asyncGetProperties;
    private invokeAction;
    private getChildren;
    private onDisconnect;
    private cancelTimer;
    private doKeepalive;
    private checkClient;
    private getProperty;
    private getAccessoryInformation;
    private setProperty;
    private setAccessoryInformation;
    private readCharacteristic;
    private writeCharacteristic;
    private subscribeEvents;
    /**
     * [
     *   {
     *     host: '10.0.1.29',
     *     port: 51826,
     *     aid: 7,
     *     iid: 10,
     *     value: true,
     *     status: true
     *   }
     * ]
     */
    private onHapEvent;
    private onCharacteristicChanged;
    private getChild;
    private sendPropertyChanged;
}
