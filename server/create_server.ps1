$serverCode = @"
const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 3001
const SECRET_KEY = 'naraka_team_allocator_secret_key_2024'

const db = new sqlite3.Database('./data/naraka.db', (err) => {
  if (err) {
    console.error('Error opening database:', err)
  } else {
    console.log('Connected to SQLite database')
    initDatabase()
  }
})

function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerId TEXT,
    playerName TEXT,
    nickname TEXT,
    score REAL DEFAULT 0,
    stats TEXT,
    recentBattles TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    customScore REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS group_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER,
    playerId INTEGER,
    FOREIGN KEY(groupId) REFERENCES groups(id),
    FOREIGN KEY(playerId) REFERENCES players(id)
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    pinned INTEGER DEFAULT 0
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS score_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`)

  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && row.count === 0) {
      const adminPassword = bcrypt.hashSync('admin', 10)
      const userPassword = bcrypt.hashSync('user', 10)
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', adminPassword, 'admin'])
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['user', userPassword, 'user'])
      console.log('Default users created')
    }
  })

  db.get('SELECT COUNT(*) as count FROM groups', (err, row) => {
    if (!err && row.count === 0) {
      db.run('INSERT INTO groups (name, customScore) VALUES (?, ?)', ['1组', 0])
      db.run('INSERT INTO groups (name, customScore) VALUES (?, ?)', ['2组', 0])
      db.run('INSERT INTO groups (name, customScore) VALUES (?, ?)', ['3组', 0])
      console.log('Default groups created')
    }
  })

  db.get('SELECT COUNT(*) as count FROM announcements', (err, row) => {
    if (!err && row.count === 0) {
      db.run('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
        ['欢迎使用队友分配系统', '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', '管理员', 1])
      db.run('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
        ['使用提示', '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', '管理员', 0])
      db.run('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
        ['权限说明', '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', '管理员', 0])
      console.log('Default announcements created')
    }
  })
}

app.use(cors())
app.use(express.json())

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: 'Invalid username or password' })
      }
      
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY)
      res.json({ token, user: { username: user.username, role: user.role } })
    })
  })
})

app.get('/api/players', authenticateToken, (req, res) => {
  db.all('SELECT * FROM players ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    const players = rows.map(p => ({
      ...p,
      stats: p.stats ? JSON.parse(p.stats) : null,
      recentBattles: p.recentBattles ? JSON.parse(p.recentBattles) : null
    }))
    res.json(players)
  })
})

app.post('/api/players', authenticateToken, requireAdmin, (req, res) => {
  const { playerId, playerName, nickname, score, stats, recentBattles } = req.body
  
  db.run(
    'INSERT INTO players (playerId, playerName, nickname, score, stats, recentBattles) VALUES (?, ?, ?, ?, ?, ?)',
    [playerId, playerName, nickname, score, JSON.stringify(stats), JSON.stringify(recentBattles)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      db.get('SELECT * FROM players WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({
          ...row,
          stats: row.stats ? JSON.parse(row.stats) : null,
          recentBattles: row.recentBattles ? JSON.parse(row.recentBattles) : null
        })
      })
    }
  )
})

app.delete('/api/players/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  db.run('DELETE FROM group_players WHERE playerId = ?', [id], () => {
    db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json({ success: this.changes > 0 })
    })
  })
})

app.get('/api/groups', authenticateToken, (req, res) => {
  db.all('SELECT * FROM groups ORDER BY id', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    db.all('SELECT * FROM group_players', (err, gpRows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      const groups = rows.map(group => {
        const groupPlayerIds = gpRows.filter(gp => gp.groupId === group.id).map(gp => gp.playerId)
        return { ...group, playerIds: groupPlayerIds }
      })
      res.json(groups)
    })
  })
})

app.post('/api/groups', authenticateToken, requireAdmin, (req, res) => {
  const { name, customScore } = req.body
  
  db.run(
    'INSERT INTO groups (name, customScore) VALUES (?, ?)',
    [name, customScore || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      db.get('SELECT * FROM groups WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({ ...row, playerIds: [] })
      })
    }
  )
})

app.put('/api/groups/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  const { name, customScore } = req.body
  
  db.run(
    'UPDATE groups SET name = ?, customScore = ? WHERE id = ?',
    [name, customScore || 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      db.get('SELECT * FROM groups WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        db.all('SELECT playerId FROM group_players WHERE groupId = ?', [id], (err, gpRows) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          res.json({ ...row, playerIds: gpRows.map(gp => gp.playerId) })
        })
      })
    }
  )
})

app.delete('/api/groups/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  db.run('DELETE FROM group_players WHERE groupId = ?', [id], () => {
    db.run('DELETE FROM groups WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json({ success: this.changes > 0 })
    })
  })
})

app.post('/api/groups/:id/players/:playerId', authenticateToken, requireAdmin, (req, res) => {
  const groupId = req.params.id
  const playerId = req.params.playerId
  
  db.run('DELETE FROM group_players WHERE playerId = ?', [playerId], () => {
    db.run(
      'INSERT INTO group_players (groupId, playerId) VALUES (?, ?)',
      [groupId, playerId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({ success: true })
      }
    )
  })
})

app.delete('/api/groups/:id/players/:playerId', authenticateToken, requireAdmin, (req, res) => {
  const groupId = req.params.id
  const playerId = req.params.playerId
  
  db.run(
    'DELETE FROM group_players WHERE groupId = ? AND playerId = ?',
    [groupId, playerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json({ success: this.changes > 0 })
    }
  )
})

app.get('/api/announcements', authenticateToken, (req, res) => {
  db.all('SELECT * FROM announcements ORDER BY pinned DESC, createdAt DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    res.json(rows)
  })
})

app.post('/api/announcements', authenticateToken, requireAdmin, (req, res) => {
  const { title, content, author, pinned } = req.body
  
  db.run(
    'INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)',
    [title, content, author, pinned ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      db.get('SELECT * FROM announcements WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(row)
      })
    }
  )
})

app.put('/api/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  const { title, content, author, pinned } = req.body
  
  db.run(
    'UPDATE announcements SET title = ?, content = ?, author = ?, pinned = ? WHERE id = ?',
    [title, content, author, pinned ? 1 : 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      db.get('SELECT * FROM announcements WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(row)
      })
    }
  )
})

app.delete('/api/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id
  
  db.run('DELETE FROM announcements WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    res.json({ success: this.changes > 0 })
  })
})

app.get('/api/score-config', authenticateToken, (req, res) => {
  db.all('SELECT * FROM score_config', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
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
})

app.post('/api/score-config', authenticateToken, requireAdmin, (req, res) => {
  const config = req.body
  
  const keys = Object.keys(config)
  let completed = 0
  
  keys.forEach(key => {
    db.run(
      'INSERT OR REPLACE INTO score_config (key, value) VALUES (?, ?)',
      [key, JSON.stringify(config[key])],
      () => {
        completed++
        if (completed === keys.length) {
          res.json({ success: true })
        }
      }
    )
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
"@

Set-Content -Path "server.js" -Value $serverCode -Encoding UTF8
Write-Host "server.js created successfully"
