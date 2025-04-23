const express = require('express')
const bodyParser = require('body-parser')
const WebSocket = require('ws')
const http = require('http')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const JWT_SECRET = process.env.JWT_SECRET;
const { student, User } = require('./models')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const PORT = 3000
const hostName = "127.0.0.1"

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) {
      return res.sendStatus(401);
    }
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  };

wss.on('connection', (ws) => {
    console.log(`connecting to ws`)

    ws.on('message', (message) => {
        console.log(`Received: `, message)
    })

    ws.on('close', () => console.log(`disconnected`))
})

app.post('/send-message', (req, res) => {

    const { data } = req.body

    if (!!data == false) {
        res.status(422).json({
            data: [],
            message: "no message content !"
        })
        return
    }

    res.status(200).json({
        data: data,
        message: "send message success!"
    })
})

app.get("/", (req, res) => {
    res.send({
        message: "Welcome to my sosmed backend services!"
    })
})

app.get("/student", authenticateToken, async (req, res) => {
    try {
      const students = await
      student.findAll();
      res.status(200).json({
        data: students,
        message: "Successfully fetched all students!",
        user: req.user
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({
        data: [],
        message: "Failed to fetch students!",
        error: error.message
      });
    }
  })
  
  app.post("/student", authenticateToken, async (req, res) => {
      try {
        const newStudent= await
        student.create(req.body);
        res.status(201).json({
          data: newStudent,
          message: "Successfully created a new student!"
        });
      } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({
          data: [],
          message: "Failed to create student!",
          error: error.message
        });
      }
  })
  
  app.get("/student/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const foundStudent = await
      student.findByPk(id);
      if (foundStudent) {
        res.status(200).json({
          data: foundStudent,
          message: `Successfully fetched student with ID: ${id}!`
        });
      } else {
        res.status(404).json({
          data: null,
          message: `Student with ID: ${id} not found!`
        });
      }
    } catch (error) {
      console.error(`Error fetching student with ID: ${id}:`, error);
      res.status(500).json({
        data: null,
        message: `Failed to fetch student with ID: ${id}!`,
        error: error.message
      });
    }
  })
  
  app.put("/student/:id", authenticateToken, async (req, res) => {
      const { id } = req.params;
      try {
        const [updatedRows] = await
        student.update(req.body, {
          where: { id: id }
        });
        if (updatedRows > 0) {
          const updatedStudent = await
          student.findByPk(id);
          res.status(200).json({
            data: updatedStudent,
            message: `Successfully updated student with ID: ${id}!`
          });
        } else {
          res.status(404).json({
            data: null,
            message: `Student with ID: ${id} not found, cannot update!`
          });
        }
      } catch (error) {
        console.error(`Error updating student with ID: ${id}:`, error);
        res.status(500).json({
          data: null,
          message: `Failed to update student with ID: ${id}!`,
          error: error.message
        });
      }
  })
  
  app.delete("/student/:id", authenticateToken, async (req, res) => {
      const { id } = req.params;
      try {
        const deletedRows = await
        student.destroy({
          where: { id: id }
        });
        if (deletedRows > 0) {
          res.status(200).json({
            message: `Successfully deleted student with ID: ${id}!`
          });
        } else {
          res.status(404).json({
            message: `Student with ID: ${id} not found, cannot delete!`
          });
        }
      } catch (error) {
        console.error(`Error deleting student with ID: ${id}:`, error);
        res.status(500).json({
          message: `Failed to delete student with ID: ${id}!`,
          error: error.message
        });
      }
  })
  
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
  
    try {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists.' });
      }
  
      const newUser = await User.create({ username, password });
      res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Failed to register user.', error: error.message });
    }
  });
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
  
    try {
      const user = await User.findOne({ where: { username } });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const isPasswordValid = await user.isValidPassword(password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Failed to login.', error: error.message });
    }
  });
  
  app.listen(PORT, () => console.log(`Server running at http://${hostName}:${PORT}`))