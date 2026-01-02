import AuditLog from '../models/AuditLog.js';

// Function to create an audit log entry
export const createAuditLog = async (req, action, resourceType, resourceId, actionData = {}) => {
  try {
    const log = new AuditLog({
      userId: req.user._id,
      action,
      resourceType,
      resourceId,
      workspaceId: req.workspace?._id || req.body.workspaceId,
      teamId: req.team?._id || req.body.teamId,
      project: req.project?.id || req.body.projectId,
      actionData,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    await log.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error as this shouldn't break the main operation
  }
};

// Function to create an audit log entry for failed operations
export const createAuditLogError = async (req, action, resourceType, resourceId, error, actionData = {}) => {
  try {
    const log = new AuditLog({
      userId: req.user._id,
      action,
      resourceType,
      resourceId,
      workspaceId: req.workspace?._id || req.body.workspaceId,
      teamId: req.team?._id || req.body.teamId,
      project: req.project?.id || req.body.projectId,
      actionData,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      statusCode: error.statusCode || 500,
      errorMessage: error.message || error.toString()
    });

    await log.save();
  } catch (logError) {
    console.error('Error creating audit log error:', logError);
  }
};

// Middleware to automatically log API requests
export const auditLogMiddleware = async (req, res, next) => {
  // Skip audit logging for health checks and auth routes to avoid spam
  if (req.path.includes('/health') || req.path.includes('/auth/refresh')) {
    return next();
  }

  // Continue with the request
  const originalSend = res.send;
  
  res.send = function(body) {
    try {
      // Parse the response to determine success/failure
      let responseObj;
      try {
        responseObj = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        responseObj = body;
      }

      // Log the request based on the route
      const route = req.path;
      let action = 'UNKNOWN_ACTION';
      let resourceType = 'GLOBAL';
      let resourceId = 'GLOBAL';

      // Determine action and resource based on route
      if (route.includes('/workspaces')) {
        resourceType = 'WORKSPACE';
        resourceId = req.params.id || req.body.workspaceId;
        if (req.method === 'POST') action = 'CREATE_WORKSPACE';
        else if (req.method === 'PUT') action = 'UPDATE_WORKSPACE';
        else if (req.method === 'DELETE') action = 'DELETE_WORKSPACE';
        else action = 'READ_WORKSPACE';
      } else if (route.includes('/teams')) {
        resourceType = 'TEAM';
        resourceId = req.params.id || req.body.teamId;
        if (req.method === 'POST') action = 'CREATE_TEAM';
        else if (req.method === 'PUT') action = 'UPDATE_TEAM';
        else if (req.method === 'DELETE') action = 'DELETE_TEAM';
        else action = 'READ_TEAM';
      } else if (route.includes('/projects')) {
        resourceType = 'PROJECT';
        resourceId = req.params.id || req.body.projectId;
        if (req.method === 'POST') action = 'CREATE_PROJECT';
        else if (req.method === 'PUT') action = 'UPDATE_PROJECT';
        else if (req.method === 'DELETE') action = 'DELETE_PROJECT';
        else action = 'READ_PROJECT';
      } else if (route.includes('/tasks')) {
        resourceType = 'TASK';
        resourceId = req.params.id || req.body.taskId;
        if (req.method === 'POST') action = 'CREATE_TASK';
        else if (req.method === 'PUT') action = 'UPDATE_TASK';
        else if (req.method === 'DELETE') action = 'DELETE_TASK';
        else action = 'READ_TASK';
      }
      
      // Create audit log
      createAuditLog(req, action, resourceType, resourceId, {
        method: req.method,
        path: req.path,
        requestBody: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
        responseBody: !res.statusCode || res.statusCode < 400 ? responseObj : undefined,
        statusCode: res.statusCode
      });

    } catch (error) {
      console.error('Error in audit log middleware:', error);
    }

    // Call the original send method
    return originalSend.call(this, body);
  };

  next();
};