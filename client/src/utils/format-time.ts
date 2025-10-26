export const formatMessageTime = (date: Date | string): string => {
  const messageDate = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - messageDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  // Format as date for older messages
  return messageDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const formatChatTime = (date: Date | string): string => {
  const messageDate = typeof date === "string" ? new Date(date) : date
  return messageDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}
