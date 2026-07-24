# 永劫无间队友分配系统

⚔️ 基于 React + Flask 构建的永劫无间游戏队友分配网站，支持分组管理、分队匹配、公告发布、权限控制等功能。

## 🎮 功能特性

### 核心功能
- **玩家管理**：添加玩家角色名，支持自定义昵称
- **分组管理**：按实力划分玩家等级，支持自定义分组分数
- **分队匹配**：实际匹配队伍，支持自定义队伍分数和排名展示
- **公告系统**：发布、编辑、删除公告，支持置顶功能
- **数据持久化**：所有数据存储到 SQLite 数据库，关闭网站后数据不丢失

### 权限管理
- **管理员权限**：添加/修改/删除玩家、分组、队伍、公告
- **普通用户权限**：仅查看功能

### 视觉效果
- **玻璃拟态设计**：半透明卡片、模糊效果、渐变色彩
- **粒子特效**：动态背景粒子漂浮、鼠标跟随、点击爆炸效果
- **动画效果**：卡片入场动画、悬停效果、按钮闪光动画

## 🛠️ 技术栈

### 前端
- **React 18** - 前端框架
- **Vite** - 构建工具
- **Tailwind CSS 3** - 样式框架
- **Axios** - HTTP 请求库
- **Canvas API** - 粒子特效

### 后端
- **Python 3** - 后端语言
- **Flask** - Web 框架
- **SQLite** - 数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密

## 📦 项目结构

```
yjwj/
├── src/                    # 前端源代码
│   ├── api/               # API 接口
│   │   └── backend.js     # 后端 API 调用封装
│   ├── components/        # React 组件
│   │   ├── AnnouncementPanel.jsx   # 公告栏组件
│   │   ├── GroupPanel.jsx         # 分组管理组件
│   │   ├── TeamPanel.jsx          # 分队匹配组件
│   │   ├── PlayerInput.jsx        # 玩家添加组件
│   │   ├── PlayerCard.jsx         # 玩家卡片组件
│   │   ├── LoginModal.jsx         # 登录弹窗组件
│   │   └── ParticleBackground.jsx # 粒子背景组件
│   ├── App.jsx            # 主应用组件
│   ├── main.jsx           # 入口文件
│   └── index.css          # 全局样式
├── server/                # 后端源代码
│   ├── server.py          # Flask 后端服务
│   ├── data/              # 数据库目录
│   │   └── naraka.db      # SQLite 数据库文件
│   └── requirements.txt   # Python 依赖
├── index.html             # HTML 模板
├── package.json           # 前端依赖
├── vite.config.js         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
└── postcss.config.js      # PostCSS 配置
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
pip install -r requirements.txt
cd ..
```

### 启动服务

```bash
# 启动后端服务（端口 3001）
cd server
python server.py

# 启动前端服务（端口 5176）
npm run dev
```

### 访问地址
- 前端页面：http://localhost:5176
- 后端 API：http://localhost:3001

## 🔐 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | admin | 全部权限 |
| 普通用户 | user | user | 仅查看 |

## 📝 使用说明

### 添加玩家
1. 在左侧"添加玩家"区域输入角色名
2. 可选：设置自定义昵称
3. 点击"添加玩家"按钮

### 分组管理
1. 添加玩家后，玩家会出现在"未分组玩家"列表
2. 点击玩家卡片可以分配到指定分组
3. 支持拖拽移动玩家到分组
4. 可以设置每个分组的"组分数"

### 分队匹配
1. 在右侧"分队匹配"区域，点击玩家添加到队伍
2. 可以设置每个队伍的"自定义分数"
3. 排名根据队伍的自定义分数计算
4. 点击"确认分队"完成分配

### 公告管理
1. 点击"发布公告"按钮
2. 填写标题、内容、作者
3. 支持置顶、编辑、删除公告

## 🌊 粒子特效

- **漂浮粒子**：彩色粒子在背景中缓慢漂浮
- **粒子连线**：粒子之间距离较近时自动连接
- **鼠标跟随**：鼠标移动时产生紫色光晕，吸引周围粒子
- **点击爆炸**：点击屏幕产生粒子爆炸效果

## 🗂️ API 接口

### 认证接口
- `POST /api/login` - 用户登录

### 玩家接口
- `GET /api/players` - 获取所有玩家
- `POST /api/players` - 添加玩家
- `PUT /api/players/:id` - 更新玩家
- `DELETE /api/players/:id` - 删除玩家

### 分组接口
- `GET /api/groups` - 获取所有分组
- `POST /api/groups` - 添加分组
- `PUT /api/groups/:id` - 更新分组
- `DELETE /api/groups/:id` - 删除分组

### 队伍接口
- `GET /api/teams` - 获取所有队伍
- `POST /api/teams` - 添加队伍
- `PUT /api/teams/:id` - 更新队伍
- `DELETE /api/teams/:id` - 删除队伍

### 公告接口
- `GET /api/announcements` - 获取所有公告
- `POST /api/announcements` - 添加公告
- `PUT /api/announcements/:id` - 更新公告
- `DELETE /api/announcements/:id` - 删除公告

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⚔️ 永劫无间队友分配系统 - 智能分配队友，保证各队实力均衡
