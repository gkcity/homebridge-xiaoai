import {DeviceType} from 'xiot-core-spec-ts';

export class Instance {

    aid = 0;
    serialNumber = '';
    productId: number;
    productVersion: number;
    type: DeviceType;

    constructor(productId: number, productVersion: number, type: DeviceType) {
        this.productId = productId;
        this.productVersion = productVersion;
        this.type = type;
    }
}
