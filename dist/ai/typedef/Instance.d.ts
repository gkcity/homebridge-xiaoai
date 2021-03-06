import { DeviceType, Device } from 'xiot-core-spec-ts';
export declare class Instance {
    aid: number;
    productId: number;
    productVersion: number;
    type: DeviceType;
    did: string;
    serialNumber: string;
    device: Device | null;
    constructor(aid: number, productId: number, productVersion: number, type: DeviceType);
}
