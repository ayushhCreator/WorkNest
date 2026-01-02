import express from 'express';
import Team from '../models/Team.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body;

    // Verify user has access to the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied to workspace' });
    }

    const team = new Team({
      name,
      description,
      workspace: workspaceId,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner'
      }]
    });

    await team.save();
    await team.populate('owner', 'name email')
              .populate('workspace', 'name')
              .populate('members.user', 'name email avatar');
    
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teams in a workspace
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify user has access to the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied to workspace' });
    }

    const teams = await Team.find({ workspace: workspaceId })
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .populate('projects', 'title');
    
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('workspace', 'name owner')
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .populate('projects', 'title');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is member of the team's workspace
    const workspace = await Workspace.findById(team.workspace);
    const isMember = workspace.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update team
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is owner of the team
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, description, settings } = req.body;
    
    team.name = name || team.name;
    team.description = description || team.description;
    team.settings = settings || team.settings;
    
    await team.save();
    await team.populate('owner', 'name email');
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete team
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is owner of the team
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove team from workspace
    await Workspace.findByIdAndUpdate(team.workspace, {
      $pull: { teams: req.params.id }
    });
    
    // Remove team from projects
    await Project.updateMany(
      { team: req.params.id },
      { $unset: { team: 1 } } // Remove team reference from projects
    );
    
    await Team.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to team
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to add members
    const teamMember = team.members.find(m =>
      m.user.toString() === req.user._id.toString()
    );

    if (!teamMember || (teamMember.role !== 'owner' && teamMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already exists in team
    const existingMember = team.members.find(m =>
      m.user.toString() === user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User already exists in team' });
    }

    // Add user to team members
    team.members.push({
      user: user._id,
      role,
      status: 'active'
    });

    await team.save();
    await team.populate('members.user', 'name email avatar');

    res.json({ message: 'Member added successfully', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user has permission to remove members (must be owner or admin)
    const member = team.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if trying to remove themselves and they're the owner
    if (req.params.userId === req.user._id.toString() && member.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot remove themselves' });
    }
    
    // Remove member from team
    team.members = team.members.filter(m => 
      m.user.toString() !== req.params.userId
    );
    
    await team.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add project to team
router.post('/:id/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const project = await Project.findById(req.params.projectId);
    
    if (!team || !project) {
      return res.status(404).json({ message: 'Team or project not found' });
    }
    
    // Verify user has access to both team and project
    const teamMember = team.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!teamMember) {
      return res.status(403).json({ message: 'Access denied to team' });
    }
    
    const projectMember = project.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied to project' });
    }
    
    // Update project to include team
    project.team = req.params.id;
    await project.save();
    
    // Add project to team
    team.projects.push(req.params.projectId);
    await team.save();
    
    res.json({ message: 'Project added to team successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;