import { XcpLTSKGetter, KeyPair } from 'xiot-core-xcp-ts';
export declare class IotLtskGetterImpl implements XcpLTSKGetter {
    private pk;
    private sk;
    private k;
    constructor(pk: string, sk: string);
    getDeviceKeypair(deviceId: string): KeyPair;
    getProductKeyPair(productId: number, productVersion: number): KeyPair;
}
