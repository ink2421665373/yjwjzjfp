import { useState } from 'react'
import PlayerCard from './PlayerCard'

function GroupPanel({
  players,
  groups,
  onAddToGroup,
  onRemoveFromGroup,
  onGroupRename,
  onUpdateGroupScore,
  onAddGroup,
  onRemoveGroup,
  onClearGroups,
  onBringToTop,
  isAdmin,
  onRemovePlayer
}) {
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editName, setEditName] = useState('')
  const [expandedGroupId, setExpandedGroupId] = useState(null)
  const [editingScoreGroupId, setEditingScoreGroupId] = useState(null)
  const [editScore, setEditScore] = useState('')

  const handleStartEdit = (group) => {
    setEditingGroupId(group.id)
    setEditName(group.name)
  }

  const handleStartScoreEdit = (group) => {
    setEditingScoreGroupId(group.id)
    setEditScore(group.customScore?.toString() || '0')
  }

  const handleSaveScoreEdit = (groupId) => {
    const score = parseFloat(editScore) || 0
    onUpdateGroupScore(groupId, score)
    setEditingScoreGroupId(null)
    setEditScore('')
  }

  const handleSaveEdit = (groupId) => {
    if (editName.trim()) {
      onGroupRename(groupId, editName.trim())
    }
    setEditingGroupId(null)
    setEditName('')
  }

  const handleCancelEdit = () => {
    setEditingGroupId(null)
    setEditName('')
  }

  const getGroupColor = (index) => {
    const colors = [
      'from-rose-500 to-orange-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-violet-500 to-fuchsia-500',
      'from-amber-500 to-orange-500',
      'from-indigo-500 to-violet-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
    ]
    return colors[index % colors.length]
  }

  const getAvatarIndex = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 6 + 1
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in delay-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="section-title">
            <span className="section-title-icon animate-bounce-subtle">👥</span>
            未分组玩家
            <span className="badge badge-purple">{players.length}</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onAddGroup}
              className="btn-success text-sm py-2 px-4 flex items-center gap-1"
            >
              <span>➕</span>
              添加分组
            </button>
            <button
              onClick={onClearGroups}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
            >
              <span>↺</span>
              清空分组
            </button>
          </div>
        </div>

        {players.length > 0 ? (
          <div className="space-y-3">
            {players.map((player, idx) => (
              <div key={player.id} className="relative animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                <PlayerCard
                  player={player}
                  onDelete={onRemovePlayer}
                  isAdmin={isAdmin}
                  showDelete={true}
                  draggable={isAdmin}
                />
                {groups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {groups.map((group, idx) => (
                      <button
                        key={group.id}
                        onClick={() => onAddToGroup(player, group.id)}
                        className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-gradient-to-r ${getGroupColor(idx)} hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-105`}
                      >
                        → {group.name} {group.customScore > 0 ? `(+${group.customScore})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <div className="text-4xl mb-3 animate-float">🎮</div>
            <p>暂无未分组玩家</p>
            <p className="text-sm mt-1">添加玩家后可以手动分配到分组</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, groupIndex) => {
          const isExpanded = expandedGroupId === group.id
          const colorIdx = groupIndex % 8
          return (
            <div 
              key={group.id} 
              className={`glass-card glass-card-hover overflow-hidden transition-all cursor-pointer relative animate-fade-in ${
                isExpanded ? 'ring-2 ring-violet-400/50 shadow-2xl z-10' : ''
              }`}
              style={{ animationDelay: `${groupIndex * 0.08}s` }}
              onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('ring-2', 'ring-violet-400', 'bg-violet-50/50')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('ring-2', 'ring-violet-400', 'bg-violet-50/50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('ring-2', 'ring-violet-400', 'bg-violet-50/50')
                const playerData = e.dataTransfer.getData('player')
                if (playerData) {
                  const player = JSON.parse(playerData)
                  onAddToGroup(player, group.id)
                }
              }}
            >
              <div className={`h-1.5 bg-gradient-to-r ${getGroupColor(colorIdx)}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field text-sm py-1.5 px-3 w-32"
                        autoFocus
                        onKeyDown={(e) => { e.stopPropagation(); e.key === 'Enter' && handleSaveEdit(group.id); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(group.id); }}
                        className="btn-success text-sm py-1.5 px-3"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGroupColor(colorIdx)} flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                        onClick={(e) => { e.stopPropagation(); onBringToTop && onBringToTop(group.id); }}
                        title="点击置顶"
                      >
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <h3 
                          className="text-slate-800 font-semibold cursor-pointer hover:text-violet-600 transition-colors"
                          onClick={(e) => { e.stopPropagation(); onBringToTop && onBringToTop(group.id); }}
                          title="点击置顶"
                        >
                          {group.name}
                        </h3>
                        <p className="text-slate-500 text-xs">{(group.players || []).length} 名成员</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {editingScoreGroupId === group.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          className="w-20 input-field text-xs py-1 px-2"
                          autoFocus
                          onKeyDown={(e) => { e.stopPropagation(); e.key === 'Enter' && handleSaveScoreEdit(group.id); }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveScoreEdit(group.id); }}
                          className="btn-success text-xs py-1 px-2"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingScoreGroupId(null); }}
                          className="btn-secondary text-xs py-1 px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartScoreEdit(group); }}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                          group.customScore > 0 
                            ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-amber-600'
                        } transition-all`}
                        title="点击编辑组分数"
                      >
                        {group.customScore > 0 ? `+${group.customScore} 分` : '设置组分数'}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(group); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500 transition-all hover:scale-110"
                      title="重命名"
                    >
                      ✏️
                    </button>
                    {groups.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveGroup(group.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all hover:scale-110"
                        title="删除分组"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {(group.players || []).length > 0 ? (
                  <div className="space-y-2">
                  {(group.players || []).map(player => {
                      const avatarIdx = getAvatarIndex(player.nickname || player.playerName || '?')
                      return (
                        <div 
                          key={player.id} 
                          className="flex items-center justify-between bg-slate-50/80 rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-all group"
                          draggable={isAdmin}
                          onDragStart={(e) => {
                            if (isAdmin) {
                              e.dataTransfer.setData('player', JSON.stringify({ ...player, sourceGroupId: group.id }))
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold avatar-gradient-${avatarIdx} shadow-sm`}>
                              {player.nickname?.charAt(0) || player.playerName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-700 text-sm font-medium">
                                {player.nickname || player.playerName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFromGroup(player.id, group.id); }}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            移出
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    <p>该组暂无成员</p>
                    <p className="text-xs mt-1">从左侧拖拽或点击添加</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GroupPanel
