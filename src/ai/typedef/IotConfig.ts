export class IotConfig {

    serialNumber: string;
    productId: number;
    productVersion: number;
    deviceLTPK: string;
    deviceLTSK: string;
    serverLTPK: string;

    constructor(productId: number,
                productVersion: number,
                deviceLTPK: string,
                deviceLTSK: string,
                serverLTPK: string) {
        this.productId = productId;
        this.productVersion = productVersion;
        this.deviceLTPK = deviceLTPK;
        this.deviceLTSK = deviceLTSK;
        this.serverLTPK = serverLTPK;
        this.serialNumber = 'null';
    }
}
