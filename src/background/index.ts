import { Storage } from "@plasmohq/storage"

const storage = new Storage()
const API_BASE = "https://你的vercel域名.vercel.app" // 部署后替换
const DAILY_LIMIT = 3

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_COMMENTS") {
    handleAnalyze(message.payload.comments)
  }
  return true
})

async function handleAnalyze(comments: { text: string; likes: number }[]) {
  // 1. 检查激活状态（是否 Pro）
  const activationCode = await storage.get("activation_code")
  let isPro = false
  if (activationCode) {
    try {
      const res = await fetch(`${API_BASE}/api/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activationCode })
      })
      const data = await res.json()
      isPro = data.valid
    } catch (e) {
      console.error("激活验证失败", e)
    }
  }

  // 2. 免费用户每日次数检查
  if (!isPro) {
    const today = new Date().toISOString().slice(0, 10)
    const usage: Record<string, number> =
      (await storage.get("daily_usage")) || {}
    const count = usage[today] || 0
    if (count >= DAILY_LIMIT) {
      chrome.runtime.sendMessage({
        type: "ANALYSIS_ERROR",
        payload: "今日免费次数已用完（3次），请升级Pro或明天再试。"
      })
      return
    }
    await storage.set("daily_usage", { ...usage, [today]: count + 1 })
  }

  // 3. 通知侧边栏开始加载
  chrome.runtime.sendMessage({ type: "ANALYSIS_LOADING" })

  // 4. 调用后端 API 进行分析
  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments, pro: isPro })
    })
    const report = await response.json()
    chrome.runtime.sendMessage({ type: "DISPLAY_REPORT", payload: report })
  } catch (error) {
    chrome.runtime.sendMessage({
      type: "ANALYSIS_ERROR",
      payload: "分析失败，请稍后重试。"
    })
  }
}