"use client"

import * as React from "react"
import { motion, MotionConfig } from "framer-motion"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Send, Loader2 } from "lucide-react"

const transition = {
  type: "spring" as const,
  bounce: 0,
  duration: 0.3,
}

interface Message {
  role: "user" | "assistant"
  text: string
}

// Component to format and animate assistant messages
function FormattedMessage({ text, isNew }: { text: string; isNew: boolean }) {
  const [displayedText, setDisplayedText] = React.useState(isNew ? "" : text)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    if (!isNew) {
      setDisplayedText(text)
      return
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 20) // Typing speed: 20ms per character

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, isNew])

  // Parse and format the text
  const formatText = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      // Check if line starts with bullet point
      if (line.trim().startsWith('•')) {
        const text = line.replace('•', '').trim()
        return (
          <div key={idx} className="flex gap-2 mb-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: highlightKeywords(text) }} />
          </div>
        )
      }
      // Check if line starts with number (numbered list)
      else if (/^\d+\./.test(line.trim())) {
        const match = line.match(/^(\d+\.)(.*)/)
        if (match) {
          return (
            <div key={idx} className="flex gap-2 mb-1">
              <span className="text-blue-600 dark:text-blue-400 font-bold">{match[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: highlightKeywords(match[2].trim()) }} />
            </div>
          )
        }
      }
      // Regular line
      else if (line.trim()) {
        return (
          <div key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: highlightKeywords(line) }} />
        )
      }
      return null
    })
  }

  // Highlight important keywords
  const highlightKeywords = (text: string) => {
    const keywords = [
      'Opening hours', 'Tuesday to Sunday', 'Monday', 'Closed',
      'Online Booking', 'Phone Booking', 'Walk-in',
      'Planetarium', 'Science Gallery', 'Holography', 'Technology Zone',
      'Adults', 'Children', 'Students', 'Senior Citizens',
      'Group bookings', 'School groups', 'Family packages',
      'Address', 'Contact', 'Email', 'Metro', 'Bus', 'Car'
    ]

    let highlighted = text
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi')
      highlighted = highlighted.replace(regex, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    })
    return highlighted
  }

  return <div className="space-y-1">{formatText(displayedText)}</div>
}

export default function MinimalChatBox() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input.trim()
      setInput("")
      
      // Add user message
      setMessages((prev) => [...prev, { role: "user", text: userMessage }])
      setIsLoading(true)

      try {
        // Call AI API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: messages.map((msg) => ({
              role: msg.role,
              text: msg.text,
            })),
          }),
        })

        const data = await response.json()

        if (response.ok && data.response) {
          // Add AI response
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: data.response },
          ])
        } else {
          // Error handling
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "Sorry, I'm having trouble responding right now. Please try again or contact us directly.",
            },
          ])
        }
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I'm having trouble connecting. Please try again later.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <MotionConfig transition={transition}>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <motion.div
          animate={{
            height: isOpen ? "400px" : "50px",
            width: isOpen ? "320px" : "50px",
          }}
          initial={false}
          className="flex flex-col shadow-lg overflow-hidden
            bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800">
            {isOpen && (
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Help & Support
              </span>
            )}
            <div
              className="flex items-center justify-center w-8 h-8 cursor-pointer rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X size={18} className="text-gray-900 dark:text-gray-100" />
              ) : (
                <MessageSquare size={18} className="text-gray-900 dark:text-gray-100" />
              )}
            </div>
          </div>

          {/* Messages */}
          {isOpen && (
            <div className="flex-1 px-4 py-2 overflow-y-auto flex flex-col gap-2 bg-white dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-gray-400 text-sm">
                    👋 Welcome to MGM Museum! How can we help you today?
                  </span>
                  <div className="flex flex-col gap-1 mt-2">
                    <button
                      onClick={() => {
                        setInput("What are your opening hours?")
                      }}
                      className="text-left text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      🕒 What are your opening hours?
                    </button>
                    <button
                      onClick={() => {
                        setInput("How do I book tickets?")
                      }}
                      className="text-left text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      🎫 How do I book tickets?
                    </button>
                    <button
                      onClick={() => {
                        setInput("What exhibitions are available?")
                      }}
                      className="text-left text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      🎨 What exhibitions are available?
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                        msg.role === "user"
                          ? "self-end bg-blue-600 text-white"
                          : "self-start bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <FormattedMessage text={msg.text} isNew={idx === messages.length - 1} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="self-start bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* Input */}
          {isOpen && (
            <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <Input
                className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                disabled={isLoading}
              />
              <button
                className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </MotionConfig>
  )
}
