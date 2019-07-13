# homebridge-xiaoai

这是一个homebridge插件，可以将homebridge里的配件接入智能音箱．支持homebridge所有配件．



## 一 安装

### 1. 安装到当前项目

```
npm i homebridge-xiaoai
```

### 2. 安装到全局

```
sudo npm i -g homebridge-xiaoai
```



## 二 配置

### 2.1 在homebridge的配置文件中给添加一个platform

```json
"platforms": [
    {
        "platform": "XiaoAI",
        "name": "AI Operator",
        "token": "xxxxxxxxxxx",  // 需要填入接入秘钥, 见2.2
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

### 2.2 获取接入秘钥

* 登录开发者平台

  ```http
  http://console.geekool.cn
  ```

* 创建一个开发组

* 点击秘钥菜单, 可以看到HomeBridge插件秘钥

* 将这个秘钥填入上面的token中. 



## 三 启动

```
homebridge -I
```

* 注意:
  * 必须携带-I参数启动，否则会启动失败．
  * 启动后,  除了HomeKit的二维码之外, 还会出现一个网关的二维码.



## 四 绑定和控制

*　使用app登录后, 点击右上角的扫描按钮, 扫描网关的二维码后, 可以绑定此网关, 并对网关里的设备进行控制．app在下面地址下载:
```http
https://geekool.oss-cn-beijing.aliyuncs.com/GeekHome-2019-7-13-0916.apk
```

## 五 问题反馈
请发邮件：17915185@qq.com
