"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Instance_1 = require("../Instance");
const xiot_core_spec_ts_1 = require("xiot-core-spec-ts");
class InstanceCodec {
    static decodeArray(array) {
        return (array != null) ? array.map(x => InstanceCodec.decode(x)) : [];
    }
    static decode(o) {
        return new Instance_1.Instance(o.productId, o.productVersion, new xiot_core_spec_ts_1.DeviceType(o.type));
    }
}
exports.InstanceCodec = InstanceCodec;
