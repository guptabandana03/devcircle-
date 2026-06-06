import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import postReducer from './postSlice'
import qaReducer from './qaSlice'
import chatReducer from './chatSlice'
import notificationReducer from './notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    qa: qaReducer,
    chat: chatReducer,
    notifications: notificationReducer,
  },
})
export default store;
