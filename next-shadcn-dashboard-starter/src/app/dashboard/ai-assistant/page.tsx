'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Bot, User, Send, Loader2, Database, AlertCircle, CheckCircle, Brain, MessageSquare, TrendingUp, Calendar, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import PageContainer from '@/components/layout/page-container'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
  status?: 'sending' | 'success' | 'error'
}

const SUGGESTED_QUERIES = [
  {
    icon: TrendingUp,
    title: "Business Performance",
    query: "What is the utilization rate for each business this month?",
    category: "Analytics"
  },
  {
    icon: Calendar,
    title: "Room Availability",
    query: "Which rooms have the highest availability tomorrow?",
    category: "Scheduling"
  },
  {
    icon: Building,
    title: "Top Performers",
    query: "Which escape rooms are performing best this week?",
    category: "Performance"
  },
  {
    icon: Database,
    title: "Booking Trends",
    query: "Show me booking trends for the last 30 days by business",
    category: "Trends"
  }
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: "Hello! I'm your AI assistant for escape room analytics. I can help you query your database using natural language. Ask me about bookings, utilization rates, business performance, room availability, and more!",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('')
  const [isWebhookSaved, setIsWebhookSaved] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()

  // Load saved webhook URL from localStorage on component mount
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem('n8n-webhook-url')
    if (savedWebhookUrl) {
      setN8nWebhookUrl(savedWebhookUrl)
      setIsWebhookSaved(true)
    } else {
      // Set default webhook URL
      const defaultUrl = 'https://escaperooms.app.n8n.cloud/webhook-test/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6'
      setN8nWebhookUrl(defaultUrl)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Save webhook URL to localStorage
  const saveWebhookUrl = () => {
    if (n8nWebhookUrl.trim()) {
      localStorage.setItem('n8n-webhook-url', n8nWebhookUrl.trim())
      setIsWebhookSaved(true)
      toast({
        title: "Webhook URL Saved",
        description: "Your N8N webhook URL has been saved successfully.",
      })
    } else {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid webhook URL.",
        variant: "destructive",
      })
    }
  }

  // Clear saved webhook URL
  const clearWebhookUrl = () => {
    localStorage.removeItem('n8n-webhook-url')
    setN8nWebhookUrl('')
    setIsWebhookSaved(false)
    toast({
      title: "Webhook URL Cleared",
      description: "Your saved webhook URL has been removed.",
    })
  }

  // Handle webhook URL input change
  const handleWebhookUrlChange = (value: string) => {
    setN8nWebhookUrl(value)
    setIsWebhookSaved(false) // Mark as unsaved when changed
  }

  const sendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Create loading message
      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Analyzing your query and querying the database...',
        timestamp: new Date(),
        status: 'sending'
      }

      setMessages(prev => [...prev, loadingMessage])

      // N8N webhook URL - use saved URL or fallback to default
      const webhookUrl = n8nWebhookUrl || 'https://escaperooms.app.n8n.cloud/webhook-test/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6'
      
      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          timestamp: new Date().toISOString(),
          user_id: 'dashboard_user'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Remove loading message and add response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id)
        return [...filtered, {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: result.response || result.answer || 'I received your query but got an unexpected response format.',
          timestamp: new Date(),
          data: result.data,
          status: 'success'
        }]
      })

      toast({
        title: "Query Completed",
        description: "AI assistant has analyzed your request and retrieved the data.",
      })

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove loading message and add helpful error response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.status !== 'sending')
        
        // Provide a helpful demo response if N8N is not available
        const isDemoMode = error instanceof Error && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.name === 'AbortError'
        )

        if (isDemoMode) {
          return [...filtered, {
            id: (Date.now() + 3).toString(),
            type: 'assistant',
            content: `I'm currently in demo mode since N8N isn't connected. 

For your query: "${query}"

Here's what I would typically do:
• Analyze your natural language question
• Generate appropriate SQL queries for your escape room database
• Execute queries safely on your Supabase database
• Return formatted results with insights

To enable full functionality:
1. Set up N8N workflow (see setup guide)
2. Configure OpenAI API integration
3. Connect to your Supabase database

Would you like to try the suggested queries or explore the demo features?`,
            timestamp: new Date(),
            status: 'error'
          }]
        } else {
          return [...filtered, {
            id: (Date.now() + 3).toString(),
            type: 'assistant',
            content: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. 

Please make sure:
• N8N workflow is running at ${webhookUrl}
• Webhook endpoint is accessible
• Network connection is stable

You can update the webhook URL in the configuration section above if needed.`,
            timestamp: new Date(),
            status: 'error'
          }]
        }
      })

      const errorTitle = error instanceof Error && error.name === 'AbortError' 
        ? "Request Timeout" 
        : "Connection Error"
      
      const errorDescription = error instanceof Error && error.name === 'AbortError'
        ? "Request took too long. N8N might be slow or unavailable."
        : "Cannot connect to N8N. Running in demo mode."

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleSuggestedQuery = (query: string) => {
    sendMessage(query)
  }

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'system',
      content: "Chat cleared. How can I help you analyze your escape room data?",
      timestamp: new Date()
    }])
  }

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI Assistant
            </h2>
            <p className="text-muted-foreground">
              Ask questions about your escape room data in natural language
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
            >
              Clear Chat
            </Button>
          </div>
        </div>

        {/* N8N Setup Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To use this AI assistant, you need an active N8N workflow. 
            {isWebhookSaved ? (
              <>
                <strong className="text-green-600"> ✓ Webhook URL configured and saved</strong>
                <br />
                Current URL: <code className="text-sm bg-muted px-1 rounded">{n8nWebhookUrl}</code>
              </>
            ) : (
              <>
                <strong> Configure your N8N webhook URL below:</strong>
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Webhook URL Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              N8N Webhook Configuration
            </CardTitle>
            <CardDescription>
              Set up your N8N webhook URL to enable AI-powered database queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your N8N webhook URL..."
                  value={n8nWebhookUrl}
                  onChange={(e) => handleWebhookUrlChange(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={saveWebhookUrl}
                  disabled={!n8nWebhookUrl.trim() || isWebhookSaved}
                  variant={isWebhookSaved ? "secondary" : "default"}
                >
                  {isWebhookSaved ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                {isWebhookSaved && (
                  <Button 
                    onClick={clearWebhookUrl}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {!isWebhookSaved && (
                <div className="text-sm text-muted-foreground">
                  <p>💡 <strong>Your webhook URL:</strong> https://escaperooms.app.n8n.cloud/webhook-test/9437ada2-f85f-4dc0-8294-b2e2d9ff1ea6</p>
                  <p>Click "Save" to store this URL in your browser for future sessions.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Chat Interface */}
          <div className="flex-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-none">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </CardTitle>
                <CardDescription>
                  Ask questions like "What's the utilization rate for Green Light Escape this week?"
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col min-h-0 p-6">
                {/* Messages */}
                <div className="flex-1 min-h-0 mb-4">
                  <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.type !== 'user' && (
                            <div className="flex-shrink-0">
                              {message.type === 'system' ? (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Database className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Bot className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div
                            className={`max-w-[80%] ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : message.type === 'system'
                                ? 'bg-muted'
                                : 'bg-secondary'
                            } rounded-lg p-3`}
                          >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>{format(message.timestamp, 'HH:mm:ss')}</span>
                              {message.status === 'sending' && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {message.status === 'success' && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {message.status === 'error' && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </div>
                            
                            {/* Display structured data if available */}
                            {message.data && (
                              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                                <strong>Data:</strong>
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(message.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>

                          {message.type === 'user' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <User className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="mb-4" />

                {/* Input Form */}
                <div className="flex-none">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about your escape room data..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Queries Sidebar */}
          <div className="w-80 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Queries</CardTitle>
                <CardDescription>
                  Try these example questions to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SUGGESTED_QUERIES.map((suggestion, index) => {
                  const IconComponent = suggestion.icon
                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSuggestedQuery(suggestion.query)}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            "{suggestion.query}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Natural Language Queries</h4>
                  <p className="text-muted-foreground">
                    Ask questions in plain English about your business data
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Available Data</h4>
                  <p className="text-muted-foreground">
                    Bookings, utilization rates, room availability, business performance
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Time Ranges</h4>
                  <p className="text-muted-foreground">
                    Specify periods like "this week", "last 30 days", "today"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Toaster />
      </div>
    </PageContainer>
  )
} 