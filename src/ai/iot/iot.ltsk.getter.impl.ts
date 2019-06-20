import {Convert} from 'mipher';
import {XcpLTSKGetter, KeyPair} from 'xiot-core-xcp-ts';

export class IotLtskGetterImpl implements XcpLTSKGetter {

  private k: KeyPair;

  constructor(private pk: string,
              private sk: string) {
    this.k = new KeyPair(Convert.base642bin(pk), Convert.base642bin(sk));
  }

  getDeviceKeypair(deviceId: string): KeyPair {
    return this.k;
  }

  getProductKeyPair(productId: number, productVersion: number): KeyPair {
    return this.k;
  }
}
