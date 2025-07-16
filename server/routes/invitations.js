import express from 'express';
import crypto from 'crypto';
import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { sendInvitationEmail } from '../config/email.js';
import { authenticateToken } from '../middleware/auth.js';
import { logMemberAdded } from '../utils/activityLogger.js';

const router = express.Router();

// 📌 Send or RESEND invitation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email, projectId, role = 'member' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permission
    const userMember = project.members.find(member =>
      member.user.toString() === req.user._id.toString()
    );
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Check if already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isAlreadyMember = project.members.find(member =>
        member.user.toString() === existingUser._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({ message: 'User is already a member' });
      }
    }

    // See if invite exists
    let invitation = await Invitation.findOne({
      email,
      project: projectId,
      status: 'pending'
    });

    // Generate fresh secure token
    const token = crypto.randomBytes(32).toString('hex');

    if (invitation) {
      // RESEND logic → update token + timestamp
      invitation.token = token;
      invitation.updatedAt = new Date();
      await invitation.save();
    } else {
      // Create NEW invite
      invitation = new Invitation({
        email,
        project: projectId,
        invitedBy: req.user._id,
        role,
        token
      });
      await invitation.save();
    }

    // Send or Resend the email
    try {
      await sendInvitationEmail(email, req.user.name, project.title, token);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // It’s fine if email fails — you still have the DB entry.
    }

    // Log only for new invites
    if (!invitation.isNew) {
      await logMemberAdded(project, req.user, email);
    }

    res.status(200).json({ message: 'Invitation sent or resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Get invitation details (by token)
router.get('/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: 'pending'
    })
      .populate('project', 'title description')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Accept invitation
router.post('/:token/accept', async (req, res) => {
  try {
    const { name, password } = req.body;

    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    let user = await User.findOne({ email: invitation.email });

    if (user) {
      // Already exists — just add to project
      const project = await Project.findById(invitation.project);

      const alreadyMember = project.members.find(member =>
        member.user.toString() === user._id.toString()
      );
      if (!alreadyMember) {
        project.members.push({
          user: user._id,
          role: invitation.role
        });
        await project.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email: invitation.email,
        password
      });
      await user.save();

      // Add to project
      const project = await Project.findById(invitation.project);
      project.members.push({
        user: user._id,
        role: invitation.role
      });
      await project.save();
    }

    // Mark invitation used
    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Get all invitations for a project (admins only)
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userMember = project.members.find(member =>
      member.user.toString() === req.user._id.toString()
    );
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const invitations = await Invitation.find({
      project: req.params.projectId
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
