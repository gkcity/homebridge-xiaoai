import {Instance} from '../Instance';
import {DeviceType} from 'xiot-core-spec-ts';

export class InstanceCodec {

    static decodeArray(array: any[]): Instance[] {
        return (array != null) ? array.map(x => InstanceCodec.decode(x)) : [];
    }

    static decode(o: any): Instance {
        return new Instance(o.aid, o.productId, o.productVersion, new DeviceType(o.type));
    }
}
