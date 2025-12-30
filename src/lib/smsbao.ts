import crypto from 'crypto'

interface SmsBaoConfig {
    user: string
    pass: string
}

export class SmsBaoClient {
    private config: SmsBaoConfig

    constructor(user: string, pass: string) {
        this.config = { user, pass }
    }

    /**
     * 发送短信
     * @param phone 手机号
     * @param content 短信内容 (会自动添加签名，建议在内容中也包含签名以防万一)
     * @returns result code (0 = success)
     */
    async send(phone: string, content: string): Promise<string> {
        const { user, pass } = this.config

        // SmsBao requires MD5 of password
        const passMd5 = crypto.createHash('md5').update(pass).digest('hex')

        // Encode content
        const contentEncoded = encodeURIComponent(content)

        const url = `http://api.smsbao.com/sms?u=${user}&p=${passMd5}&m=${phone}&c=${contentEncoded}`

        try {
            const res = await fetch(url)
            const status = await res.text()
            return status // "0" means success
        } catch (error) {
            console.error('SmsBao Send Error:', error)
            return '-1' // Network error
        }
    }

    static getErrorMessage(status: string): string {
        const map: Record<string, string> = {
            '0': '发送成功',
            '30': '密码错误',
            '40': '账号不存在',
            '41': '余额不足',
            '42': '账号过期',
            '43': 'IP地址限制',
            '50': '内容含有敏感词',
            '51': '手机号码不正确'
        }
        return map[status] || '未知错误'
    }
}
