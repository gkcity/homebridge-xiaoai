"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const iot_ltsk_getter_impl_1 = require("./iot.ltsk.getter.impl");
const mipher_1 = require("mipher");
const xiot_core_xcp_ts_1 = require("xiot-core-xcp-ts");
const xiot_core_message_ts_1 = require("xiot-core-message-ts");
const xiot_core_spec_ts_1 = require("xiot-core-spec-ts");
const iot_status_1 = require("./iot.status");
const xiot_core_xcp_node_ts_1 = require("xiot-core-xcp-node-ts");
class IotRuntime {
    constructor(serialNumber, productId, productVersion, deviceLTPK, deviceLTSK, serverLTPK, children, log, hap, host, port) {
        this.status = iot_status_1.IotStatus.UNINITIALIZED;
        this.timer = null;
        this.children = new Map();
        this.host = '';
        this.port = 0;
        this.status = iot_status_1.IotStatus.INITIALIZING;
        const getter = new iot_ltsk_getter_impl_1.IotLtskGetterImpl(deviceLTPK, deviceLTSK);
        const cipher = new xiot_core_xcp_ts_1.XcpClientCipherProductImpl(productId, productVersion, getter, mipher_1.Convert.base642bin(serverLTPK));
        const codec = xiot_core_xcp_ts_1.XcpFrameCodecType.NOT_CRYPT;
        this.client = new xiot_core_xcp_node_ts_1.XcpClientImpl(serialNumber, productId, productVersion, cipher, codec);
        this.client.addDisconnectHandler(() => this.onDisconnect());
        this.client.addQueryHandler(xiot_core_message_ts_1.GET_PROPERTIES_METHOD, (query) => this.getProperties(query));
        this.client.addQueryHandler(xiot_core_message_ts_1.SET_PROPERTIES_METHOD, (query) => this.setProperties(query));
        this.client.addQueryHandler(xiot_core_message_ts_1.INVOKE_ACTION_METHOD, (query) => this.invokeAction(query));
        this.client.addQueryHandler(xiot_core_message_ts_1.GET_CHILDREN_METHOD, (query) => this.getChildren(query));
        this.status = iot_status_1.IotStatus.INITIALIZED;
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
    uninitialized() {
        return (this.status === iot_status_1.IotStatus.UNINITIALIZED);
    }
    did() {
        return this.client.getDeviceId();
    }
    connect(host, port, uri) {
        this.checkClient();
        this.status = iot_status_1.IotStatus.CONNECTING;
        return this.client.connect(host, port, uri)
            .then(x => {
            console.log('connect to xcp server ok!');
            this.status = iot_status_1.IotStatus.CONNECTED;
            if (this.timer == null) {
                this.timer = setInterval(() => this.doKeepalive(), 1000 * 30);
            }
            return x;
        });
    }
    disconnect() {
        console.log('disconnect');
        this.status = iot_status_1.IotStatus.DISCONNECTING;
        this.checkClient();
        this.cancelTimer();
        this.status = iot_status_1.IotStatus.DISCONNECTED;
        return this.client.disconnect();
    }
    getAccessKey() {
        return this.client.sendQuery(new xiot_core_message_ts_1.QueryGetAccessKey(this.client.getNextId()))
            .then(result => {
            if (result instanceof xiot_core_message_ts_1.ResultGetAccessKey) {
                return result.key;
            }
            else {
                console.error('invalid result: ', typeof result);
                return '';
            }
        });
    }
    resetAccessKey() {
        const key = 'this a demo key';
        return this.client.sendQuery(new xiot_core_message_ts_1.QuerySetAccessKey(this.client.getNextId(), key))
            .then(result => {
            if (result instanceof xiot_core_message_ts_1.ResultSetAccessKey) {
                return key;
            }
            else {
                console.error('invalid result: ', typeof result);
                return key;
            }
        });
    }
    getProperties(query) {
        this.asyncGetProperties(query)
            .then(x => {
            if (x instanceof xiot_core_message_ts_1.ResultGetProperties) {
                this.client.sendResult(x);
            }
            else {
                this.client.sendError(x);
            }
        })
            .catch();
    }
    setProperties(query) {
        this.asyncSetProperties(query)
            .then(x => {
            if (x instanceof xiot_core_message_ts_1.ResultSetProperties) {
                this.client.sendResult(x);
            }
            else {
                this.client.sendError(x);
            }
        })
            .catch();
    }
    asyncSetProperties(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query instanceof xiot_core_message_ts_1.QuerySetProperties) {
                for (const x of query.properties) {
                    if (!this.setProperty(x)) {
                        console.log('setChildProperty: ', x.pid != null ? x.pid.toString() : 'null');
                        if (x.pid != null) {
                            const did = x.pid.did;
                            const instance = this.children.get(did);
                            if (instance != null) {
                                x.status = yield this.writeCharacteristic(instance.aid, x.pid.iid, x.value);
                            }
                        }
                    }
                }
                return query.result();
            }
            else {
                return query.error(xiot_core_spec_ts_1.OperationStatus.UNDEFINED, 'invalid query');
            }
        });
    }
    asyncGetProperties(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query instanceof xiot_core_message_ts_1.QueryGetProperties) {
                for (const x of query.properties) {
                    if (!this.getProperty(x)) {
                        console.log('getChildProperty: ', x.pid != null ? x.pid.toString() : 'null');
                        if (x.pid != null) {
                            const did = x.pid.did;
                            const instance = this.children.get(did);
                            if (instance != null) {
                                x.value = yield this.readCharacteristic(instance.aid, x.pid.iid);
                            }
                        }
                    }
                }
                return query.result();
            }
            else {
                return query.error(xiot_core_spec_ts_1.OperationStatus.UNDEFINED, 'invalid query');
            }
        });
    }
    invokeAction(query) {
        if (query instanceof xiot_core_message_ts_1.QueryInvokeAction) {
            // this.device.tryInvoke(query.operation);
            // this.client.sendResult(query);
            // invokeAction(query.operation);
            this.client.sendResult(query.result());
        }
        else {
            this.client.sendError(query.error(xiot_core_spec_ts_1.OperationStatus.UNDEFINED, 'invalid query'));
        }
    }
    getChildren(query) {
        if (query instanceof xiot_core_message_ts_1.QueryGetChildren) {
            const array = [];
            this.children.forEach((v, did) => array.push(new xiot_core_spec_ts_1.DeviceChild(did, v.type)));
            this.client.sendResult(query.result(array));
        }
        else {
            this.client.sendError(query.error(xiot_core_spec_ts_1.OperationStatus.UNDEFINED, 'invalid query'));
        }
    }
    onDisconnect() {
        this.cancelTimer();
        this.status = iot_status_1.IotStatus.DISCONNECTED;
    }
    cancelTimer() {
        if (this.timer != null) {
            console.log('cancelTimer');
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    doKeepalive() {
        this.checkClient();
        this.client.sendQuery(new xiot_core_message_ts_1.QueryPing(this.client.getNextId()))
            .then(x => {
            console.log('recv pong: ', x.id);
        })
            .catch(e => {
            console.log('ping failed: ', e);
        });
    }
    checkClient() {
        if (this.client == null) {
            throw new Error('client not create!');
        }
    }
    getProperty(o) {
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
                o.status = xiot_core_spec_ts_1.OperationStatus.SERVICE_NOT_FOUND;
                break;
        }
        return true;
    }
    getAccessoryInformation(o) {
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
                o.status = xiot_core_spec_ts_1.OperationStatus.PROPERTY_NOT_FOUND;
                break;
        }
    }
    setProperty(o) {
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
                o.status = xiot_core_spec_ts_1.OperationStatus.SERVICE_NOT_FOUND;
                break;
        }
        return true;
    }
    setAccessoryInformation(o) {
        if (o.pid == null) {
            return;
        }
        switch (o.pid.iid) {
            case 2:
                console.log('identify: ', o.value);
                break;
            default:
                o.status = xiot_core_spec_ts_1.OperationStatus.PROPERTY_CANNOT_WRITE;
                break;
        }
    }
    readCharacteristic(aid, iid) {
        const id = aid + '.' + iid;
        this.log('readCharacteristic: ' + id);
        return new Promise((resolve, reject) => {
            const host = this.host;
            const port = this.port;
            this.hap.HAPstatus(host, port, '?id=' + id, (err, status) => {
                if (err) {
                    this.log('readCharacteristic failed ' + id + ' => ', err);
                    resolve(0);
                }
                else {
                    const value = status.characteristics[0].value;
                    this.log('readCharacteristic succeed ' + id + ' => ', value);
                    resolve(value);
                }
            });
        });
    }
    writeCharacteristic(aid, iid, value) {
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
            this.hap.HAPcontrol(host, port, JSON.stringify(body), (err, status) => {
                if (err) {
                    this.log('writeCharacteristic failed ' + id + ' => ', err);
                    resolve(-1);
                }
                else {
                    const code = status.characteristics[0].status;
                    this.log('writeCharacteristic succeed ' + id + ' => ', code);
                    resolve(code);
                }
            });
        });
    }
    subscribeEvents(child) {
        this.log('subscribeEvents', child.type.toString());
        if (child.device == null) {
            return;
        }
        const characteristics = [];
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
        this.hap.HAPevent(host, port, JSON.stringify(body), (err, status) => {
            if (!err) {
                this.log('Registered Event %s:%s ->', host, port, status);
            }
            else {
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
    onHapEvent(event) {
        // this.log('onHapEvent: ', event);
        const array = event;
        for (const item of array) {
            const aid = item.aid;
            const iid = item.iid;
            const value = item.value;
            this.onCharacteristicChanged(aid, iid, value);
        }
    }
    onCharacteristicChanged(aid, iid, value) {
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
    getChild(aid) {
        let found = null;
        this.children.forEach((child, did) => {
            this.log('child: ' + child.aid + ' => ' + did);
            if (child.aid === aid) {
                found = child;
            }
        });
        return found;
    }
    sendPropertyChanged(did, siid, piid, value) {
        const operations = [];
        const o = new xiot_core_spec_ts_1.PropertyOperation();
        o.pid = new xiot_core_spec_ts_1.PID(did, siid, piid);
        o.value = value;
        operations.push(o);
        this.client.sendQuery(new xiot_core_message_ts_1.QueryPropertiesChanged(this.client.getNextId(), '', operations))
            .then(result => {
            if (result instanceof xiot_core_message_ts_1.ResultPropertiesChanged) {
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
exports.IotRuntime = IotRuntime;
