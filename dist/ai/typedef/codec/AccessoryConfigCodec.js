"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AccessoryConfig_1 = require("../AccessoryConfig");
class AccessoryConfigCodec {
    static decodeArray(array) {
        return (array != null) ? array.map(x => AccessoryConfigCodec.decode(x)) : [];
    }
    static decode(o) {
        return new AccessoryConfig_1.AccessoryConfig(o.accessory, o.name);
    }
}
exports.AccessoryConfigCodec = AccessoryConfigCodec;
