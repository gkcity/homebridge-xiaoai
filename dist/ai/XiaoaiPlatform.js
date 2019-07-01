"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AccessoryConfigCodec_1 = require("./typedef/codec/AccessoryConfigCodec");
const iot_runtime_1 = require("./iot/iot.runtime");
const IotConfigCodec_1 = require("./typedef/codec/IotConfigCodec");
const rest = require("typed-rest-client/RestClient");
const fs = require("fs");
const InstanceCodec_1 = require("./typedef/codec/InstanceCodec");
const iot_status_1 = require("./iot/iot.status");
const xiot_core_spec_ts_1 = require("xiot-core-spec-ts");
const HAPNodeJSClient = require('hap-node-client').HAPNodeJSClient;
const qrcode = require('qrcode-terminal');
class XiaoaiPlatform {
    constructor(log, config, api) {
        this.accessoriesConfig = [];
        this.iot = null;
        this.hapHost = '';
        this.hapPort = 0;
        this.log = log;
        this.config = config;
        this.api = api;
        this.iotConfig = IotConfigCodec_1.IotConfigCodec.decode(this.config.iot);
        if (api) {
            this.api = api;
            this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
        }
    }
    accessories(callback) {
        this.log('accessories');
        callback();
    }
    configureAccessory(accessory) {
        this.log('configureAccessory: ', accessory);
    }
    didFinishLaunching() {
        this.log('didFinishLaunching');
        const path = this.api.user.configPath();
        this.accessoriesConfig = this.loadAccessoriesConfig(path);
        this.hap = new HAPNodeJSClient(this.config.hap);
        this.hap.on('Ready', this.onHapClientReady.bind(this));
    }
    onHapClientReady() {
        this.log('onHapClientReady');
        if (this.iot) {
            if (this.iot.status === iot_status_1.IotStatus.CONNECTED || this.iot.status === iot_status_1.IotStatus.CONNECTING) {
                this.log('iot already started!');
                return;
            }
        }
        this.hap.HAPaccessories(this.readAccessories.bind(this));
    }
    readAccessories(endpoints) {
        if (endpoints.length !== 1) {
            this.log('readAccessories error!');
            return;
        }
        const endpoint = endpoints[0];
        if (!endpoint.accessories) {
            this.log('endpoint.accessories is null!');
            return;
        }
        this.hapHost = endpoint.ipAddress;
        this.hapPort = endpoint.instance.port;
        if (!endpoint.accessories.accessories) {
            this.log('endpoint.accessories.accessories is null!');
            return;
        }
        const accessories = endpoint.accessories.accessories;
        if (accessories.length !== this.accessoriesConfig.length + 1) {
            this.log('accessories.length not matched: ', accessories.length);
            return;
        }
        const devices = [];
        for (let i = 0; i < this.accessoriesConfig.length; ++i) {
            devices.push({
                accessory: this.accessoriesConfig[i].accessory,
                definition: accessories[i + 1],
            });
        }
        this.log('readAccessories: ' + accessories.length);
        this.log('createInstances: ' + devices.length);
        this.createInstances(devices)
            .then(instances => this.getInstances(instances))
            .then(instances => this.createInstancesFinished(instances))
            .catch(e => this.log('createInstances failed: ', e));
    }
    createInstances(devices) {
        const options = { headers: { 'token': this.config.token } };
        const url = 'http://' + this.config.instance.host + ':' + this.config.instance.port;
        const body = { accessories: devices };
        const client = new rest.RestClient('homebridge', url, [], options);
        return client.create('/bridge/accessory', body)
            .then(x => this.handleCreateInstancesResult(x))
            .then(x => InstanceCodec_1.InstanceCodec.decodeArray(x));
    }
    getInstances(instances) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = [];
            for (const instance of instances) {
                array.push(yield this.getInstance(instance));
            }
            return array;
        });
    }
    getInstance(instance) {
        this.log('getInstance: ' + instance.type.toString());
        const url = 'http://' + this.config.instance.host + ':' + this.config.instance.port;
        const resource = '/instance/' + instance.type.toString();
        const client = new rest.RestClient('homebridge', url);
        return client.get(resource)
            .then(x => this.handleGetInstanceResult(instance, x));
    }
    handleGetInstanceResult(instance, x) {
        if (x.statusCode !== 200 && x.statusCode !== 201) {
            throw new Error('code: ' + x.statusCode);
        }
        const msg = x.result.msg;
        if (msg !== 'ok') {
            throw new Error('msg: ' + msg);
        }
        const data = x.result.data;
        if (data == null) {
            throw new Error('data is null');
        }
        const content = data.content;
        if (content == null) {
            throw new Error('content is null');
        }
        instance.device = xiot_core_spec_ts_1.DeviceCodec.decode(content);
        return instance;
    }
    createInstancesFinished(instances) {
        this.log('createInstancesFinished: ', instances.length);
        instances.forEach(x => {
            x.serialNumber = this.iotConfig.serialNumber + '#' + x.aid;
        });
        this.iot = this.createIotRuntime(this.iotConfig, instances);
        this.connect();
    }
    handleCreateInstancesResult(x) {
        if (x.statusCode !== 200 && x.statusCode !== 201) {
            throw new Error('code: ' + x.statusCode);
        }
        return x.result;
    }
    loadAccessoriesConfig(path) {
        this.log('loadAccessoriesConfig: ', path);
        if (!fs.existsSync(path)) {
            return [];
        }
        try {
            const buffer = fs.readFileSync(path);
            const json = JSON.parse(buffer.toString());
            // get bridge id
            this.iotConfig.serialNumber = json.bridge.username;
            return AccessoryConfigCodec_1.AccessoryConfigCodec.decodeArray(json.accessories);
        }
        catch (err) {
            this.log('There was a problem reading your config.json file.');
            this.log('Please try pasting your config.json file here to validate it: http://jsonlint.com');
            this.log('');
            throw err;
        }
    }
    createIotRuntime(config, children) {
        return new iot_runtime_1.IotRuntime(config.serialNumber, config.productId, config.productVersion, config.deviceLTPK, config.deviceLTSK, config.serverLTPK, children, this.log, this.hap, this.hapHost, this.hapPort);
    }
    connect() {
        if (this.iot) {
            const host = this.config.accesspoint.host;
            const port = this.config.accesspoint.port;
            const uri = this.config.accesspoint.uri;
            this.iot.connect(host, port, uri)
                .then(() => this.showAccessKey())
                .catch(e => {
                this.log('connect failed!');
                this.iot = null;
            });
        }
    }
    showAccessKey() {
        if (this.iot) {
            this.iot.getAccessKey()
                .then(x => {
                const code = {
                    id: this.iotConfig.serialNumber + '@' + this.iotConfig.productId + '/' + this.iotConfig.productVersion,
                    key: x,
                };
                this.log('getAccessKey: ', code);
                this.log('Scan this code with your GeekHome app on your android device to pair with Homebridge');
                qrcode.generate(JSON.stringify(code));
            })
                .catch(e => this.log('getAccessKey failed!'));
        }
    }
}
exports.XiaoaiPlatform = XiaoaiPlatform;
