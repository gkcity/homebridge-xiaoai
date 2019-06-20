"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Instance {
    constructor(productId, productVersion, type) {
        this.aid = 0;
        this.serialNumber = '';
        this.productId = productId;
        this.productVersion = productVersion;
        this.type = type;
    }
}
exports.Instance = Instance;
