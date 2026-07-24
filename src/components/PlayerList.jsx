import PlayerCard from './PlayerCard'

const PlayerList = ({ players, onRemove, onAllocate, isAdmin, onDragStart }) => {
  if (players.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl text-center">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-white/60">暂无玩家，请添加玩家后进行分配</p>
      </div>
    )
  }

  const sortedPlayers = [...players]

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          玩家列表 ({players.length}人)
        </h2>
        <button
          onClick={onAllocate}
          disabled={players.length < 2}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          🎯 开始分配
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {sortedPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} onRemove={onRemove} isAdmin={isAdmin} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

export default PlayerList