import express from 'express';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = new Workspace({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner'
      }]
    });

    await workspace.save();
    await workspace.populate('owner', 'name email');
    
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's workspaces
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'name email')
     .populate('members.user', 'name email avatar')
     .populate('teams', 'name')
     .populate('projects', 'title');
    
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workspace by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .populate('teams', 'name')
      .populate('projects', 'title');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user is member of the workspace
    const isMember = workspace.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workspace
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user is owner of the workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, description, settings } = req.body;
    
    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    workspace.settings = settings || workspace.settings;
    
    await workspace.save();
    await workspace.populate('owner', 'name email');
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete workspace
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user is owner of the workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete all related projects, teams, and tasks
    await Project.deleteMany({ workspace: req.params.id });
    await Team.deleteMany({ workspace: req.params.id });
    // Note: Tasks will be deleted based on project deletion
    
    await Workspace.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invite member to workspace
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user has permission to invite members (must be admin or owner)
    const member = workspace.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if user already exists in workspace
    const existingMember = workspace.members.find(m => 
      m.user.email === email
    );
    
    if (existingMember) {
      return res.status(400).json({ message: 'User already exists in workspace' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add user to workspace members
    workspace.members.push({
      user: user._id,
      role,
      status: 'invited'
    });
    
    await workspace.save();
    
    res.json({ message: 'User invited successfully', workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add existing project to workspace
router.post('/:workspaceId/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, projectId } = req.params;
    
    // Check if user has permission in both workspace and project
    const workspace = await Workspace.findById(workspaceId);
    const project = await Project.findById(projectId);
    
    if (!workspace || !project) {
      return res.status(404).json({ message: 'Workspace or project not found' });
    }
    
    // Verify user is owner of workspace and has access to project
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to workspace' });
    }
    
    const projectMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied to project' });
    }
    
    // Update project to include workspace
    project.workspace = workspaceId;
    await project.save();
    
    // Add project to workspace
    workspace.projects.push(projectId);
    await workspace.save();
    
    res.json({ message: 'Project added to workspace successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;