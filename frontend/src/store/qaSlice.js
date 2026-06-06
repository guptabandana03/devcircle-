import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
const API_URL = import.meta.env.VITE_API_URL

const initialState = {
  questions: [],
  currentQuestion: null,
  answers: [],
  isLoading: false,
  isError: false,
  message: '',
}

// Fetch all questions
export const fetchQuestions = createAsyncThunk('qa/fetchAll', async ({ tag = '', sort = '' } = {}, thunkAPI) => {
  try {
    const url = `${API_URL}/api/questions?tag=${tag}&sort=${sort}`
    const response = await fetch(url)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch questions')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Fetch single question by ID
export const fetchQuestionById = createAsyncThunk('qa/fetchById', async (questionId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/api/questions/${questionId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch question details')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Create question
export const createQuestion = createAsyncThunk('qa/create', async (questionData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(questionData),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to ask question')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Vote question
export const voteQuestion = createAsyncThunk('qa/voteQuestion', async ({ questionId, direction }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/questions/${questionId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ direction }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Voting failed')
    return { questionId, ...data } // data has { upvotesCount, downvotesCount, score }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Fetch answers for a question
export const fetchAnswers = createAsyncThunk('qa/fetchAnswers', async (questionId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/api/questions/${questionId}/answers`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch answers')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Add answer to a question
export const createAnswer = createAsyncThunk('qa/createAnswer', async ({ questionId, content }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/questions/${questionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to add answer')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Vote answer
export const voteAnswer = createAsyncThunk('qa/voteAnswer', async ({ answerId, direction }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/questions/answers/${answerId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ direction }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Voting failed')
    return { answerId, ...data }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

// Accept answer
export const acceptAnswer = createAsyncThunk('qa/acceptAnswer', async (answerId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const response = await fetch(`${API_URL}/api/questions/answers/${answerId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Action failed')
    return { answerId, ...data } // data has { questionAcceptedAnswer, answerIsAccepted }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const qaSlice = createSlice({
  name: 'qa',
  initialState,
  reducers: {
    resetQaState: (state) => {
      state.isError = false
      state.message = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false
        state.questions = action.payload
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      // Fetch Single Question
      .addCase(fetchQuestionById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentQuestion = action.payload
      })
      // Vote Question
      .addCase(voteQuestion.fulfilled, (state, action) => {
        if (state.currentQuestion && state.currentQuestion._id === action.payload.questionId) {
          state.currentQuestion.upvotesCount = action.payload.upvotesCount
          state.currentQuestion.downvotesCount = action.payload.downvotesCount
        }
        const question = state.questions.find((q) => q._id === action.payload.questionId)
        if (question) {
          // Simply update total votes lists lengths roughly for immediate feed UI updates
          question.score = action.payload.score
        }
      })
      // Fetch Answers
      .addCase(fetchAnswers.fulfilled, (state, action) => {
        state.answers = action.payload
      })
      // Create Answer
      .addCase(createAnswer.fulfilled, (state, action) => {
        state.answers.push(action.payload)
      })
      // Vote Answer
      .addCase(voteAnswer.fulfilled, (state, action) => {
        const answer = state.answers.find((a) => a._id === action.payload.answerId)
        if (answer) {
          answer.score = action.payload.score
          // Set arrays local lengths to mock votes if needed
        }
      })
      // Accept Answer
      .addCase(acceptAnswer.fulfilled, (state, action) => {
        if (state.currentQuestion) {
          state.currentQuestion.acceptedAnswer = action.payload.questionAcceptedAnswer
        }
        state.answers.forEach((ans) => {
          if (ans._id === action.payload.answerId) {
            ans.isAccepted = action.payload.answerIsAccepted
          } else {
            ans.isAccepted = false
          }
        })
      })
  },
})

export const { resetQaState } = qaSlice.actions
export default qaSlice.reducer
export const selectAllQuestions = (state) => state.qa.questions
export const selectCurrentQuestion = (state) => state.qa.currentQuestion
export const selectAnswers = (state) => state.qa.answers
