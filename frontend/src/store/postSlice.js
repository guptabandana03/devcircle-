import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  posts: [],
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isError: false,
  message: '',
}

// Fetch posts feed
export const fetchPosts = createAsyncThunk('posts/fetchAll', async ({ page = 1, limit = 10 } = {}, thunkAPI) => {
  try {
    const response = await fetch(`/api/posts?page=${page}&limit=${limit}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch feed')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Create post
export const createPost = createAsyncThunk('posts/create', async (postData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to create post')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Like post
export const likePost = createAsyncThunk('posts/like', async (postId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to like post')
    return { postId, ...data } // data has { isLiked, likesCount }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Repost post
export const repostPost = createAsyncThunk('posts/repost', async (postId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`/api/posts/${postId}/repost`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to repost')
    return { postId, ...data } // data has { isReposted, repostsCount }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Comment on post
export const commentPost = createAsyncThunk('posts/comment', async ({ postId, text }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to add comment')
    return { postId, comment: data }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Delete post
export const deletePost = createAsyncThunk('posts/delete', async (postId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to delete post')
    return postId
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    resetPostState: (state) => {
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.currentPage === 1) {
          state.posts = action.payload.posts
        } else {
          // Append for infinite scroll
          // Filter duplicates to be safe
          const newPosts = action.payload.posts.filter(
            (post) => !state.posts.some((p) => p._id === post._id)
          )
          state.posts = [...state.posts, ...newPosts]
        }
        state.currentPage = action.payload.currentPage
        state.totalPages = action.payload.totalPages
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Create post
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts = [action.payload, ...state.posts]
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p._id === action.payload.postId)
        if (post) {
          const userId = JSON.parse(localStorage.getItem('devcircle_user'))._id
          if (action.payload.isLiked) {
            post.likes.push(userId)
          } else {
            post.likes = post.likes.filter((id) => id !== userId)
          }
        }
      })
      // Repost post
      .addCase(repostPost.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p._id === action.payload.postId)
        if (post) {
          const userId = JSON.parse(localStorage.getItem('devcircle_user'))._id
          if (action.payload.isReposted) {
            post.reposts.push(userId)
          } else {
            post.reposts = post.reposts.filter((id) => id !== userId)
          }
        }
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload)
      })
  },
})

export const { resetPostState } = postSlice.actions
export default postSlice.reducer
export const selectAllPosts = (state) => state.posts.posts
