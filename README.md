# homebridge-xiaoai

这是一个homebridge插件，可以将homebridge里的配件接入智能音箱．支持homebridge所有配件．



## 安装

### 1. 安装到当前项目

```
npm i homebridge-xiaoai
```

### 2. 安装到全局

```
sudo npm i -g homebridge-xiaoai
```



## 配置

* 在homebridge的配置文件中给accessory添加名称和deviceId:
```json
"accessories": [
		{
			"accessory": "FakeBulb",
			"name": "LightBulb 0",
			"deviceId": "xxx"          // 建议填写配件的mac地址, 不能重复使用
		},
		{
			"accessory": "FakeBulb",
			"name": "LightBulb 1",
			"deviceId": "yyy"          // 建议填写配件的mac地址, 不能重复使用
		}
	],
```

* 在homebridge的配置文件中给添加一个platform
```json
"platforms": [
		{
			"platform": "XiaoAI",
			"name": "AI Operator",
			"accesspoint": {
				"host": "accesspoint.geekool.cn",
				"port": 80,
				"uri": "/endpoint"
			},
			"instance": {
				"host": "console.geekool.cn",
				"port": 80
			},
			"hap": {
				"pin": "031-45-154",
				"refresh": 900,
				"debug": false
			},
			"iot": {
				"productId": 25,
				"productVersion": 1,
				"deviceLTPK": "1C8aJqc0Vfp4KYP+BTBvOELQbmwBYknqYEvm+0UhA/o=",
				"deviceLTSK": "yfUDUaoQqIln7DUXLafyUfuNCaONbdghtUyakHZWAg4=",
				"serverLTPK": "/8meBcfecxNl7pMIO0Zxbhx70A4DSGio7C2H7VzZLB8="
			}
		}
	]
```

* 注意: 在bridge的配置信息里的username最好是网关的mac地址, 不能重复使用
```json
"bridge": {
		"name": "MyBridge",
		"username": "CC:22:3D:E3:CE:01",
		"port": 51826,
		"pin": "031-45-154"
},
```

## 启动

```
homebridge -I
```

注意，必须携带-I参数启动，否则会启动失败．
