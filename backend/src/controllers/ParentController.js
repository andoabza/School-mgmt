import Parent from '../models/Parent.js';

class ParentController {
  // Link parent to child by email
  static async linkParentChild(req, res) {
    const { parentId } = req.params;
    const { email } = req.body;  // Fixed: Changed to req.body (was req.body.email)
    
    try {
      // Check if relationship already exists
      const existing = await Parent.linkExist(parentId, email);
      
      if (existing) {
        return res.status(400).json({ error: 'Relationship already exists' });
      }
      
      // Create relationship
      await Parent.linkParentChild(parentId, email);
      
      res.json({ message: 'Child added to parent account' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to link parent and child' });
    }
  }

  // Get children for a parent
  static async getChildren(req, res) {
    const { parentId } = req.params;
    
    try {
      const result = await Parent.getChildren(parentId);  // Fixed: Added await
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch children' });
    }
  }

  // Get grades for a child
  static async getChildGrades(req, res) {
    const { childId } = req.params;
    
    try {
      const result = await Parent.getChildGrades(childId);
      
      res.json(result);  // Fixed: Changed to result (was rows)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch grades' });
    }
  }

  // Get attendance for a child
  static async getChildAttendance(req, res) {
    const { childId } = req.params;
    
    try {
      const result = await Parent.getChildAttendance(childId);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }
}

export default ParentController;