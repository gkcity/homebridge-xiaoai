"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AccessoryConfigCodec_1 = require("./typedef/codec/AccessoryConfigCodec");
const iot_runtime_1 = require("./iot/iot.runtime");
const IotConfigCodec_1 = require("./typedef/codec/IotConfigCodec");
const rest = require("typed-rest-client/RestClient");
const fs = require("fs");
const InstanceCodec_1 = require("./typedef/codec/InstanceCodec");
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
        this.hap.on('hapEvent', this.onHapEvent.bind(this));
    }
    onHapClientReady() {
        this.log('onHapClientReady');
        this.hap.HAPaccessories(this.readAccessories.bind(this));
    }
    onHapEvent(event) {
        this.log('onHapEvent: ', event);
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
        this.log('readAccessories: ', accessories.length);
        this.log('createInstances: ', devices.length);
        this.createInstances(devices)
            .then(instances => this.createInstancesFinished(instances))
            .catch(e => this.log('createInstances failed: ', e));
    }
    createInstances(devices) {
        const url = 'http://' + this.config.instance.host + ':' + this.config.instance.port;
        const body = { accessories: devices };
        const client = new rest.RestClient('homebridge', url);
        return client.create('/bridge/accessory', body)
            .then(x => this.handleCreateInstancesResult(x))
            .then(x => InstanceCodec_1.InstanceCodec.decodeArray(x));
    }
    createInstancesFinished(instances) {
        this.log('createInstancesFinished: ', instances.length);
        for (let i = 0; i < this.accessoriesConfig.length; ++i) {
            const accessory = this.accessoriesConfig[i];
            const instance = instances[i];
            instance.serialNumber = accessory.deviceId;
        }
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
                .catch(e => this.log('connect failed!'));
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
