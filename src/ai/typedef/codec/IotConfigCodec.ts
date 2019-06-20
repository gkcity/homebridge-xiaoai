import {IotConfig} from '../IotConfig';

export class IotConfigCodec {

    static decode(o: any): IotConfig {
        return new IotConfig(o.productId, o.productVersion, o.deviceLTPK, o.deviceLTSK, o.serverLTPK);
    }
}
