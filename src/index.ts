import {XiaoaiPlatform} from './ai/XiaoaiPlatform';

export default function(homebridge: any) {
  homebridge.registerPlatform('homebridge-xiaoai', 'XiaoAI', XiaoaiPlatform);
}
