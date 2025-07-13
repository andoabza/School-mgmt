import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import auth from './middleware/auth.js';
import websocketService from './services/websocket.js';
import morgan from 'morgan';

dotenv.config();

//import setupAdminRouter from '../routes/authRoutes.js'; 
import RegisterUsers from './routes/admin.js';
import ClassRooms from './routes/classrooms.js';
import Classes from './routes/classes.js';
import Schedules from './routes/schedules.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import parentRoutes from './routes/parentRoutes.js';

const app = express();

app.use(morgan('dev'));
// Initialize WebSocket server
// app.use(auth())

// Enable CORS for all routes
app.use(cors({
  origin: process.env.REACT_APP_URL,
  credentials: true,
}));

// app.use(cors());

dotenv.config();

app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/classes', Classes);
app.use('/api/classrooms', ClassRooms);
app.use('/api/schedules', Schedules);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parents', parentRoutes);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wsService = websocketService(server);
