import {IotLtskGetterImpl} from './iot.ltsk.getter.impl';
import {Convert} from 'mipher';
import {XcpFrameCodecType, XcpClientCipherProductImpl, XcpClient} from 'xiot-core-xcp-ts';
import {
  QueryGetProperties,
  QuerySetProperties,
  QueryInvokeAction,
  QueryPing,
  GET_PROPERTIES_METHOD,
  SET_PROPERTIES_METHOD,
  INVOKE_ACTION_METHOD,
  GET_CHILDREN_METHOD,
  QueryGetAccessKey,
  ResultGetAccessKey,
  QuerySetAccessKey,
  ResultSetAccessKey,
  IQQuery,
  QueryGetChildren,
  ResultSetProperties,
  IQError,
  ResultGetProperties,
  QueryPropertiesChanged,
  ResultPropertiesChanged,
} from 'xiot-core-message-ts';
import {
  OperationStatus,
  PropertyOperation,
  DeviceChild,
  DeviceType,
  Device,
  Service,
  PID,
} from 'xiot-core-spec-ts';
import {IotStatus} from './iot.status';
import {XcpClientImpl} from 'xiot-core-xcp-node-ts';
import {Instance} from '../typedef/Instance';

export class IotRuntime {

  status: IotStatus = IotStatus.UNINITIALIZED;

  private client: XcpClient;
  private timer: any = null;
  private children: Map<string, Instance> = new Map<string, Instance>();
  private log: Function;
  private hap: any;
  private host = '';
  private port = 0;

  uninitialized(): boolean {
    return (this.status === IotStatus.UNINITIALIZED);
  }

  constructor(serialNumber: string,
              productId: number,
              productVersion: number,
              deviceLTPK: string,
              deviceLTSK: string,
              serverLTPK: string,
              children: Instance[],
              log: Function,
              hap: any,
              host: string,
              port: number) {

    this.status = IotStatus.INITIALIZING;
    const getter = new IotLtskGetterImpl(deviceLTPK, deviceLTSK);
    const cipher = new XcpClientCipherProductImpl(productId, productVersion, getter, Convert.base642bin(serverLTPK));
    const codec = XcpFrameCodecType.NOT_CRYPT;
    this.client = new XcpClientImpl(serialNumber, productId, productVersion, cipher, codec);
    this.client.addDisconnectHandler(() => this.onDisconnect());
    this.client.addQueryHandler(GET_PROPERTIES_METHOD, (query) => this.getProperties(query));
    this.client.addQueryHandler(SET_PROPERTIES_METHOD, (query) => this.setProperties(query));
    this.client.addQueryHandler(INVOKE_ACTION_METHOD, (query) => this.invokeAction(query));
    this.client.addQueryHandler(GET_CHILDREN_METHOD, (query) => this.getChildren(query));
    this.status = IotStatus.INITIALIZED;

    this.log = log;
    this.hap = hap;
    this.host = host;
    this.port = port;

    this.log('IotRuntime.initialize');

    children.forEach(x => {
      x.did = x.serialNumber + '@' + x.productId;
      this.children.set(x.did, x);
      this.log(x.serialNumber + ' => ' + x.aid);
      this.subscribeEvents(x);
    });
  }

  did(): string {
    return this.client.getDeviceId();
  }

  connect(host: string, port: number, uri: string): Promise<void> {
    this.checkClient();
    this.status = IotStatus.CONNECTING;
    return this.client.connect(host, port, uri)
        .then(x => {
          console.log('connect to xcp server ok!');
          this.status = IotStatus.CONNECTED;
          if (this.timer == null) {
            this.timer = setInterval(() => this.doKeepalive(), 1000 * 30);
          }

          return x;
        });
  }

  disconnect(): void {
    console.log('disconnect');
    this.status = IotStatus.DISCONNECTING;
    this.checkClient();
    this.cancelTimer();
    this.status = IotStatus.DISCONNECTED;
    return this.client.disconnect();
  }

  getAccessKey(): Promise<string> {
    return this.client.sendQuery(new QueryGetAccessKey(this.client.getNextId()))
        .then(result => {
          if (result instanceof ResultGetAccessKey) {
            return result.key;
          } else {
            console.error('invalid result: ', typeof result);
            return '';
          }
        });
  }

  resetAccessKey(): Promise<string> {
    const key = 'this a demo key';
    return this.client.sendQuery(new QuerySetAccessKey(this.client.getNextId(), key))
        .then(result => {
          if (result instanceof ResultSetAccessKey) {
            return key;
          } else {
            console.error('invalid result: ', typeof result);
            return key;
          }
        });
  }

  private getProperties(query: IQQuery): void {
    this.asyncGetProperties(query)
        .then(x => {
          if (x instanceof ResultGetProperties) {
            this.client.sendResult(x);
          } else {
            this.client.sendError(x);
          }
        })
        .catch();
  }

  private setProperties(query: IQQuery): void {
    this.asyncSetProperties(query)
        .then(x => {
          if (x instanceof ResultSetProperties) {
            this.client.sendResult(x);
          } else {
            this.client.sendError(x);
          }
        })
        .catch();
  }

  private async asyncSetProperties(query: IQQuery): Promise<ResultSetProperties | IQError> {
    if (query instanceof QuerySetProperties) {

      for (const x of query.properties) {
        if (!this.setProperty(x)) {
          console.log('setChildProperty: ', x.pid != null ? x.pid.toString() : 'null');

          if (x.pid != null) {
            const did = x.pid.did;
            const instance = this.children.get(did);
            if (instance != null) {
              x.status = await this.writeCharacteristic(instance.aid, x.pid.iid, x.value);
            }
          }
        }
      }

      return query.result();
    } else {
      return query.error(OperationStatus.UNDEFINED, 'invalid query');
    }
  }

  private async asyncGetProperties(query: IQQuery): Promise<ResultGetProperties | IQError> {
    if (query instanceof QueryGetProperties) {
      for (const x of query.properties) {
        if (!this.getProperty(x)) {
          console.log('getChildProperty: ', x.pid != null ? x.pid.toString() : 'null');

          if (x.pid != null) {
            const did = x.pid.did;
            const instance = this.children.get(did);
            if (instance != null) {
              x.value = await this.readCharacteristic(instance.aid, x.pid.iid);
            }
          }
        }
      }

      return query.result();
    } else {
      return query.error(OperationStatus.UNDEFINED, 'invalid query');
    }
  }

  private invokeAction(query: IQQuery): void {
    if (query instanceof QueryInvokeAction) {
      // this.device.tryInvoke(query.operation);
      // this.client.sendResult(query);
      // invokeAction(query.operation);
      this.client.sendResult(query.result());
    } else {
      this.client.sendError(query.error(OperationStatus.UNDEFINED, 'invalid query'));
    }
  }

  private getChildren(query: IQQuery): void {
    if (query instanceof QueryGetChildren) {
      const array: DeviceChild[] = [];
      this.children.forEach((v, did) => array.push(new DeviceChild(did, v.type)));
      this.client.sendResult(query.result(array));
    } else {
      this.client.sendError(query.error(OperationStatus.UNDEFINED, 'invalid query'));
    }
  }

  private onDisconnect(): void {
    this.cancelTimer();
    this.status = IotStatus.DISCONNECTED;
  }

  private cancelTimer(): void {
    if (this.timer != null) {
      console.log('cancelTimer');
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private doKeepalive(): void {
    this.checkClient();
    this.client.sendQuery(new QueryPing(this.client.getNextId()))
        .then(x => {
          console.log('recv pong: ', x.id);
        })
        .catch(e => {
          console.log('ping failed: ', e);
        });
  }

  private checkClient() {
    if (this.client == null) {
      throw new Error('client not create!');
    }
  }

  private getProperty(o: PropertyOperation): boolean {
    if (o.pid == null) {
      return false;
    }

    if (o.pid.did !== this.did()) {
      return false;
    }

    console.log('getProperty: ', o.pid.toString());

    switch (o.pid.siid) {
      case 1:
        this.getAccessoryInformation(o);
        break;

      default:
        o.status = OperationStatus.SERVICE_NOT_FOUND;
        break;
    }

    return true;
  }

  private getAccessoryInformation(o: PropertyOperation): void {
    if (o.pid == null) {
      return;
    }

    switch (o.pid.iid) {
      case 3:
        o.value = 'tabby';
        break;

      case 4:
        o.value = 'homebridge';
        break;

      case 5:
        o.value = 'homebridge';
        break;

      case 6:
        o.value = this.client.getSerialNumber();
        break;

      case 7:
        o.value = '0.0.1';
        break;

      default:
        o.status = OperationStatus.PROPERTY_NOT_FOUND;
        break;
    }
  }

  private setProperty(o: PropertyOperation): boolean {
    if (o.pid == null) {
      return false;
    }

    if (o.pid.did !== this.did()) {
      return false;
    }

    console.log('setProperty: ', o.pid.toString());

    switch (o.pid.siid) {
      case 1:
        this.setAccessoryInformation(o);
        break;

      default:
        o.status = OperationStatus.SERVICE_NOT_FOUND;
        break;
    }

    return true;
  }

  private setAccessoryInformation(o: PropertyOperation): void {
    if (o.pid == null) {
      return;
    }

    switch (o.pid.iid) {
      case 2:
        console.log('identify: ', o.value);
        break;

      default:
        o.status = OperationStatus.PROPERTY_CANNOT_WRITE;
        break;
    }
  }

  private readCharacteristic(aid: number, iid: number): Promise<any> {
    const id = aid + '.' + iid;
    this.log('readCharacteristic: ' + id);

    return new Promise((resolve, reject) => {
      const host = this.host;
      const port = this.port;
      this.hap.HAPstatus(host, port, '?id=' + id, (err: any, status: any) => {
        if (err) {
          this.log('readCharacteristic failed ' + id + ' => ', err);
          resolve(0);
        } else {
          const value = status.characteristics[0].value;
          this.log('readCharacteristic succeed ' + id + ' => ', value);
          resolve(value);
        }
      });
    });
  }

  private writeCharacteristic(aid: number, iid: number, value: any): Promise<number> {
    const id = aid + '.' + iid;
    console.log('writeCharacteristic: ' + id + ' => ', value);

    return new Promise((resolve, reject) => {
      const host = this.host;
      const port = this.port;
      const body = {
        'characteristics': [{
          'aid': aid,
          'iid': iid,
          'value': value
        }]
      };

      this.hap.HAPcontrol(host, port, JSON.stringify(body), (err: any, status: any) => {
        if (err) {
          this.log('writeCharacteristic failed ' + id + ' => ', err);
          resolve(-1);
        } else {
          const code = status.characteristics[0].status;
          this.log('writeCharacteristic succeed ' + id + ' => ', code);
          resolve(code);
        }
      });
    });
  }

  private subscribeEvents(child: Instance): void {
    this.log('subscribeEvents', child.type.toString());

    if (child.device == null) {
      return;
    }

    const characteristics: any = [];

    child.device.services.forEach((service, siid) => {
      service.properties.forEach((property, piid) => {
        if (property.access.isNotifiable) {
          const item = {
            aid: child.aid,
            iid: piid,
            ev: true,
          };

          characteristics.push(item);
        }
      });
    });

    const host = this.host;
    const port = this.port;
    const body = { characteristics };

    this.log('Event Register %s:%s ->', host, port, JSON.stringify(body));

    this.hap.HAPevent(host, port, JSON.stringify(body), (err: any, status: any) => {
      if (!err) {
        this.log('Registered Event %s:%s ->', host, port, status);
      } else {
        this.log('Error: Event Register %s:%s ->', host, port, err, status);
      }
    });

    this.hap.on('hapEvent', this.onHapEvent.bind(this));
  }

  /**
   * [
   *   {
   *     host: '10.0.1.29',
   *     port: 51826,
   *     aid: 7,
   *     iid: 10,
   *     value: true,
   *     status: true
   *   }
   * ]
   */
  private onHapEvent(event: any) {
    this.log('onHapEvent: ', JSON.stringify(event));

    const array: any[] = event;
    for (let i = 0; i < array.length; ++i) {
      const item = array[i];
      const aid: number = item.aid;
      const iid: number = item.iid;
      const value: any = item.value;
      this.onCharacteristicChanged(aid, iid, value);
    }
  }

  private onCharacteristicChanged(aid: number, iid: number, value: any): void {
    this.log('onCharacteristicChanged: ', aid, iid, value);

    const child = this.getChild(aid);
    if (child == null) {
      this.log('getChild failed: ' + aid);
      return;
    }

    if (child.device == null) {
      this.log('child.device is null: ' + aid);
      return;
    }

    child.device.services.forEach((service, siid) => {
      service.properties.forEach((property, piid) => {
        if (piid === iid) {
          this.sendPropertyChanged(child.did, siid, piid, value);
        }
      });
    });
  }

  private getChild(aid: number): Instance | null {
    let found: Instance | null = null;

    this.children.forEach((child, did) => {
      if (child.aid === aid) {
        found = child;
      }
    });

    return found;
  }

  private sendPropertyChanged(did: string, siid: number, piid: number, value: any) {
    const operations: PropertyOperation[] = [];

    const o = new PropertyOperation();
    o.pid = new PID(did, siid, piid);
    o.value = value;

    operations.push(o);

    this.client.sendQuery(new QueryPropertiesChanged(this.client.getNextId(), '', operations))
        .then(result => {
          if (result instanceof ResultPropertiesChanged) {
            result.properties.forEach(x => {
              if (x.pid) {
                console.log(x.pid.toString() + ' => status: ' + x.status);
              }
            });
          }
        })
        .catch(e => {
          console.log('send properties changed failed: ', e);
        });
  }
}
