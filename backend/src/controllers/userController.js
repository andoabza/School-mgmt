import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';

class UserController {
  // Register a new user
  static async register(req, res) {
    const { email, firstName, lastName, role, birthDate, gradeLevel, section, studentId, subject } = req.body;
    const defaultPassword = 'School@123';

    try {
      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Create user
      const user = await UserModel.create({
        email,
        password: defaultPassword,
        role,
        firstName,
        lastName
      });
      
      // Handle role-specific data
      if (role === 'student') {
        await UserModel.createStudent(user.id, {
          birthDate,
          gradeLevel,
          section
        });
      } else if (role === 'teacher') {
        await UserModel.createTeacher(user.id, subject);
      } else if (role === 'parent' && studentId) {
        await UserModel.createParent(user.id);
        
        // Link parent to child if student ID provided
        const child = await UserModel.getChildByStudentId(studentId);
        if (child) {
          await UserModel.linkParentChild(user.id, child.id);
        }
      }

      res.status(201).json(user);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Bulk register users
  static async bulkRegister(req, res) {
    const { users } = req.body;
    const defaultPassword = 'School@123';
    let successCount = 0;
    let existingUsers = [];

    try {
      for (const user of users) {
        const existingUser = await UserModel.findByEmail(user.email);
        if (existingUser) {
          existingUsers.push(user);
          continue;
        }

        const newUser = await UserModel.create({
          email: user.email,
          password: defaultPassword,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        });

        if (user.role === 'student') {
          await UserModel.createStudent(newUser.id, {
            birthDate: user.birthDate,
            gradeLevel: user.gradeLevel,
            section: user.section
          });
        } else if (user.role === 'teacher') {
          await UserModel.createTeacher(newUser.id, user.subject);
        } else if (user.role === 'parent') {
          await UserModel.createParent(newUser.id);
          
          if (user.studentId) {
            const child = await UserModel.getChildByStudentId(user.studentId);
            if (child) {
              await UserModel.linkParentChild(newUser.id, child.id);
            }
          }
        }

        successCount++;
      }

      res.json({ 
        count: successCount,
        users: existingUsers
      });
    } catch (error) {
      console.error('Bulk registration error:', error);
      res.status(500).json({ message: 'Bulk registration failed' });
    }
  }

  // User login
  static async login(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await UserModel.verifyPassword(user, password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Return user data with token
      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      };

      res.status(200).json({
        token,
        user: userData
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

      const user = await UserModel.getById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        ...(user.role === 'student' && {
          studentId: user.student_id,
          gradeLevel: user.grade_level,
          section: user.section
        }),
        ...(user.role === 'teacher' && {
          subject: user.subject
        }),
        ...(user.role === 'parent' && {
          parentId: user.parent_id
        })
      };

      res.json(userData);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      // Students can only view their own data
      if (req.user.role === 'student') {
        const user = await UserModel.getById(req.user.id);
        return res.json([user]);
      }

      const roleFilter = req.query.role;
      const users = await UserModel.findAll(roleFilter);
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).send('Server error');
    }
  }

  // Update user role
  static async updateRole(req, res) {
    const { role } = req.body;
    const validRoles = ['admin', 'teacher', 'student', 'parent'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      await UserModel.updateRole(req.params.id, role);
      res.json({ message: 'Role updated' });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).send('Server error');
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    const { currentPassword, newPassword, id } = req.body;
    const defaultPassword = 'School@123';
    
    try {
      const user = await UserModel.getById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (currentPassword) {
        const isMatch = await UserModel.verifyPassword(user, currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }

      await UserModel.updatePassword(
        id, 
        newPassword || defaultPassword
      );
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  }
  
  // Delete user
  static async deleteUser(req, res) {
    const id = req.params.id;
    
    try {
      await UserModel.delete(id);
      res.status(200).json({ 
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        message: 'Delete user failed',
        detail: error.message 
      });
    }
  }

  // Protected route for any authenticated user
  static getProfile(req, res) {
    res.json(req.user);
  }

  // Admin-only route
  static adminDashboard(req, res) {
    res.json({ message: 'Admin dashboard' });
  }

  // Teacher or admin route
  static teacherResource(req, res) {
    res.json({ message: 'Teacher resource' });
  }
}

export default UserController;