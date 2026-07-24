import { useState } from 'react'

const AnnouncementPanel = ({ announcements, onAdd, onEdit, onDelete, onTogglePin, isAdmin }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', author: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    if (editingId) {
      onEdit(editingId, formData)
    } else {
      onAdd(formData)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ title: '', content: '', author: '' })
  }

  const handleEdit = (announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      author: announcement.author || ''
    })
    setShowForm(true)
  }

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (b.pinned && !a.pinned) return 1
    if (a.pinned && !b.pinned) return -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <span className="section-title-icon animate-bounce-subtle">📢</span>
          公告栏
          <span className="badge badge-purple ml-2">{announcements.length}</span>
        </h2>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', content: '', author: '' }) }}
            className="btn-success text-sm py-2 px-4 flex items-center gap-1"
          >
            <span>➕</span>
            发布公告
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-slate-50/80 rounded-xl border border-slate-200/60 animate-scale-in">
          <h3 className="font-semibold text-slate-700 mb-4">{editingId ? '编辑公告' : '发布公告'}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入公告标题"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">内容</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入公告内容"
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">发布人（可选）</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="请输入发布人名称"
                className="input-field"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {editingId ? '保存修改' : '发布公告'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {sortedAnnouncements.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无公告</p>
          </div>
        ) : (
          sortedAnnouncements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-xl transition-all duration-300 animate-fade-in ${
                announcement.pinned
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60'
                  : 'bg-white/60 border border-slate-200/60 hover:border-violet-200/60 hover:bg-white/80'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {announcement.pinned && (
                    <span className="text-amber-500 text-sm">📌</span>
                  )}
                  <h4 className="font-semibold text-slate-800 truncate">{announcement.title}</h4>
                  {announcement.pinned && (
                    <span className="badge badge-yellow text-xs flex-shrink-0">置顶</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onTogglePin(announcement.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all hover:scale-110"
                      title={announcement.pinned ? '取消置顶' : '置顶'}
                    >
                      {announcement.pinned ? '📌' : '📍'}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all hover:scale-110"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(announcement.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{announcement.content}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{announcement.author || '管理员'}</span>
                <span>{new Date(announcement.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AnnouncementPanel
