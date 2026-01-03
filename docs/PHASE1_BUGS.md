# Phase 1: Bug Fixes & Polish - Documentation

## Summary

Before deploying, these issues must be fixed to make the existing features work properly.

---

## 🔴 Critical Issues

### 1. User Avatar Not Displayed
**Location**: `src/context/AuthContext.tsx`
**Problem**: User interface only has `id, name, email, role` - missing `avatar` field
**Backend**: OAuth (Google/GitHub) saves avatar to DB via `passport.js`
**Fix**: Add `avatar` to User interface and display in:
- Navbar
- Profile page
- Task assignee avatars
- Comments

### 2. Dynamic Tailwind Classes (Won't Work)
**Location**: `src/components/DashboardStats.tsx` (lines 188-190)
**Problem**: 
```tsx
className={`text-${color}-600`}  // ❌ Dynamic classes
className={`bg-${color}-100`}    // ❌ Won't be in build
```
**Fix**: Use explicit class mapping or inline styles

### 3. CreateTaskModal Missing `status` Prop
**Location**: `src/pages/ProjectBoard.tsx` (line 503-508)
**Problem**: CreateTaskModal expects `status` prop but ProjectBoard only passes `columnId`
**Fix**: Pass both `columnId` and `status` to CreateTaskModal

---

## 🟠 Medium Issues

### 4. Name Capitalization
**Problem**: Names from OAuth may be lowercase/inconsistent
**Fix**: Capitalize first letter of each word when displaying

### 5. Profile Image Upload (Manual)
**Location**: `src/pages/Profile.tsx`
**Problem**: Camera button exists but no upload functionality
**Fix**: Implement Cloudinary upload for profile images

### 6. OAuth Avatar Not Used in Frontend
**Problem**: Backend saves avatar from Google/GitHub but frontend doesn't fetch/display it
**Fix**: Include avatar in auth response and use in UI

---

## 🟡 Polish Items

### 7. Charts Container Size
**Problem**: Charts may overflow or look small on different screens
**Fix**: Add proper responsive sizing

### 8. Empty State for Analytics
**Problem**: "Failed to load analytics" shows when no data exists
**Fix**: Show friendly empty state instead of error

### 9. Invitation Email Check
**Problem**: Can invite already-member users
**Fix**: Backend validation exists, verify frontend handles error

---

## Files to Modify

| File | Changes |
|------|---------|
| `AuthContext.tsx` | Add `avatar` to User interface |
| `Navbar.tsx` | Display user avatar |
| `Profile.tsx` | Display and upload avatar |
| `DashboardStats.tsx` | Fix dynamic Tailwind classes |
| `ProjectBoard.tsx` | Pass `status` prop to CreateTaskModal |
| Various components | Capitalize names properly |

---

## Verification Plan

1. OAuth login with Google/GitHub - verify avatar displays
2. Create project - verify success
3. Add tasks - verify drag-drop works
4. Send invitation - verify email sent
5. Check analytics - verify charts render
6. Profile page - verify image upload works
