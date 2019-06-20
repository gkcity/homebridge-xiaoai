export declare class IotConfig {
    serialNumber: string;
    productId: number;
    productVersion: number;
    deviceLTPK: string;
    deviceLTSK: string;
    serverLTPK: string;
    constructor(productId: number, productVersion: number, deviceLTPK: string, deviceLTSK: string, serverLTPK: string);
}
