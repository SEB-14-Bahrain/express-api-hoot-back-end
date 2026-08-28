const dotenv = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5174',
  },
})

const PORT = process.env.PORT ? process.env.PORT : "3000"

const authCtrl = require('./controllers/auth')
const usersCtrl = require('./controllers/users')
const hootCtrl = require('./controllers/hoots')
const commentsCtrl = require('./controllers/comments')

const verifyToken = require('./middleware/verify-token')

mongoose.connect(process.env.MONGODB_URI)

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}. 🥭`)
})

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Routes go here
app.get('/', (req, res) => {res.send('Hello!')})
app.post('/auth/sign-up', authCtrl.signUp)
app.post('/auth/sign-in', authCtrl.signIn)

app.get('/users', verifyToken, usersCtrl.index)

// Hoot Routes
app.post('/hoots', verifyToken, hootCtrl.create)
app.get('/hoots', verifyToken, hootCtrl.index)
app.get('/hoots/:hootId', verifyToken, hootCtrl.show)
app.put('/hoots/:hootId', verifyToken, hootCtrl.update)
app.delete('/hoots/:hootId', verifyToken, hootCtrl.deleteHoot)

// Comments Routes
app.post('/hoots/:hootId/comments', verifyToken, commentsCtrl.create)
app.put('/hoots/:hootId/comments/:commentId', verifyToken, commentsCtrl.update)
app.delete('/hoots/:hootId/comments/:commentId', verifyToken, commentsCtrl.deleteComment)

io.on('connection', (socket) => {
  console.log('Socket connected: ', socket.id)

  socket.on('chat message', (messageData) => {
    console.log('Chat event received:', messageData)

    const newMessage = {
      id: `${socket.id}=${Date.now()}`,
      username: messageData.username,
      text: messageData.text,
    }

    console.log('Chat event broadcast: ', newMessage)

    io.emit('chat message', newMessage)
  })

  socket.on('disconnect',() => {
    console.log('Socket disconnected: ', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`The express app is ready on port ${PORT}! 😀`)
})
