import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.ehai',
  name: '一嗨租车',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      desc: '自动点击"跳过"',
      actionMaximum: 1,
      activityIds: '.view.oldview.activity.LoadingActivity',
      fastQuery: true,
      rules: '[id="com.ehai:id/tv_number"]',
      snapshotUrls: 'https://i.gkd.li/i/19786341',
    },
    {
      key: 2,
      name: '首页优惠券通知',
      desc: '自动点击"关闭"',
      actionMaximum: 1,
      activityIds: '.view.oldview.activity.LoadingActivity',
      fastQuery: true,
      rules: '[id="com.ehai:id/iv_close_dialog"]',
      snapshotUrls: 'https://i.gkd.li/i/19786362',
    },
  ],
});