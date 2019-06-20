import { DeviceType } from 'xiot-core-spec-ts';
export declare class Instance {
    aid: number;
    serialNumber: string;
    productId: number;
    productVersion: number;
    type: DeviceType;
    constructor(productId: number, productVersion: number, type: DeviceType);
}
