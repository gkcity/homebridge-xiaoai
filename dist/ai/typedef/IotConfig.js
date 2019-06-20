"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IotConfig {
    constructor(productId, productVersion, deviceLTPK, deviceLTSK, serverLTPK) {
        this.productId = productId;
        this.productVersion = productVersion;
        this.deviceLTPK = deviceLTPK;
        this.deviceLTSK = deviceLTSK;
        this.serverLTPK = serverLTPK;
        this.serialNumber = 'null';
    }
}
exports.IotConfig = IotConfig;
