import {AccessoryConfig} from './typedef/AccessoryConfig';
import {AccessoryConfigCodec} from './typedef/codec/AccessoryConfigCodec';
import {IotRuntime} from './iot/iot.runtime';
import {IotConfig} from './typedef/IotConfig';
import {IotConfigCodec} from './typedef/codec/IotConfigCodec';
import * as rest from 'typed-rest-client/RestClient';
import * as fs from 'fs';
import {Instance} from './typedef/Instance';
import {InstanceCodec} from './typedef/codec/InstanceCodec';
const HAPNodeJSClient = require('hap-node-client').HAPNodeJSClient;

export class XiaoaiPlatform {
    log: Function;
    config: any;
    api: any;
    accessoriesConfig: AccessoryConfig[] = [];
    iot: IotRuntime | null = null;
    iotConfig: IotConfig;
    hap: any;
    hapHost = '';
    hapPort = 0;

    constructor(log: any, config: any, api: any) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.iotConfig = IotConfigCodec.decode(this.config.iot);

        if (api) {
            this.api = api;
            this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
        }
    }

    accessories(callback: Function): void {
        this.log('accessories');
        callback();
    }

    configureAccessory(accessory: any): void {
        this.log('configureAccessory: ', accessory);
    }

    private didFinishLaunching(): void {
        this.log('didFinishLaunching');
        const path: string = this.api.user.configPath();
        this.accessoriesConfig = this.loadAccessoriesConfig(path);
        this.hap = new HAPNodeJSClient(this.config.hap);
        this.hap.on('Ready', this.onHapClientReady.bind(this));
        this.hap.on('hapEvent', this.onHapEvent.bind(this));
    }

    private onHapClientReady() {
        this.log('onHapClientReady');
        this.hap.HAPaccessories(this.readAccessories.bind(this));
    }

    private onHapEvent(event: any) {
        this.log('onHapEvent: ', event);
    }

    private readAccessories(endpoints: any[]): void {
        if (endpoints.length !== 1) {
            this.log('readAccessories error!');
            return;
        }

        const endpoint = endpoints[0];
        if (! endpoint.accessories) {
            this.log('endpoint.accessories is null!');
            return;
        }

        this.hapHost = endpoint.ipAddress;
        this.hapPort = endpoint.instance.port;

        if (! endpoint.accessories.accessories) {
            this.log('endpoint.accessories.accessories is null!');
            return;
        }

        const accessories: any[] = endpoint.accessories.accessories;

        if (accessories.length !== this.accessoriesConfig.length + 1) {
            this.log('accessories.length not matched: ', accessories.length);
            return;
        }

        const devices: any[] = [];

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

    private createInstances(devices: any[]): Promise<Instance[]> {
        const url = 'http://' + this.config.instance.host + ':' + this.config.instance.port;
        const body = {accessories: devices};
        const client: rest.RestClient = new rest.RestClient('homebridge', url);
        return client.create('/bridge/accessory', body)
            .then(x => this.handleCreateInstancesResult(x))
            .then(x => InstanceCodec.decodeArray(x));
    }

    private createInstancesFinished(instances: Instance[]): void {
        this.log('createInstancesFinished: ', instances.length);

        for (let i = 0; i < this.accessoriesConfig.length; ++i) {
            const accessory = this.accessoriesConfig[i];
            const instance = instances[i];
            instance.serialNumber = accessory.deviceId;
        }

        this.iot = this.createIotRuntime(this.iotConfig, instances);
        this.connect();
    }

    private handleCreateInstancesResult(x: rest.IRestResponse<any>): any {
        if (x.statusCode !== 200 && x.statusCode !== 201) {
            throw new Error('code: ' + x.statusCode);
        }

        return x.result;
    }

    private loadAccessoriesConfig(path: string): AccessoryConfig[] {
        this.log('loadAccessoriesConfig: ', path);

        if (!fs.existsSync(path)) {
            return [];
        }

        try {
            const buffer: Buffer = fs.readFileSync(path);
            const json = JSON.parse(buffer.toString());

            // get bridge id
            this.iotConfig.serialNumber = json.bridge.username;

            return AccessoryConfigCodec.decodeArray(json.accessories);
        } catch (err) {
            this.log('There was a problem reading your config.json file.');
            this.log('Please try pasting your config.json file here to validate it: http://jsonlint.com');
            this.log('');
            throw err;
        }
    }

    private createIotRuntime(config: IotConfig, children: Instance[]): IotRuntime {
        return new IotRuntime(config.serialNumber,
            config.productId,
            config.productVersion,
            config.deviceLTPK,
            config.deviceLTSK,
            config.serverLTPK,
            children,
            this.log,
            this.hap,
            this.hapHost,
            this.hapPort);
    }

    private connect() {
        if (this.iot) {
            const host = this.config.accesspoint.host;
            const port = this.config.accesspoint.port;
            const uri = this.config.accesspoint.uri;
            this.iot.connect(host, port, uri)
                .then(() => this.showAccessKey())
                .catch(e => this.log('connect failed!'));
        }
    }

    private showAccessKey() {
        if (this.iot) {
            this.iot.getAccessKey()
                .then(x => {
                    this.log('getAccessKey: ', x);
                })
                .catch(e => this.log('getAccessKey failed!'));
        }
    }
}
