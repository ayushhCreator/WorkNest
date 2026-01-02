import express from 'express';
import Workflow from '../models/Workflow.js';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import { authenticateToken, requireWorkspaceAccess } from '../middleware/auth.js';

const router = express.Router();

// Create workflow
router.post('/', authenticateToken, requireWorkspaceAccess('admin'), async (req, res) => {
  try {
    const { name, description, statuses, transitions, defaultStatus, isDefault } = req.body;
    
    // Check if user has admin rights to the workspace
    if (req.workspaceMember.role !== 'admin' && req.workspaceMember.role !== 'owner') {
      return res.status(403).json({ message: 'Insufficient permissions. Admin or owner access required.' });
    }
    
    // If setting as default, unset other defaults for this workspace
    if (isDefault) {
      await Workflow.updateMany(
        { workspace: req.workspace._id, isDefault: true },
        { isDefault: false }
      );
    }
    
    const workflow = new Workflow({
      name,
      description,
      statuses,
      transitions,
      defaultStatus,
      isDefault,
      workspace: req.workspace._id
    });
    
    await workflow.save();
    
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workflows for workspace
router.get('/workspace/:workspaceId', authenticateToken, requireWorkspaceAccess('read'), async (req, res) => {
  try {
    const workflows = await Workflow.find({ workspace: req.workspace._id })
      .sort({ isDefault: -1, createdAt: -1 }); // Default workflow first
    
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get workflow by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('workspace', 'name');
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has access to the workspace
    const workspace = await Workspace.findById(workflow.workspace);
    const member = workspace.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workflow
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has admin rights to the workspace
    const workspace = await Workspace.findById(workflow.workspace);
    const member = workspace.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const { name, description, statuses, transitions, defaultStatus, isActive, isDefault } = req.body;
    
    // If setting as default, unset other defaults for this workspace
    if (isDefault) {
      await Workflow.updateMany(
        { workspace: workflow.workspace, isDefault: true },
        { isDefault: false }
      );
    }
    
    workflow.name = name || workflow.name;
    workflow.description = description || workflow.description;
    workflow.statuses = statuses || workflow.statuses;
    workflow.transitions = transitions || workflow.transitions;
    workflow.defaultStatus = defaultStatus || workflow.defaultStatus;
    workflow.isActive = isActive !== undefined ? isActive : workflow.isActive;
    workflow.isDefault = isDefault !== undefined ? isDefault : workflow.isDefault;
    
    await workflow.save();
    
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete workflow
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has admin rights to the workspace
    const workspace = await Workspace.findById(workflow.workspace);
    const member = workspace.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // Don't allow deletion of default workflow if it's the only one
    const workflowCount = await Workflow.countDocuments({ workspace: workflow.workspace });
    if (workflow.isDefault && workflowCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot delete the only workflow. At least one workflow must exist.' 
      });
    }
    
    // If deleting the default workflow, set another as default
    if (workflow.isDefault) {
      const otherWorkflow = await Workflow.findOne({ 
        workspace: workflow.workspace, 
        _id: { $ne: workflow._id } 
      });
      
      if (otherWorkflow) {
        otherWorkflow.isDefault = true;
        await otherWorkflow.save();
      }
    }
    
    await Workflow.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set workflow as default
router.patch('/:id/set-default', authenticateToken, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has admin rights to the workspace
    const workspace = await Workspace.findById(workflow.workspace);
    const member = workspace.members.find(m => 
      m.user.toString() === req.user._id.toString()
    );
    
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // Unset other defaults for this workspace
    await Workflow.updateMany(
      { workspace: workflow.workspace, isDefault: true },
      { isDefault: false }
    );
    
    // Set this workflow as default
    workflow.isDefault = true;
    await workflow.save();
    
    res.json({ message: 'Workflow set as default successfully', workflow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;