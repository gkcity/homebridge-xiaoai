"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IotConfig_1 = require("../IotConfig");
class IotConfigCodec {
    static decode(o) {
        return new IotConfig_1.IotConfig(o.productId, o.productVersion, o.deviceLTPK, o.deviceLTSK, o.serverLTPK);
    }
}
exports.IotConfigCodec = IotConfigCodec;
