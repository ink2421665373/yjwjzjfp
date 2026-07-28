import axios from 'axios'

const BACKEND_URL = '/api'

const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
})

backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('naraka_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

let isRefreshing = false

backendApi.interceptors.response.use((response) => {
  return response
}, (error) => {
  const status = error.response?.status
  const code = error.response?.data?.code
  
  if (status === 401 && code === 'TOKEN_EXPIRED') {
    if (!isRefreshing) {
      isRefreshing = true
      localStorage.removeItem('naraka_token')
      localStorage.removeItem('naraka_user')
      
      const event = new CustomEvent('tokenExpired', {
        detail: { message: '登录已过期，请重新登录' }
      })
      window.dispatchEvent(event)
      
      setTimeout(() => {
        isRefreshing = false
        window.location.href = '/'
      }, 1000)
    }
    return Promise.reject(new Error('Token expired'))
  }
  
  if (status === 401 || status === 403) {
    if (!isRefreshing) {
      isRefreshing = true
      localStorage.removeItem('naraka_token')
      localStorage.removeItem('naraka_user')
      
      setTimeout(() => {
        isRefreshing = false
        window.location.href = '/'
      }, 1000)
    }
    return Promise.reject(new Error(error.response?.data?.error || '认证失败'))
  }
  
  throw new Error(error.response?.data?.error || error.message || '请求失败')
})

export const login = async (username, password) => {
  const response = await backendApi.post('/login', { username, password })
  if (response.data.token) {
    localStorage.setItem('naraka_token', response.data.token)
    localStorage.setItem('naraka_user', JSON.stringify(response.data.user))
  }
  return response.data
}

export const register = async (username, password) => {
  const response = await backendApi.post('/register', { username, password })
  if (response.data.token) {
    localStorage.setItem('naraka_token', response.data.token)
    localStorage.setItem('naraka_user', JSON.stringify(response.data.user))
  }
  return response.data
}

export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  const response = await backendApi.post('/change-password', { oldPassword, newPassword, confirmPassword })
  return response.data
}

export const getPlayers = async () => {
  const response = await backendApi.get('/players')
  return response.data
}

export const addPlayer = async (playerData) => {
  const response = await backendApi.post('/players', playerData)
  return response.data
}

export const deletePlayer = async (playerId) => {
  const response = await backendApi.delete(`/players/${playerId}`)
  return response.data
}

export const getGroups = async () => {
  const response = await backendApi.get('/groups')
  return response.data
}

export const addGroup = async (groupData) => {
  const response = await backendApi.post('/groups', groupData)
  return response.data
}

export const updateGroup = async (groupId, groupData) => {
  const response = await backendApi.put(`/groups/${groupId}`, groupData)
  return response.data
}

export const deleteGroup = async (groupId) => {
  const response = await backendApi.delete(`/groups/${groupId}`)
  return response.data
}

export const addPlayerToGroup = async (groupId, playerId) => {
  const response = await backendApi.post(`/groups/${groupId}/players/${playerId}`)
  return response.data
}

export const removePlayerFromGroup = async (groupId, playerId) => {
  const response = await backendApi.delete(`/groups/${groupId}/players/${playerId}`)
  return response.data
}

export const getAnnouncements = async () => {
  const response = await backendApi.get('/announcements')
  return response.data
}

export const addAnnouncement = async (announcementData) => {
  const response = await backendApi.post('/announcements', announcementData)
  return response.data
}

export const updateAnnouncement = async (announcementId, announcementData) => {
  const response = await backendApi.put(`/announcements/${announcementId}`, announcementData)
  return response.data
}

export const deleteAnnouncement = async (announcementId) => {
  const response = await backendApi.delete(`/announcements/${announcementId}`)
  return response.data
}

export const getScoreConfig = async () => {
  const response = await backendApi.get('/score-config')
  return response.data
}

export const saveScoreConfig = async (config) => {
  const response = await backendApi.post('/score-config', config)
  return response.data
}

export const clearAllData = async () => {
  const response = await backendApi.post('/clear-all-data')
  return response.data
}

export const importGroups = async (groupsData) => {
  const response = await backendApi.post('/import-groups', groupsData)
  return response.data
}
