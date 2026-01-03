import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import Counter from '../models/Counter.js';

// Function to generate a human-readable task ID (e.g. WN-123)
export const generateTaskId = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate('workspace');
    if (!project) {
      console.warn('Project not found for task ID generation:', projectId);
      return `WN-${Date.now()}`; // Fallback to timestamp
    }

    // If project has a workspace, use workspace prefix
    if (project.workspace && project.workspace.name) {
      const workspacePrefix = project.workspace.name.substring(0, 2).toUpperCase();
      return await getNextSequence(workspacePrefix);
    }
    
    // Otherwise, use project title prefix
    const projectPrefix = project.title.substring(0, 2).toUpperCase();
    return await getNextSequence(projectPrefix);
  } catch (error) {
    console.error('Error generating task ID:', error);
    return `WN-${Date.now()}`; // Fallback to timestamp to prevent blocking
  }
};

export const generateTaskIdByWorkspace = async (workspaceId, project) => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const workspacePrefix = workspace.name.substring(0, 2).toUpperCase();
    return await getNextSequence(workspacePrefix);
  } catch (error) {
    console.error('Error generating task ID:', error);
    return `WN-${Date.now()}`;
  }
};

// Helper to get next sequence atomically
const getNextSequence = async (prefix) => {
  // Try to increment first
  let counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // If seq is 1, it might be a new counter but data exists. Check for collisions.
  if (counter.seq === 1) {
    const maxTask = await Task.aggregate([
      { 
        $match: { 
          taskId: { $regex: new RegExp(`^${prefix}-\\d+$`) } 
        } 
      },
      {
        $addFields: {
          numberPart: { 
            $toInt: { $arrayElemAt: [{ $split: ["$taskId", "-"] }, 1] } 
          }
        }
      },
      { $sort: { numberPart: -1 } },
      { $limit: 1 }
    ]);

    if (maxTask.length > 0 && maxTask[0].numberPart >= 1) {
      // Data exists! We need to fast-forward the counter
      const nextSeq = maxTask[0].numberPart + 1;
      counter = await Counter.findByIdAndUpdate(
        prefix,
        { $set: { seq: nextSeq } },
        { new: true }
      );
    }
  }

  return `${prefix}-${counter.seq}`;
};