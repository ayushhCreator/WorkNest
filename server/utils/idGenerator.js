import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';

// Function to generate a human-readable task ID (e.g. WN-123) for a specific project/workspace
export const generateTaskId = async (projectId) => {
  try {
    // Get the project to find its workspace
    const project = await Project.findById(projectId).populate('workspace');
    if (!project || !project.workspace) {
      throw new Error('Project or workspace not found');
    }

    // Get the workspace prefix (first 2 letters of workspace name, capitalized)
    const workspacePrefix = project.workspace.name.substring(0, 2).toUpperCase();

    // Find the highest task number for this workspace
    const lastTask = await Task.findOne({
      project: projectId
    }).sort({ taskId: -1 }).limit(1);

    let nextNumber = 1; // Default starting number
    if (lastTask && lastTask.taskId) {
      // Extract the number from the task ID (assuming format: {prefix}-{number})
      const match = lastTask.taskId.match(/.*-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format the task ID as {workspacePrefix}-{number}
    return `${workspacePrefix}-${nextNumber}`;
  } catch (error) {
    console.error('Error generating task ID:', error);
    // Fallback to default
    return `WN-1`;
  }
};

// Alternative function to generate task ID by workspace ID directly
export const generateTaskIdByWorkspace = async (workspaceId, project) => {
  try {
    // Get the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get the workspace prefix (first 2 letters of workspace name, capitalized)
    const workspacePrefix = workspace.name.substring(0, 2).toUpperCase();

    // Find the highest task number for this workspace
    const lastTask = await Task.findOne({
      project: project // Use project ID if provided, otherwise workspace tasks
    }).sort({ taskId: -1 }).limit(1);

    let nextNumber = 1; // Default starting number
    if (lastTask && lastTask.taskId) {
      // Extract the number from the task ID (assuming format: {prefix}-{number})
      const match = lastTask.taskId.match(/.*-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format the task ID as {workspacePrefix}-{number}
    return `${workspacePrefix}-${nextNumber}`;
  } catch (error) {
    console.error('Error generating task ID:', error);
    // Fallback to default
    return `WN-1`;
  }
};