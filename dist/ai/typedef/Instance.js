"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Instance {
    constructor(aid, productId, productVersion, type) {
        this.did = '';
        this.serialNumber = '';
        this.device = null;
        this.aid = aid;
        this.productId = productId;
        this.productVersion = productVersion;
        this.type = type;
    }
}
exports.Instance = Instance;
