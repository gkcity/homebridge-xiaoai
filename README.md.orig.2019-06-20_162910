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

在homebridge的配置文件中加入:

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

