import { useState, useEffect, useMemo } from 'react'
import { apiUrl } from '../../utils/api'

interface ContactMessage {
  id: string
  _id?: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  ip?: string
  userAgent?: string
  emailDispatched?: boolean
  dispatchError?: string
  createdAt: string
  updatedAt: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const token = localStorage.getItem('token')

  const fetchMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/admin/messages'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages(data.messages || [])
        if (selectedMessage) {
          const updated = (data.messages || []).find((m: ContactMessage) => m.id === selectedMessage.id)
          if (updated) setSelectedMessage(updated)
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleUpdateStatus = async (id: string, status: 'unread' | 'read' | 'replied' | 'archived') => {
    try {
      const res = await fetch(apiUrl(`/api/admin/messages/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(prev => prev ? { ...prev, status } : null)
        }
        showToast(`Message marked as ${status}`)
      }
    } catch (err) {
      console.error('Failed to update message status:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/messages/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages(prev => prev.filter(m => m.id !== id))
        if (selectedMessage?.id === id) {
          setSelectedMessage(null)
          setReplyOpen(false)
        }
        setDeleteConfirmId(null)
        showToast('Message deleted successfully')
      }
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const handleOpenReply = (msg: ContactMessage) => {
    setSelectedMessage(msg)
    setReplySubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject || 'Support Inquiry'}`)
    setReplyMessage(`Hi ${msg.name},\n\nThank you for reaching out to PDFCompress Pro!\n\n`)
    setReplyOpen(true)
    if (msg.status === 'unread') {
      handleUpdateStatus(msg.id, 'read')
    }
  }

  const handleSendViaEmailClient = async (msgToReply: ContactMessage | null = selectedMessage) => {
    if (!msgToReply) return
    const sub = replySubject.trim() || `Re: ${msgToReply.subject || 'Support Inquiry'}`
    const body = replyMessage.trim() || `Hi ${msgToReply.name},\n\nThank you for reaching out to PDFCompress Pro!\n\n`
    const mailtoUrl = `mailto:${encodeURIComponent(msgToReply.email)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`
    
    // Open default mail client (Gmail, Outlook, etc.)
    window.location.href = mailtoUrl

    // Update status to 'replied' in the backend/database
    await handleUpdateStatus(msgToReply.id, 'replied')
    setReplyOpen(false)
    showToast(`Opened email app and marked message as Replied!`)
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMessage) return
    if (!replyMessage.trim()) return

    setReplySending(true)
    setActionError(null)

    try {
      const res = await fetch(apiUrl(`/api/admin/messages/${selectedMessage.id}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          replySubject: replySubject.trim(),
          replyMessage: replyMessage.trim()
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: 'replied' } : m))
        setSelectedMessage(prev => prev ? { ...prev, status: 'replied' } : null)
        setReplyOpen(false)
        showToast(`Reply sent directly to ${selectedMessage.email}!`)
      } else {
        setActionError(data.message || 'Failed to dispatch reply email. Check SMTP settings.')
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error sending reply.')
    } finally {
      setReplySending(false)
    }
  }

  const showToast = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (activeTab !== 'all' && m.status !== activeTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      )
    })
  }, [messages, activeTab, searchQuery])

  const unreadCount = useMemo(() => {
    return messages.filter(m => m.status === 'unread').length
  }, [messages])

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <span>✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-surface-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-surface-900 tracking-tight">Support Inbox &amp; Messages</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600 border border-primary-200/60">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">
            Visitor inquiries submitted via the Contact Us portal with real-time email forwarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-200/70 rounded-2xl overflow-x-auto text-xs font-semibold">
          {(['all', 'unread', 'read', 'replied', 'archived'] as const).map(tab => {
            const count = tab === 'all' ? messages.length : messages.filter(m => m.status === tab).length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-xl capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-white text-surface-900 shadow-sm font-bold'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab ? 'bg-surface-100 text-surface-800' : 'bg-surface-300/60 text-surface-600'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name, email, topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
          />
          <span className="absolute left-3 top-2.5 text-surface-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-surface-400 hover:text-surface-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Split List / Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Message List */}
        <div className={`${selectedMessage ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-surface-500 border border-surface-200 shadow-sm space-y-3">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-surface-500 border border-surface-200 shadow-sm space-y-3">
              <div className="text-4xl">📭</div>
              <h3 className="text-base font-bold text-surface-800">No Messages Found</h3>
              <p className="text-xs text-surface-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No messages matched "${searchQuery}". Try clearing your search.`
                  : activeTab === 'all'
                  ? 'No visitor inquiries received yet. When users submit the Contact form, their messages will appear here.'
                  : `No messages in "${activeTab}" category.`}
              </p>
            </div>
          ) : (
            filteredMessages.map(msg => {
              const isSelected = selectedMessage?.id === msg.id
              const isUnread = msg.status === 'unread'

              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    if (isUnread) handleUpdateStatus(msg.id, 'read')
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative ${
                    isSelected
                      ? 'bg-primary-50/70 border-primary-300 ring-2 ring-primary-500/20'
                      : isUnread
                      ? 'bg-white border-primary-200 hover:border-primary-300'
                      : 'bg-white border-surface-200 hover:border-surface-300'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute top-5 right-4 w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse"></span>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Avatar Initials */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                      {msg.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-surface-900' : 'font-semibold text-surface-800'}`}>
                          {msg.name}
                        </h3>
                        <span className="text-[11px] text-surface-400 whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="text-xs text-primary-600 font-semibold truncate mb-1">
                        {msg.subject || 'General Inquiry'}
                      </div>

                      <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed">
                        {msg.message}
                      </p>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          msg.status === 'unread'
                            ? 'bg-amber-100 text-amber-800'
                            : msg.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.status === 'archived'
                            ? 'bg-surface-200 text-surface-600'
                            : 'bg-surface-100 text-surface-700'
                        }`}>
                          {msg.status}
                        </span>

                        {msg.emailDispatched ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1">
                            <span>✓</span> Forwarded to Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                            <span>💾</span> Saved in DB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Message Details Pane */}
        {selectedMessage && (
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm sticky top-6 space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-100 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="lg:hidden px-3 py-1.5 rounded-lg bg-surface-100 text-surface-700 text-xs font-bold"
                >
                  &larr; Back
                </button>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedMessage.status === 'unread'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedMessage.status === 'replied'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-surface-100 text-surface-700'
                }`}>
                  Status: {selectedMessage.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedMessage.status !== 'unread' ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'unread')}
                    className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-semibold transition-all"
                  >
                    Mark Unread
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-semibold transition-all"
                  >
                    Mark Read
                  </button>
                )}

                <button
                  onClick={() => handleSendViaEmailClient(selectedMessage)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Open in your default email client (Gmail / Outlook) and mark as Replied"
                >
                  <span>📨</span> Email via App
                </button>

                <button
                  onClick={() => handleOpenReply(selectedMessage)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>✉️</span> Reply
                </button>

                {deleteConfirmId === selectedMessage.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1.5 bg-surface-200 text-surface-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(selectedMessage.id)}
                    className="p-1.5 rounded-xl text-surface-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm"
                    title="Delete Message"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* Sender Metadata Banner */}
            <div className="bg-surface-50 rounded-2xl p-5 border border-surface-200/80 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-surface-900">{selectedMessage.name}</h2>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-xs sm:text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{selectedMessage.email}</span>
                  </a>
                </div>
                <div className="text-right text-[11px] text-surface-500 space-y-0.5">
                  <div className="font-semibold">{new Date(selectedMessage.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div>{new Date(selectedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-600">
                <div>
                  <span className="font-semibold text-surface-700">Subject:</span> {selectedMessage.subject || 'General Inquiry'}
                </div>
                <div>
                  <span className="font-semibold text-surface-700">Client IP:</span> {selectedMessage.ip || 'Unknown'}
                </div>
                {selectedMessage.userAgent && (
                  <div className="sm:col-span-2 text-[11px] text-surface-400 truncate" title={selectedMessage.userAgent}>
                    <span className="font-semibold text-surface-600">Device:</span> {selectedMessage.userAgent}
                  </div>
                )}
              </div>

              {selectedMessage.emailDispatched ? (
                <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
                  <span>✅</span>
                  <span>Instant notification was delivered to your Admin Email inbox.</span>
                </div>
              ) : selectedMessage.dispatchError ? (
                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-[11px] font-semibold text-amber-800 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Email dispatch status: {selectedMessage.dispatchError}</span>
                </div>
              ) : null}
            </div>

            {/* Message Body */}
            <div>
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Visitor Message</h3>
              <div className="p-5 rounded-2xl bg-white border border-surface-200 text-sm text-surface-800 leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                {selectedMessage.message}
              </div>
            </div>

            {/* Reply Composer Modal/Section */}
            {replyOpen && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-50/50 to-indigo-50/50 border border-primary-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                    <span>✉️</span>
                    <span>Direct Reply to {selectedMessage.name}</span>
                  </h3>
                  <button
                    onClick={() => setReplyOpen(false)}
                    className="text-xs font-bold text-surface-400 hover:text-surface-600"
                  >
                    ✕ Close
                  </button>
                </div>

                {actionError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed font-medium">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <div className="flex-1">{actionError}</div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[11px] text-amber-800 font-semibold">
                        Instant Solution (bypasses server sandbox restrictions):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendViaEmailClient(selectedMessage)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>✉️</span>
                        <span>Send via Email App & Mark Replied</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-surface-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-surface-700 mb-1">Reply Content</label>
                    <textarea
                      required
                      rows={5}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your official response..."
                      className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-primary-100">
                    <button
                      type="button"
                      onClick={() => handleSendViaEmailClient(selectedMessage)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      title="Opens your Gmail/Outlook with this pre-filled message and marks it as Replied in dashboard"
                    >
                      <span>✉️</span>
                      <span>Send via Email App (Gmail / Outlook)</span>
                    </button>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyOpen(false)}
                        className="px-4 py-2 rounded-xl bg-surface-200 text-surface-700 text-xs font-semibold hover:bg-surface-300 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={replySending}
                        className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        title="Send directly from server (Requires custom verified domain in Resend or Gmail SMTP)"
                      >
                        {replySending ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            <span>Dispatch via Server</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
