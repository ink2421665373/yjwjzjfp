import os
import json
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import bcrypt

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get('PORT', 3001))
SECRET_KEY = 'naraka_team_allocator_secret_key_2024'

DB_PATH = './data/naraka.db'


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    os.makedirs('./data', exist_ok=True)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playerId TEXT,
            playerName TEXT,
            nickname TEXT,
            score REAL DEFAULT 0,
            stats TEXT,
            recentBattles TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            customScore REAL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS group_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            groupId INTEGER,
            playerId INTEGER,
            FOREIGN KEY(groupId) REFERENCES groups(id),
            FOREIGN KEY(playerId) REFERENCES players(id)
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            author TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            pinned INTEGER DEFAULT 0
        )''')

        cursor.execute('''CREATE TABLE IF NOT EXISTS score_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )''')

        cursor.execute('SELECT COUNT(*) as count FROM users')
        user_count = cursor.fetchone()['count']
        if user_count == 0:
            admin_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_password = bcrypt.hashpw('user'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ('admin', admin_password, 'admin'))
            cursor.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ('user', user_password, 'user'))
            print('Default users created')

        cursor.execute('SELECT COUNT(*) as count FROM groups')
        group_count = cursor.fetchone()['count']
        if group_count == 0:
            cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('1组', 0))
            cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('2组', 0))
            cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('3组', 0))
            print('Default groups created')

        cursor.execute('SELECT COUNT(*) as count FROM announcements')
        announcement_count = cursor.fetchone()['count']
        if announcement_count == 0:
            cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                          ('欢迎使用队友分配系统', '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', '管理员', 1))
            cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                          ('使用提示', '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', '管理员', 0))
            cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                          ('权限说明', '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', '管理员', 0))
            print('Default announcements created')

        conn.commit()


init_database()


def authenticate_token(f):
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            user = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = user
            return f(*args, **kwargs)
        except IndexError:
            return jsonify({'error': 'Invalid token format'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403
    decorated.__name__ = f.__name__
    return decorated


def require_admin(f):
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        token = jwt.encode({
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'role': user['role']
            }
        })


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    if len(username) < 3 or len(username) > 20:
        return jsonify({'error': 'Username must be 3-20 characters'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', (username,))
        if cursor.fetchone()['count'] > 0:
            return jsonify({'error': 'Username already exists'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                      (username, hashed_password, 'user'))
        conn.commit()
        
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        token = jwt.encode({
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'role': user['role']
            },
            'message': 'Registration successful'
        })


@app.route('/api/change-password', methods=['POST'])
@authenticate_token
def change_password():
    data = request.get_json()
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')
    
    if not old_password or not new_password or not confirm_password:
        return jsonify({'error': 'All fields are required'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    user_id = request.user.get('id')
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not bcrypt.checkpw(old_password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Old password is incorrect'}), 401
        
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute('UPDATE users SET password = ? WHERE id = ?', (hashed_password, user_id))
        conn.commit()
        
        return jsonify({'message': 'Password changed successfully'})


@app.route('/api/players', methods=['GET'])
@authenticate_token
def get_players():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM players ORDER BY createdAt DESC')
        rows = cursor.fetchall()
        
        players = []
        for row in rows:
            player = dict(row)
            try:
                player['stats'] = json.loads(player['stats']) if player['stats'] else None
            except:
                player['stats'] = None
            try:
                player['recentBattles'] = json.loads(player['recentBattles']) if player['recentBattles'] else None
            except:
                player['recentBattles'] = None
            players.append(player)
        
        return jsonify(players)


@app.route('/api/players', methods=['POST'])
@authenticate_token
@require_admin
def add_player():
    data = request.get_json()
    player_id = data.get('playerId')
    player_name = data.get('playerName')
    nickname = data.get('nickname')
    score = data.get('score', 0)
    stats = data.get('stats')
    recent_battles = data.get('recentBattles')
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''INSERT INTO players (playerId, playerName, nickname, score, stats, recentBattles) 
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      (player_id, player_name, nickname, score, 
                       json.dumps(stats) if stats else None, 
                       json.dumps(recent_battles) if recent_battles else None))
        conn.commit()
        
        cursor.execute('SELECT * FROM players WHERE id = ?', (cursor.lastrowid,))
        row = cursor.fetchone()
        result = dict(row)
        try:
            result['stats'] = json.loads(result['stats']) if result['stats'] else None
        except:
            result['stats'] = None
        try:
            result['recentBattles'] = json.loads(result['recentBattles']) if result['recentBattles'] else None
        except:
            result['recentBattles'] = None
        
        return jsonify(result)


@app.route('/api/players/<int:id>', methods=['DELETE'])
@authenticate_token
@require_admin
def delete_player(id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM group_players WHERE playerId = ?', (id,))
        cursor.execute('DELETE FROM players WHERE id = ?', (id,))
        conn.commit()
        
        return jsonify({'success': cursor.rowcount > 0})


@app.route('/api/groups', methods=['GET'])
@authenticate_token
def get_groups():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM groups ORDER BY id')
        rows = cursor.fetchall()
        
        cursor.execute('SELECT * FROM group_players')
        gp_rows = cursor.fetchall()
        
        groups = []
        for row in rows:
            group = dict(row)
            group_player_ids = [gp['playerId'] for gp in gp_rows if gp['groupId'] == group['id']]
            group['playerIds'] = group_player_ids
            groups.append(group)
        
        return jsonify(groups)


@app.route('/api/groups', methods=['POST'])
@authenticate_token
@require_admin
def add_group():
    data = request.get_json()
    name = data.get('name')
    custom_score = data.get('customScore', 0)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', (name, custom_score))
        conn.commit()
        
        cursor.execute('SELECT * FROM groups WHERE id = ?', (cursor.lastrowid,))
        row = cursor.fetchone()
        
        return jsonify({**dict(row), 'playerIds': []})


@app.route('/api/groups/<int:id>', methods=['PUT'])
@authenticate_token
@require_admin
def update_group(id):
    data = request.get_json()
    name = data.get('name')
    custom_score = data.get('customScore', 0)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE groups SET name = ?, customScore = ? WHERE id = ?', (name, custom_score, id))
        conn.commit()
        
        cursor.execute('SELECT * FROM groups WHERE id = ?', (id,))
        row = cursor.fetchone()
        
        cursor.execute('SELECT playerId FROM group_players WHERE groupId = ?', (id,))
        gp_rows = cursor.fetchall()
        
        return jsonify({**dict(row), 'playerIds': [gp['playerId'] for gp in gp_rows]})


@app.route('/api/groups/<int:id>', methods=['DELETE'])
@authenticate_token
@require_admin
def delete_group(id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM group_players WHERE groupId = ?', (id,))
        cursor.execute('DELETE FROM groups WHERE id = ?', (id,))
        conn.commit()
        
        return jsonify({'success': cursor.rowcount > 0})


@app.route('/api/groups/<int:id>/players/<int:player_id>', methods=['POST'])
@authenticate_token
@require_admin
def add_player_to_group(id, player_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM group_players WHERE playerId = ?', (player_id,))
        cursor.execute('INSERT INTO group_players (groupId, playerId) VALUES (?, ?)', (id, player_id))
        conn.commit()
        
        return jsonify({'success': True})


@app.route('/api/groups/<int:id>/players/<int:player_id>', methods=['DELETE'])
@authenticate_token
@require_admin
def remove_player_from_group(id, player_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM group_players WHERE groupId = ? AND playerId = ?', (id, player_id))
        conn.commit()
        
        return jsonify({'success': cursor.rowcount > 0})


@app.route('/api/announcements', methods=['GET'])
@authenticate_token
def get_announcements():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM announcements ORDER BY pinned DESC, createdAt DESC')
        rows = cursor.fetchall()
        
        return jsonify([dict(row) for row in rows])


@app.route('/api/announcements', methods=['POST'])
@authenticate_token
@require_admin
def add_announcement():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    author = data.get('author')
    pinned = data.get('pinned', 0)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)',
                      (title, content, author, 1 if pinned else 0))
        conn.commit()
        
        cursor.execute('SELECT * FROM announcements WHERE id = ?', (cursor.lastrowid,))
        row = cursor.fetchone()
        
        return jsonify(dict(row))


@app.route('/api/announcements/<int:id>', methods=['PUT'])
@authenticate_token
@require_admin
def update_announcement(id):
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    author = data.get('author')
    pinned = data.get('pinned', 0)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE announcements SET title = ?, content = ?, author = ?, pinned = ? WHERE id = ?',
                      (title, content, author, 1 if pinned else 0, id))
        conn.commit()
        
        cursor.execute('SELECT * FROM announcements WHERE id = ?', (id,))
        row = cursor.fetchone()
        
        return jsonify(dict(row))


@app.route('/api/announcements/<int:id>', methods=['DELETE'])
@authenticate_token
@require_admin
def delete_announcement(id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM announcements WHERE id = ?', (id,))
        conn.commit()
        
        return jsonify({'success': cursor.rowcount > 0})


@app.route('/api/score-config', methods=['GET'])
@authenticate_token
def get_score_config():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM score_config')
        rows = cursor.fetchall()
        
        config = {}
        for row in rows:
            try:
                config[row['key']] = json.loads(row['value'])
            except:
                config[row['key']] = row['value']
        
        return jsonify(config)


@app.route('/api/score-config', methods=['POST'])
@authenticate_token
@require_admin
def save_score_config():
    data = request.get_json()
    
    with get_db() as conn:
        cursor = conn.cursor()
        for key, value in data.items():
            cursor.execute('INSERT OR REPLACE INTO score_config (key, value) VALUES (?, ?)',
                          (key, json.dumps(value)))
        conn.commit()
        
        return jsonify({'success': True})


@app.route('/api/clear-all-data', methods=['POST'])
@authenticate_token
@require_admin
def clear_all_data():
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM group_players')
        cursor.execute('DELETE FROM players')
        cursor.execute('DELETE FROM groups')
        cursor.execute('DELETE FROM announcements')
        
        cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('1组', 0))
        cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('2组', 0))
        cursor.execute('INSERT INTO groups (name, customScore) VALUES (?, ?)', ('3组', 0))
        
        cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                      ('欢迎使用队友分配系统', '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', '管理员', 1))
        cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                      ('使用提示', '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', '管理员', 0))
        cursor.execute('INSERT INTO announcements (title, content, author, pinned) VALUES (?, ?, ?, ?)', 
                      ('权限说明', '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', '管理员', 0))
        
        conn.commit()
        
        return jsonify({'success': True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
