import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.xiaohongshu.com/*",
    "https://www.douyin.com/*"
  ]
}

const InsightButton = () => {
  const handleClick = () => {
    const comments = extractComments()
    if (comments.length === 0) {
      alert("未检测到评论，请确认在笔记详情页")
      return
    }
    chrome.runtime.sendMessage({
      type: "ANALYZE_COMMENTS",
      payload: { comments }
    })
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: "fixed",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 999999,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "10px 18px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        color: "#1f2937",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <span>✨</span> AI 洞察
    </button>
  )
}

function extractComments() {
  // 实际使用时需按网页结构调整选择器
  const selectors = [
    ".comment-item .content",
    ".comment-content",
  ]
  const nodes = document.querySelectorAll(selectors.join(","))
  const list: { text: string; likes: number }[] = []
  nodes.forEach(el => {
    const t = el.textContent?.trim() || ""
    if (t.length > 1 && t.length < 500) {
      list.push({ text: t, likes: 0 })
    }
  })
  const unique = Array.from(new Map(list.map(c => [c.text, c])).values())
  return unique.slice(0, 300)
}

export default InsightButton