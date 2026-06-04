# Zoho-Style Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the profile view into a professional, Zoho-inspired compact widget with "View-to-Edit" section toggles.

**Architecture:** A single-page component (`ProfileView.tsx`) utilizing React state to manage individual section visibility (Edit vs. View modes) and Inertia `useForm` hooks for data persistence.

**Tech Stack:** React 19, Tailwind CSS v4, Inertia.js v2, Lucide React icons.

---

### Task 1: Component State and Compact Header Setup

**Files:**
- Modify: `resources/js/components/contracts/parts/ProfileView.tsx`

- [ ] **Step 1: Define section visibility states**
Add `isEditingInfo` and `isEditingSecurity` states to the component.
```tsx
const [isEditingInfo, setIsEditingInfo] = useState(false);
const [isEditingSecurity, setIsEditingSecurity] = useState(false);
```

- [ ] **Step 2: Refactor the Header Section**
Implement the compact header with a smaller avatar and status badges.
```tsx
{/* Header Section */}
<div className="mb-6 flex items-center gap-6 border-b border-surface-border/50 pb-8 text-left">
    <div className="relative group shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-surface-muted shadow-sm">
            {meUser?.avatar_url ? (
                <img src={meUser.avatar_url} alt={meUser.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl uppercase bg-primary/10 text-primary">
                    {meUser?.name?.substring(0, 2).toUpperCase() || '?'}
                </div>
            )}
        </div>
        <button className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer border border-white">
            <Camera size={10} />
        </button>
    </div>
    <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-text-main tracking-tight">{meUser.name}</h1>
        <div className="flex items-center gap-4 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-soft flex items-center gap-1">
                <Shield size={12} className="text-primary/70" /> {meUser?.role || 'User'}
            </span>
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-600 uppercase tracking-tighter border border-green-100">
                Active Account
            </span>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add resources/js/components/contracts/parts/ProfileView.tsx
git commit -m "style: setup compact profile header and states"
```

---

### Task 2: Personal Information Section (View-to-Edit)

**Files:**
- Modify: `resources/js/components/contracts/parts/ProfileView.tsx`

- [ ] **Step 1: Implement the Info Card with Mode Toggle**
Replace the old Info form with a toggleable card.
```tsx
<div className="bg-white dark:bg-surface-base border border-surface-border/50 rounded-xl shadow-sm overflow-hidden mb-6">
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border/30 bg-surface-muted/5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-soft">Personal Information</h2>
        {!isEditingInfo ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)} className="text-primary text-[10px] uppercase font-bold">Edit</Button>
        ) : (
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsEditingInfo(false); pReset(); }} className="text-text-soft text-[10px] uppercase font-bold">Cancel</Button>
                <Button variant="ghost" size="sm" onClick={updateProfile} disabled={pProcessing} className="text-primary text-[10px] uppercase font-bold">Save</Button>
            </div>
        )}
    </div>
    <div className="p-6">
        {!isEditingInfo ? (
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <span className="text-[10px] font-bold text-text-soft uppercase">Full Name</span>
                    <span className="col-span-2 text-sm font-medium">{meUser.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <span className="text-[10px] font-bold text-text-soft uppercase">Work Email</span>
                    <span className="col-span-2 text-sm font-medium">{meUser.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <span className="text-[10px] font-bold text-text-soft uppercase">Phone</span>
                    <span className="col-span-2 text-sm font-medium">{meUser.phone || '-'}</span>
                </div>
            </div>
        ) : (
            <form onSubmit={updateProfile} className="space-y-4 max-w-md">
                {/* Inputs for name, email, phone */}
            </form>
        )}
    </div>
</div>
```

- [ ] **Step 2: Commit**
```bash
git add resources/js/components/contracts/parts/ProfileView.tsx
git commit -m "feat: add view-to-edit toggle for personal info section"
```

---

### Task 3: Security Section (View-to-Edit) [COMPLETED]

**Files:**
- Modify: `resources/js/components/contracts/parts/ProfileView.tsx`

- [x] **Step 1: Implement the Security Card with Password Fields**
Follow the same pattern as Task 2 for the security section.
```tsx
<div className="bg-white dark:bg-surface-base border border-surface-border/50 rounded-xl shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border/30 bg-surface-muted/5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-soft">Security</h2>
        {!isEditingSecurity ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingSecurity(true)} className="text-primary text-[10px] uppercase font-bold">Change Password</Button>
        ) : (
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsEditingSecurity(false); qReset(); }} className="text-text-soft text-[10px] uppercase font-bold">Cancel</Button>
                <Button variant="ghost" size="sm" onClick={updatePassword} disabled={qProcessing} className="text-primary text-[10px] uppercase font-bold">Update</Button>
            </div>
        )}
    </div>
    <div className="p-6">
        {!isEditingSecurity ? (
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-text-soft uppercase">Password</span>
                <span className="text-sm font-medium">••••••••••••••••</span>
            </div>
        ) : (
            <form onSubmit={updatePassword} className="space-y-4 max-w-md">
                {/* Inputs for current, new, and confirm password */}
            </form>
        )}
    </div>
</div>
```

- [x] **Step 2: Commit**
```bash
git add resources/js/components/contracts/parts/ProfileView.tsx
git commit -m "feat: add view-to-edit toggle for security section"
```

---

### Task 4: Final Polishing and Transitions

**Files:**
- Modify: `resources/js/components/contracts/parts/ProfileView.tsx`

- [ ] **Step 1: Add smooth transitions and animations**
Wrap sections in `AnimatePresence` or use simple Tailwind transition classes for height/opacity changes.
- [ ] **Step 2: Verify responsiveness**
Ensure cards stack nicely on mobile and the header centers correctly.
- [ ] **Step 3: Final styling cleanup**
Ensure all colors, font sizes, and spacings match the Zoho-style density requirements.
- [ ] **Step 4: Commit**
```bash
git add resources/js/components/contracts/parts/ProfileView.tsx
git commit -m "style: final polishing of compact profile view"
```
