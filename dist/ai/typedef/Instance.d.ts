import { DeviceType } from 'xiot-core-spec-ts';
export declare class Instance {
    serialNumber: string;
    aid: number;
    productId: number;
    productVersion: number;
    type: DeviceType;
    constructor(aid: number, productId: number, productVersion: number, type: DeviceType);
}
