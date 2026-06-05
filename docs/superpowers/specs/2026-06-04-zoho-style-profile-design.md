# Spec: Zoho-Style Compact Profile View

**Status:** Draft
**Date:** 2026-06-04
**Goal:** Redesign the current profile view into a compact, professional "widget" style inspired by Zoho Apps, featuring a "View-to-Edit" interaction model.

---

## 1. Overview
The profile page will be transformed from an always-editable form into a clean, sectioned view. Each section displays data as static text by default and provides an "Edit" trigger to swap the section into an editable state.

## 2. UI Architecture

### 2.1 Layout
- **Container:** Centered column with `max-width: 800px`.
- **Spacing:** Tight, consistent vertical gaps (`gap-4` or `gap-6`) between sections.
- **Background:** Subtle surface muted background for the page, with white cards for sections.

### 2.2 Section: Header (Identity)
- **Avatar:** Large circular profile picture on the left.
- **Primary Text:** Bold, large name.
- **Secondary Text:** Role/Position and Location badges/text.
- **Interaction:** Hovering over the avatar reveals a "Camera" icon to update the photo.

### 2.3 Section: Personal Information (Card)
- **Title:** "Personal Information" in small, bold, uppercase text.
- **Action:** "Edit" button in the top-right corner.
- **Grid:** 2-column layout (Label | Value).
- **Mode Toggle:**
    - **View:** `Name`, `Email`, `Phone` shown as plain text.
    - **Edit:** Fields turn into `Input` components. "Edit" button replaced by "Save" and "Cancel".

### 2.4 Section: Account Security (Card)
- **Title:** "Security" or "Account Credentials".
- **Action:** "Edit" button in the top-right corner.
- **Grid:** 2-column layout.
- **Mode Toggle:**
    - **View:** Masked password (••••••••).
    - **Edit:** `Current Password`, `New Password`, `Confirm Password` inputs.

## 3. Technical Implementation

### 3.1 State Management
- Use React `useState` to track which section is in "Edit Mode" (e.g., `isEditingInfo`, `isEditingSecurity`).
- Use Inertia's `useForm` for data handling and submission.
- Ensure only one section can be edited at a time for maximum focus (optional, but recommended).

### 3.1 Styles (Tailwind CSS v4)
- **Card Styles:** `bg-white border border-surface-border/50 rounded-xl shadow-sm`.
- **Labels:** `text-[10px] font-bold uppercase  text-text-soft`.
- **Values:** `text-sm font-medium text-text-main`.
- **Transitions:** Use `transition-all duration-200` for mode swapping and hover effects.

## 4. Data Flow
1. User clicks **"Edit"** on a section.
2. Component swaps the display for that specific card to a form.
3. User modifies data.
4. User clicks **"Save"**:
    - Submit via `patch` or `put` using Inertia.
    - On success, show toast and return section to "View Mode".
5. User clicks **"Cancel"**:
    - Revert changes (reset form state).
    - Return section to "View Mode".

## 5. Verification
- Verify that clicking "Edit" doesn't affect other sections.
- Ensure "Cancel" correctly discards unsaved changes.
- Verify responsiveness (collapses to 1 column on mobile).
- Ensure "Save" updates the data globally (e.g., updating the name in the header).
