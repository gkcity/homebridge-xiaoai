import { AccessoryConfig } from './typedef/AccessoryConfig';
import { IotRuntime } from './iot/iot.runtime';
import { IotConfig } from './typedef/IotConfig';
export declare class XiaoaiPlatform {
    log: Function;
    config: any;
    api: any;
    accessoriesConfig: AccessoryConfig[];
    iot: IotRuntime | null;
    iotConfig: IotConfig;
    hap: any;
    hapHost: string;
    hapPort: number;
    constructor(log: any, config: any, api: any);
    accessories(callback: Function): void;
    configureAccessory(accessory: any): void;
    private didFinishLaunching();
    private onHapClientReady();
    private onHapEvent(event);
    private readAccessories(endpoints);
    private createInstances(devices);
    private createInstancesFinished(instances);
    private handleCreateInstancesResult(x);
    private loadAccessoriesConfig(path);
    private createIotRuntime(config, children);
    private connect();
    private showAccessKey();
}
