import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
const API_URL = import.meta.env.VITE_API_URL

const initialState = {
  notifications: [],
  isLoading: false,
  isError: false,
  message: '',
}

// Fetch all notifications
export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/chat/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Mark notifications as read
export const markNotificationsAsRead = createAsyncThunk('notifications/markRead', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/chat/notifications`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to mark notifications read')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addIncomingNotification: (state, action) => {
      // Avoid duplicates
      const exists = state.notifications.some((n) => n._id === action.payload._id)
      if (!exists) {
        state.notifications.unshift(action.payload)
      }
    },
    resetNotificationState: (state) => {
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.notifications = action.payload
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Mark read
      .addCase(markNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true
        })
      })
  },
})

export const { addIncomingNotification, resetNotificationState } = notificationSlice.actions
export default notificationSlice.reducer
export const selectUnreadCount = (state) => state.notifications.notifications.filter((n) => !n.isRead).length
