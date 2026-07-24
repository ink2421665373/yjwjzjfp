const PlayerCard = ({ player, onDelete, onEditNickname, isAdmin, groupCustomScore, showDelete, draggable }) => {
  const getAvatarIndex = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 6 + 1
  }

  const avatarIndex = getAvatarIndex(player.nickname || player.playerName || '?')

  const handleDragStart = (e) => {
    e.dataTransfer.setData('player', JSON.stringify(player))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleClick = (e) => {
    if (e.target.closest('.player-action-btn')) return
  }

  return (
    <div 
      className="glass-card glass-card-hover cursor-grab active:cursor-grabbing overflow-hidden animate-fade-in"
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 avatar-gradient-${avatarIndex} shadow-md animate-glow-pulse`}>
              {player.nickname?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-800 font-semibold truncate">{player.nickname}</h3>
              <p className="text-slate-500 text-sm truncate">{player.playerName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && onEditNickname && (
              <button
                className="player-action-btn p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditNickname(player)
                }}
                title="编辑昵称"
              >
                ✏️
              </button>
            )}
            {showDelete && isAdmin && onDelete && (
              <button
                className="player-action-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(player.id)
                }}
                title="删除"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {groupCustomScore !== undefined && groupCustomScore > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center">
            <span className="text-slate-500 text-sm">组分数</span>
            <span className="badge badge-yellow">
              +{groupCustomScore}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerCard
