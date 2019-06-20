
export class AccessoryConfig {

    accessory: string;
    name: string;
    deviceId: string;

    constructor(accessory: string, name: string, deviceId: string) {
        this.accessory = accessory;
        this.name = name;
        this.deviceId = deviceId;
    }
}
