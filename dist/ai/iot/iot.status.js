"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IotStatus;
(function (IotStatus) {
    IotStatus["UNINITIALIZED"] = "uninitialized";
    IotStatus["INITIALIZING"] = "initializing";
    IotStatus["INITIALIZED"] = "initialized";
    IotStatus["INITIALIZE_FAILED"] = "initialize_failed";
    IotStatus["DISCONNECTING"] = "disconnecting";
    IotStatus["DISCONNECTED"] = "disconnected";
    IotStatus["CONNECTING"] = "connecting";
    IotStatus["CONNECTED"] = "connected";
})(IotStatus = exports.IotStatus || (exports.IotStatus = {}));
