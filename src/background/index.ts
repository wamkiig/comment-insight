import { Storage } from "@plasmohq/storage"

const storage = new Storage()
const API_BASE = "https://你的vercel域名.vercel.app" // 稍后替换

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_COMMENTS") {
    handleAnalyze(message.payload.comments)
  }
  return true
})

async function handleAnalyze(comments: { text: string; likes: number }[]) {
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
      console.error("激活状态检查失败", e)
    }
  }

  chrome.runtime.sendMessage({ type: "ANALYSIS_LOADING" })

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments, pro: isPro })
    })
    const report = await response.json()
    chrome.runtime.sendMessage({ type: "DISPLAY_REPORT", payload: report })
  } catch (error) {
    chrome.runtime.sendMessage({ type: "ANALYSIS_ERROR", payload: "分析失败，请稍后重试" })
  }
}