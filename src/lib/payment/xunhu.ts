import crypto from 'crypto';

export interface XunhuConfig {
  appId: string;
  appSecret: string;
  notifyUrl: string;
  returnUrl: string;
  apiUrl: string;
}

export interface CreatePaymentParams {
  orderId: string;
  price: string;
  title: string;
  attach?: string;
}

export function generateHash(data: Record<string, string | number>, appSecret: string): string {
  const sortedKeys = Object.keys(data).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const value = data[key];
    if (value !== '' && value !== null && value !== undefined && key !== 'hash') {
      pairs.push(`${key}=${value}`);
    }
  }

  // 虎皮椒签名算法：按参数名升序排序，用&连接，最后直接拼接appSecret（不带&key=）
  const signString = pairs.join('&') + appSecret;

  return crypto.createHash('md5').update(signString).digest('hex');
}

export const XUNHU_CONFIG: XunhuConfig = {
  appId: (process.env.XUNHU_APP_ID || '').trim(),
  appSecret: (process.env.XUNHU_APP_SECRET || '').trim(),
  notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/notify`,
  returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?status=success`,
  apiUrl: 'https://api.xunhupay.com/payment/do.html',
};
