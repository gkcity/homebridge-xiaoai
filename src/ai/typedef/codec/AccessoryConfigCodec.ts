import {AccessoryConfig} from '../AccessoryConfig';


export class AccessoryConfigCodec {

    static decodeArray(array: any[]): AccessoryConfig[] {
        return (array != null) ? array.map(x => AccessoryConfigCodec.decode(x)) : [];
    }

    static decode(o: any): AccessoryConfig {
        return new AccessoryConfig(o.accessory, o.name);
    }
}
