"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mipher_1 = require("mipher");
const xiot_core_xcp_ts_1 = require("xiot-core-xcp-ts");
class IotLtskGetterImpl {
    constructor(pk, sk) {
        this.pk = pk;
        this.sk = sk;
        this.k = new xiot_core_xcp_ts_1.KeyPair(mipher_1.Convert.base642bin(pk), mipher_1.Convert.base642bin(sk));
    }
    getDeviceKeypair(deviceId) {
        return this.k;
    }
    getProductKeyPair(productId, productVersion) {
        return this.k;
    }
}
exports.IotLtskGetterImpl = IotLtskGetterImpl;
