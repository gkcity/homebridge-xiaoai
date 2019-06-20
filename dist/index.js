"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XiaoaiPlatform_1 = require("./ai/XiaoaiPlatform");
function default_1(homebridge) {
    homebridge.registerPlatform('homebridge-xiaoai', 'XiaoAI', XiaoaiPlatform_1.XiaoaiPlatform);
}
exports.default = default_1;
