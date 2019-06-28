import {DeviceType, Device} from 'xiot-core-spec-ts';

export class Instance {

    aid: number;
    productId: number;
    productVersion: number;
    type: DeviceType;

    did = '';
    serialNumber = '';
    device: Device | null = null;

    constructor(aid: number, productId: number, productVersion: number, type: DeviceType) {
        this.aid = aid;
        this.productId = productId;
        this.productVersion = productVersion;
        this.type = type;
    }
}
