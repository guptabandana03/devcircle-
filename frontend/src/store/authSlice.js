import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const user = JSON.parse(localStorage.getItem('devcircle_user'))
const token = localStorage.getItem('devcircle_token')

const initialState = {
  user: user || null,
  token: token || null,
  isLoading: false,
  isError: false,
  message: '',
}

// Register user
export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Registration failed')
    
    localStorage.setItem('devcircle_user', JSON.stringify({
      _id: data._id,
      username: data.username,
      email: data.email,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      skills: data.skills,
      githubUrl: data.githubUrl,
      role: data.role,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
    }))
    localStorage.setItem('devcircle_token', data.token)
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Login user
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Login failed')
    
    localStorage.setItem('devcircle_user', JSON.stringify({
      _id: data._id,
      username: data.username,
      email: data.email,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      skills: data.skills,
      githubUrl: data.githubUrl,
      role: data.role,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
    }))
    localStorage.setItem('devcircle_token', data.token)
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Update user profile
export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Update failed')
    
    const updatedUser = {
      ...thunkAPI.getState().auth.user,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      skills: data.skills,
      githubUrl: data.githubUrl,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
    }
    localStorage.setItem('devcircle_user', JSON.stringify(updatedUser))
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('devcircle_user')
      localStorage.removeItem('devcircle_token')
      state.user = null
      state.token = null
      state.isLoading = false
      state.isError = false
      state.message = ''
    },
    resetAuthState: (state) => {
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.token = action.payload.token
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = {
          ...state.user,
          avatarUrl: action.payload.avatarUrl,
          bio: action.payload.bio,
          skills: action.payload.skills,
          githubUrl: action.payload.githubUrl,
          followersCount: action.payload.followersCount,
          followingCount: action.payload.followingCount,
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  },
})

export const { logout, resetAuthState } = authSlice.actions
export default authSlice.reducer
