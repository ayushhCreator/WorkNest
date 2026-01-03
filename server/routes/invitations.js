// @ts-nocheck
// @ts-nocheck
import express from "express";
import crypto from "crypto";
import Invitation from "../models/Invitation.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { sendInvitationEmail } from "../config/email.js";
import { authenticateToken } from "../middleware/auth.js";
import { logMemberAdded } from "../utils/activityLogger.js";

const router = express.Router();

// 📌 Send or RESEND invitation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { email, projectId, role = "member" } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission
    const userMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!userMember || !["admin", "member"].includes(userMember.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Check if already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isAlreadyMember = project.members.find(
        (member) => member.user.toString() === existingUser._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member" });
      }
    }

    // See if invite exists
    let invitation = await Invitation.findOne({
      email,
      project: projectId,
      status: "pending",
    });

    // Generate fresh secure token
    const token = crypto.randomBytes(32).toString("hex");

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
        token,
      });
      await invitation.save();
    }

    // Send or Resend the email
    try {
      console.log(`📧 Sending invitation email to ${email}...`);
      await sendInvitationEmail(
        email,
        req.user.name,
        project.title,
        token,
        role
      );
      console.log(`✅ Invitation email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send invitation email:", emailError);
      // It’s fine if email fails — you still have the DB entry.
    }

    // Log only for new invites
    if (!invitation.isNew) {
      await logMemberAdded(project, req.user, email);
    }

    res.status(200).json({ message: "Invitation sent or resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Revoke/Delete invitation
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check permissions (must be admin/owner of the project)
    const project = await Project.findById(invitation.project);
    if (!project) {
        // If project doesn't exist, we can probably just delete the invite? 
        // But let's check permission anyway if possible. 
        // If project missing, maybe just allow delete if token matches? 
        // Safer to return 404 or just delete it if user is system admin?
        // Let's assume project exists for now.
        return res.status(404).json({ message: "Project not found" });
    }

    const userMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    
    // Allow if user is owner/admin OR if the user sent the invite themselves
    const isAuthorized = 
        (userMember && ["admin"].includes(userMember.role)) || 
        invitation.invitedBy.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: "Insufficient permissions to revoke invitation" });
    }

    await Invitation.findByIdAndDelete(req.params.id);
    
    console.log(`🗑️ Invitation revoked for ${invitation.email}`);
    res.json({ message: "Invitation revoked successfully" });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Get invitation details (by token)
router.get("/:token", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: "pending",
    })
      .populate("project", "title description")
      .populate("invitedBy", "name email");

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired invitation" });
    }

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Accept invitation
router.post("/:token/accept", async (req, res) => {
  try {
    const { name, password } = req.body;

    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: "pending",
    }).populate("project", "title _id");

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired invitation" });
    }

    let user = await User.findOne({ email: invitation.email });

    if (user) {
      // Already exists — just add to project
      const project = await Project.findById(invitation.project);

      const alreadyMember = project.members.find(
        (member) => member.user.toString() === user._id.toString()
      );
      if (!alreadyMember) {
        project.members.push({
          user: user._id,
          role: invitation.role,
        });
        await project.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email: invitation.email,
        password,
      });
      await user.save();

      // Add to project
      const project = await Project.findById(invitation.project);
      project.members.push({
        user: user._id,
        role: invitation.role,
      });
      await project.save();
    }

    // Mark invitation used
    invitation.status = "accepted";
    await invitation.save();

    // Notify the inviter that invitation was accepted
    try {
      const { createNotification } = await import("../utils/notifications.js");
      await createNotification({
        recipient: invitation.invitedBy,
        sender: user._id,
        type: "invitation_accepted",
        title: "Invitation Accepted",
        message: `${user.name} has joined your project "${invitation.project.title}"`,
        data: {
          projectId: invitation.project._id,
          userId: user._id,
          role: invitation.role,
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to send acceptance notification:",
        notificationError
      );
    }

    res.json({ message: "Invitation accepted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 📌 Get all invitations for a project (admins only)
router.get("/project/:projectId", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );
    // Allow members to view active invitations too
    if (!userMember || !["admin", "member"].includes(userMember.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const invitations = await Invitation.find({
      project: req.params.projectId,
    })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Test email configuration (development only)
router.post("/test-email", authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ message: "Test endpoint not available in production" });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await sendInvitationEmail(
      email,
      "Test Admin",
      "Test Project",
      "test-token-123",
      "member"
    );

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

export default router;
