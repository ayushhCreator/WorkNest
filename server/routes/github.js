import express from 'express';
import axios from 'axios';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GitHub OAuth setup
router.get('/oauth', authenticateToken, async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.SERVER_URL}/api/integrations/github/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=repo,read:user`;
  
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ message: 'No authorization code provided' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.SERVER_URL}/api/integrations/github/callback`
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const { access_token: accessToken } = tokenResponse.data;
    
    // Store the access token in the user's session or database
    // For now, we'll just send it back to the frontend for storage
    res.redirect(`${process.env.CLIENT_URL}/settings/integrations?github_token=${accessToken}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ message: 'Failed to authenticate with GitHub' });
  }
});

// Link GitHub repository to project
router.post('/link-repo', authenticateToken, async (req, res) => {
  try {
    const { projectId, repoFullName, githubToken } = req.body;
    
    // Verify user has access to the project
    const project = await Project.findById(projectId).populate('members.user');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Verify that the GitHub token is valid and has access to the repository
    try {
      const repoResponse = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (repoResponse.status !== 200) {
        return res.status(400).json({ message: 'Invalid repository or insufficient permissions' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Could not access repository. Check permissions.' });
    }
    
    // Update project with GitHub integration details
    project.githubIntegration = {
      repoFullName,
      accessToken: githubToken, // In production, this should be encrypted
      connected: true,
      connectedAt: new Date()
    };
    
    await project.save();
    
    res.json({
      message: 'Repository linked successfully',
      project
    });
  } catch (error) {
    console.error('GitHub repo linking error:', error);
    res.status(500).json({ message: 'Failed to link repository' });
  }
});

// Create webhook to receive GitHub events
router.post('/webhook/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    // We can't verify the webhook signature without storing the secret per project
    // For a real implementation, you'd want to store and verify the webhook secret
    
    // Process different GitHub events
    if (event === 'push') {
      // Process commit information from push event
      await handlePushEvent(projectId, payload);
    } else if (event === 'pull_request') {
      // Process pull request information
      await handlePullRequestEvent(projectId, payload);
    } else if (event === 'issues' || event === 'issue_comment') {
      // Process issues and comments
      await handleIssueEvent(projectId, payload);
    }
    
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Helper function to handle push events
async function handlePushEvent(projectId, payload) {
  try {
    // Process commits from push
    for (const commit of payload.commits) {
      // Link commit to any tasks mentioned in commit message
      // Common patterns: "Fixes #123", "Closes #456", etc.
      const issuePattern = /(?:fixes|closes|resolves)\s+#(\d+)/gi;
      const matches = [...commit.message.matchAll(issuePattern)];
      
      for (const match of matches) {
        const issueNumber = match[1];
        // In a real implementation, you'd link this commit to the relevant task
        console.log(`Commit ${commit.id} referenced task #${issueNumber}`);
      }
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
}

// Helper function to handle pull request events
async function handlePullRequestEvent(projectId, payload) {
  try {
    const pr = payload.pull_request;
    const action = payload.action;
    
    if (action === 'opened' || action === 'synchronize' || action === 'closed') {
      // In a real implementation, you'd create/update/close tasks based on PR status
      console.log(`PR #${pr.number} was ${action}: ${pr.title}`);
      
      // Look for connected tasks in PR description
      const issuePattern = /(?:fixes|closes|resolves)\s+#(\d+)/gi;
      const matches = [...pr.body?.matchAll(issuePattern) || []];
      
      for (const match of matches) {
        const issueNumber = match[1];
        console.log(`PR #${pr.number} references task #${issueNumber}`);
        // In a real implementation, you'd update the task status based on PR status
      }
    }
  } catch (error) {
    console.error('Error handling PR event:', error);
  }
}

// Helper function to handle issue events
async function handleIssueEvent(projectId, payload) {
  try {
    // Handle GitHub issues and comments
    const action = payload.action;
    const issue = payload.issue || payload;
    
    console.log(`Issue #${issue.number} ${action}: ${issue.title}`);
    
    // In a real implementation, you'd sync GitHub issues with WorkNest tasks
  } catch (error) {
    console.error('Error handling issue event:', error);
  }
}

// Get GitHub repositories for a user
router.get('/repositories', authenticateToken, async (req, res) => {
  try {
    const { githubToken } = req.query;
    
    if (!githubToken) {
      return res.status(400).json({ message: 'GitHub access token required' });
    }
    
    // Get user's repositories from GitHub
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        type: 'all',
        sort: 'updated',
        direction: 'desc'
      }
    });
    
    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      updatedAt: repo.updated_at
    }));
    
    res.json({ repositories: repos });
  } catch (error) {
    console.error('GitHub repositories error:', error);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
});

export default router;