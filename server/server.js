const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 3001
const SECRET_KEY = 'naraka_team_allocator_secret_key_2024'

const db = new Database('./data/naraka.db')

function initDatabase() {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerId TEXT,
    playerName TEXT,
    nickname TEXT,
    score REAL DEFAULT 0,
    stats TEXT,
    recentBattles TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    customScore REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS group_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER,
    playerId INTEGER,
    FOREIGN KEY(groupId) REFERENCES groups(id),
    FOREIGN KEY(playerId) REFERENCES players(id)
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    pinned INTEGER DEFAULT 0
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS score_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount === 0) {
    const adminPassword = bcrypt.hashSync('admin', 10)
    const userPassword = bcrypt.hashSync('user', 10)
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', adminPassword, 'admin')
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('user', userPassword, 'user')
    console.log('Default users created')
  }

  const groupCount = db.prepare('SELECT COUNT(*) as count FROM groups').get().count
  if (groupCount === 0) {
    db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('1组', 1)
    db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('2组', 2)
    db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('3组', 3)
    console.log('Default groups created')
  }

  const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count
  if (announcementCount === 0) {
    db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run('欢迎使用队友分配系统', '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', '管理员', 1)
    db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run('使用提示', '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', '管理员', 0)
    db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run('权限说明', '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', '管理员', 0)
    console.log('Default announcements created')
  }
}

initDatabase()

app.use(cors())
app.use(express.json())

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const user = jwt.verify(token, SECRET_KEY)
    req.user = user
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }
  
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY)
  res.json({ token, user: { username: user.username, role: user.role } })
})

app.get('/api/players', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM players ORDER BY createdAt DESC').all()
  const players = rows.map(p => ({
    ...p,
    stats: p.stats ? JSON.parse(p.stats) : null,
    recentBattles: p.recentBattles ? JSON.parse(p.recentBattles) : null
  }))
  res.json(players)
})

app.post('/api/players', authenticateToken, requireAdmin, (req, res) => {
  const { playerId, playerName, nickname, score, stats, recentBattles } = req.body
  
  const info = db.prepare('INSERT INTO players (playerId, playerName, nickname, score, stats, recentBattles) VALUES (?, ?, ?, ?, ?, ?)').run(
    playerId, playerName, nickname, score, JSON.stringify(stats), JSON.stringify(recentBattles)
  )
  
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid)
  res.json({
    ...row,
    stats: row.stats ? JSON.parse(row.stats) : null,
    recentBattles: row.recentBattles ? JSON.parse(row.recentBattles) : null
  })
})

app.delete('/api/players/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  db.prepare('DELETE FROM group_players WHERE playerId = ?').run(id)
  const info = db.prepare('DELETE FROM players WHERE id = ?').run(id)
  
  res.json({ success: info.changes > 0 })
})

app.get('/api/groups', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM groups ORDER BY id').all()
  const gpRows = db.prepare('SELECT * FROM group_players').all()
  
  const groups = rows.map(group => {
    const groupPlayerIds = gpRows.filter(gp => gp.groupId === group.id).map(gp => gp.playerId)
    return { ...group, playerIds: groupPlayerIds }
  })
  res.json(groups)
})

app.post('/api/groups', authenticateToken, requireAdmin, (req, res) => {
  const { name, customScore } = req.body
  
  const groupCount = db.prepare('SELECT COUNT(*) as count FROM groups').get().count
  const score = customScore !== undefined ? customScore : (groupCount + 1)
  
  const info = db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run(name, score)
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(info.lastInsertRowid)
  
  res.json({ ...row, playerIds: [] })
})

app.put('/api/groups/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  const { name, customScore } = req.body
  
  db.prepare('UPDATE groups SET name = ?, customScore = ? WHERE id = ?').run(name, customScore || 0, id)
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(id)
  const gpRows = db.prepare('SELECT playerId FROM group_players WHERE groupId = ?').all(id)
  
  res.json({ ...row, playerIds: gpRows.map(gp => gp.playerId) })
})

app.delete('/api/groups/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  db.prepare('DELETE FROM group_players WHERE groupId = ?').run(id)
  const info = db.prepare('DELETE FROM groups WHERE id = ?').run(id)
  
  res.json({ success: info.changes > 0 })
})

app.post('/api/groups/:id/players/:playerId', authenticateToken, requireAdmin, (req, res) => {
  const groupId = req.params.id
  const playerId = req.params.playerId
  
  db.prepare('DELETE FROM group_players WHERE playerId = ?').run(playerId)
  db.prepare('INSERT INTO group_players (groupId, playerId) VALUES (?, ?)').run(groupId, playerId)
  
  res.json({ success: true })
})

app.delete('/api/groups/:id/players/:playerId', authenticateToken, requireAdmin, (req, res) => {
  const groupId = req.params.id
  const playerId = req.params.playerId
  
  const info = db.prepare('DELETE FROM group_players WHERE groupId = ? AND playerId = ?').run(groupId, playerId)
  
  res.json({ success: info.changes > 0 })
})

app.get('/api/announcements', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY pinned DESC, createdAt DESC').all()
  res.json(rows)
})

app.post('/api/announcements', authenticateToken, requireAdmin, (req, res) => {
  const { title, content, author, pinned } = req.body
  
  const info = db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run(
    title, content, author, pinned ? 1 : 0
  )
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid)
  
  res.json(row)
})

app.put('/api/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  const { title, content, author, pinned } = req.body
  
  db.prepare('UPDATE announcements SET title = ?, content = ?, author = ?, pinned = ? WHERE id = ?').run(
    title, content, author, pinned ? 1 : 0, id
  )
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id)
  
  res.json(row)
})

app.delete('/api/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  const info = db.prepare('DELETE FROM announcements WHERE id = ?').run(id)
  
  res.json({ success: info.changes > 0 })
})

app.get('/api/score-config', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM score_config').all()
  const config = rows.reduce((acc, row) => {
    try {
      acc[row.key] = JSON.parse(row.value)
    } catch {
      acc[row.key] = row.value
    }
    return acc
  }, {})
  res.json(config)
})

app.post('/api/score-config', authenticateToken, requireAdmin, (req, res) => {
  const config = req.body
  
  Object.keys(config).forEach(key => {
    db.prepare('INSERT OR REPLACE INTO score_config (key, value) VALUES (?, ?)').run(key, JSON.stringify(config[key]))
  })
  
  res.json({ success: true })
})

app.post('/api/clear-all-data', authenticateToken, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM group_players').run()
  db.prepare('DELETE FROM players').run()
  db.prepare('DELETE FROM groups').run()
  db.prepare('DELETE FROM announcements').run()
  
  db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('1组', 1)
  db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('2组', 2)
  db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run('3组', 3)
  
  db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run(
    '欢迎使用队友分配系统', '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', '管理员', 1
  )
  db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run(
    '使用提示', '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', '管理员', 0
  )
  db.prepare('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)').run(
    '权限说明', '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', '管理员', 0
  )
  
  res.json({ success: true })
})

app.post('/api/import-groups', authenticateToken, requireAdmin, (req, res) => {
  const groups = req.body
  
  db.prepare('DELETE FROM group_players').run()
  db.prepare('DELETE FROM players').run()
  db.prepare('DELETE FROM groups').run()
  
  groups.forEach((group, index) => {
    const groupInfo = db.prepare('INSERT INTO groups (name, customScore) VALUES (?, ?)').run(
      group.name, group.customScore || 0
    )
    const groupId = groupInfo.lastInsertRowid
    
    if (group.players && Array.isArray(group.players)) {
      group.players.forEach(player => {
        const playerInfo = db.prepare('INSERT INTO players (playerName, nickname) VALUES (?, ?)').run(
          player.playerName || player.nickname || '',
          player.nickname || player.playerName || ''
        )
        const playerId = playerInfo.lastInsertRowid
        
        db.prepare('INSERT INTO group_players (groupId, playerId) VALUES (?, ?)').run(groupId, playerId)
      })
    }
  })
  
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
