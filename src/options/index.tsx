import { useEffect, useState } from "react"
import "../style.css"

function getMachineCode() {
  return chrome.runtime.id.substring(0, 8).toUpperCase()
}

export default function Options() {
  const [activationCode, setActivationCode] = useState("")
  const [status, setStatus] = useState("")
  const [machineCode, setMachineCode] = useState("")

  useEffect(() => {
    setMachineCode(getMachineCode())
    chrome.storage.local.get("activation_code", (res) => {
      if (res.activation_code) setActivationCode(res.activation_code)
    })
  }, [])

  const handleActivate = async () => {
    try {
      const res = await fetch("https://你的vercel域名.vercel.app/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activationCode })
      })
      const data = await res.json()
      if (data.valid) {
        await chrome.storage.local.set({ activation_code: activationCode })
        setStatus("✅ 激活成功！Pro 功能已解锁。")
      } else {
        setStatus("❌ 激活码无效，请检查后重试。")
      }
    } catch {
      setStatus("网络错误，请稍后重试。")
    }
  }

  return (
    <div className="max-w-xl mx-auto my-10 p-8 font-sans">
      <h1 className="text-2xl font-bold mb-8">✨ CommentInsight 设置</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">📱 升级 Pro（永久激活）</h2>
        <p className="text-sm text-gray-600 mb-4">
          价格：<b>￥29.9</b> 永久 / <b>￥9.9</b> 季度（任选，扫码支付）
        </p>
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <img
              src={chrome.runtime.getURL("assets/qrcode-wechat.png")}
              className="w-40 h-40 rounded-lg border"
            />
            <p className="text-xs mt-1 text-gray-500">微信支付</p>
          </div>
          <div className="text-center">
            <img
              src={chrome.runtime.getURL("assets/qrcode-alipay.png")}
              className="w-40 h-40 rounded-lg border"
            />
            <p className="text-xs mt-1 text-gray-500">支付宝支付</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          付款后请将<b>支付截图</b>和下方<b>机器码</b>发送至邮箱：
          <b>2860859257@qq.com</b>
          <br />
          我们会在 24 小时内回复激活码。
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mt-4 flex items-center justify-between text-sm">
          <span className="font-mono">机器码：{machineCode}</span>
          <button
            onClick={() => navigator.clipboard.writeText(machineCode)}
            className="text-blue-500 underline text-xs"
          >
            复制
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">🔑 激活 Pro</h2>
        <input
          type="text"
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
          placeholder="粘贴你收到的激活码"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleActivate}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium transition"
        >
          验证激活
        </button>
        {status && <p className="mt-3 text-sm">{status}</p>}
      </div>
    </div>
  )
}