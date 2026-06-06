import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  conversations: [],
  messages: [],
  activePartner: null,
  onlineUserIds: [],
  isLoading: false,
  isError: false,
  message: '',
}

// Fetch conversations list
export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch('/api/chat/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch conversations')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Fetch messages with specific partner
export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (partnerId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`/api/chat/messages/${partnerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch messages')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    selectActivePartner: (state, action) => {
      state.activePartner = action.payload
      // Reset unread count for this conversations partner local copy
      const conv = state.conversations.find(
        (c) => c.user._id.toString() === (action.payload ? action.payload._id.toString() : '')
      )
      if (conv) conv.unreadCount = 0
    },
    addIncomingMessage: (state, action) => {
      const msg = action.payload
      // Only append if it belongs to the currently active conversation
      const currentUserId = JSON.parse(localStorage.getItem('devcircle_user'))._id
      const partnerId = state.activePartner ? state.activePartner._id.toString() : null

      const isFromActivePartner = msg.sender._id.toString() === partnerId
      const isToActivePartner = msg.recipient._id.toString() === partnerId && msg.sender._id.toString() === currentUserId

      if (isFromActivePartner || isToActivePartner) {
        state.messages.push(msg)
      }

      // Update conversations listing list locally
      const conversationsPartner = msg.sender._id.toString() === currentUserId ? msg.recipient : msg.sender
      const partnerIdInConv = conversationsPartner._id.toString()

      const existingConv = state.conversations.find((c) => c.user._id.toString() === partnerIdInConv)

      if (existingConv) {
        existingConv.lastMessage = msg.text
        existingConv.lastMessageTime = msg.createdAt
        if (!isFromActivePartner && msg.sender._id.toString() !== currentUserId) {
          existingConv.unreadCount += 1
        }
      } else {
        state.conversations.unshift({
          user: conversationsPartner,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: (msg.sender._id.toString() !== currentUserId) ? 1 : 0
        })
      }

      // Sort conversations so the latest message is top
      state.conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    },
    updateOnlineUsersList: (state, action) => {
      state.onlineUserIds = action.payload
    },
    resetChatState: (state) => {
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false
        state.messages = action.payload
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  },
})

export const { selectActivePartner, addIncomingMessage, updateOnlineUsersList, resetChatState } = chatSlice.actions
export default chatSlice.reducer
