import {DeviceType} from 'xiot-core-spec-ts';

export class Instance {

    serialNumber = '';

    aid: number;
    productId: number;
    productVersion: number;
    type: DeviceType;

    constructor(aid: number, productId: number, productVersion: number, type: DeviceType) {
        this.aid = aid;
        this.productId = productId;
        this.productVersion = productVersion;
        this.type = type;
    }
}
