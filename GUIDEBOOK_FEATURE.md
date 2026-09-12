# 📖 TUTORERA Student & Parent Guidebook

## Overview

A comprehensive, interactive guidebook for students and parents using the TUTORERA platform. The guidebook is available in two formats:

1. **Interactive Frontend** — Full-featured web page with sidebar navigation
2. **Markdown Documentation** — Portable reference document

---

## Features

### 📱 Interactive Web Page (`/student/guidebook`)

**Location:** `tutorera-frontend/src/app/student/guidebook/page.tsx`

#### Navigation Features
- **Sidebar Navigation** — 29 organized sections in a collapsible sidebar
- **Table of Contents** — Jump directly to any section
- **Hash-based Routing** — Deep links for sharing specific sections
- **Smooth Scrolling** — Seamless transitions between sections
- **Active Section Indicator** — Visual highlight of current section
- **Mobile Responsive** — Toggle sidebar on small screens

#### Design Features
- Color-coded sections:
  - 🟢 **Green** — Checklists and positive actions
  - 🟡 **Yellow** — Important considerations and warnings
  - 🔴 **Red** — Safety warnings and critical issues
  - 🔵 **Blue** — Information blocks and details
- Card-based layouts for easy scanning
- Professional typography and spacing
- Icon emojis for visual clarity
- Responsive grid layouts

#### Mobile Experience
- Hamburger menu toggle
- Fixed navigation on mobile
- Touch-friendly buttons
- Responsive typography
- Optimal line lengths for readability

---

## Content Sections

### Getting Started (Sections 1-3)
1. Getting Started — Account creation
2. Your Student Dashboard — Navigation guide
3. How TUTORERA Works — Platform overview

### Using the Marketplace (Sections 4-6)
4. Posting a Tuition Request — Creating requirements
5. Understanding Tutor Offers — Evaluating proposals
6. Offers and Counter-Offers — Negotiation guide

### Tutor Interaction (Sections 7-9)
7. Communicating With Tutors — Safe messaging
8. Choosing a Tutor — Selection criteria
9. Understanding Tutor Verification — Badge meanings

### Booking Process (Sections 10-13)
10. Online Tuition — Remote learning guide
11. Home Tuition / In-Person Tuition — In-person guidelines
12. Home Tuition Distance — Location considerations
13. Booking a Tutor — Confirmation process

### Payments & Refunds (Sections 14-18)
14. Student Fees — Cost structure
15. Payments — Payment process
16. Failed or Pending Payments — Troubleshooting
17. Cancelling a Booking — Cancellation process
18. Refunds — Refund eligibility

### Support & Safety (Sections 19-27)
19. If the Tutor Does Not Arrive — No-show protocol
20. If You Are Not Satisfied — Dispute resolution
21. Reviews and Ratings — Feedback guidelines
22. Safety and Inappropriate Conduct — **Red alert styling**
23. Protecting Your Account — Security tips
24. Notifications — Notification settings
25. Request Expiry — Expiration policy
26. Common Problems — Troubleshooting FAQ
27. Contacting TUTORERA — Support contact info

### Action Items (Sections 28-29)
28. Recommended Student Checklist — **Green card layout**
29. Remember — Closing message

---

## File Locations

### Frontend Component
```
tutorera-frontend/src/app/student/guidebook/page.tsx
```

**Dependencies:**
- React hooks (useEffect, useState)
- lucide-react icons (ChevronDown, ChevronRight, Menu, X)
- UI_COLORS from @/lib/brand

**Size:** ~424 lines

### Markdown Documentation
```
docs/STUDENT_PARENT_GUIDEBOOK.md
```

**Format:** Markdown with 29 sections, ~784 lines

---

## Access URLs

### Direct Access
```
https://tutorera.ac.pk/student/guidebook
```

### Deep Linking Examples
```
https://tutorera.ac.pk/student/guidebook#safety
https://tutorera.ac.pk/student/guidebook#checklist
https://tutorera.ac.pk/student/guidebook#payment
https://tutorera.ac.pk/student/guidebook#how-it-works
```

---

## Usage Examples

### For Students
- **Before hiring:** Review sections 4-9 for marketplace flow
- **During booking:** Check sections 13-15 for payment process
- **Safety concerns:** Jump to section 22 (Safety)
- **Verification questions:** See section 9 (Tutor Verification)
- **Troubleshooting:** Navigate to section 26 (Common Problems)

### For Parents
- **Home Tuition:** Read sections 11-12 for safety requirements
- **Minor accounts:** Check section 1 and 11 for guardian responsibilities
- **Payment concerns:** Review section 15-18

### For Support Staff
- **Reference document:** Use markdown version for documentation
- **Sharing with students:** Send direct links to relevant sections

---

## Technical Stack

**Frontend:**
- Next.js 16.2.6
- React with TypeScript
- Responsive CSS with flexbox/grid
- Mobile-first design

**Styling:**
- Inline styles for component encapsulation
- CSS media queries for responsive behavior
- Color palette from UI_COLORS brand
- Accessibility-focused design

---

## Responsive Breakpoints

### Desktop (>768px)
- Sidebar always visible
- Main content takes remaining width
- Full navigation visible

### Tablet/Mobile (<768px)
- Hamburger menu to toggle sidebar
- Full-screen sidebar overlay
- Responsive typography
- Touch-friendly tap targets

---

## Future Enhancements

### Planned Features
- [ ] Search functionality within guidebook
- [ ] Bookmark/favorite sections
- [ ] Print-friendly version
- [ ] Dark mode support
- [ ] Internationalization (Hindi, Urdu, Arabic)
- [ ] Video tutorials linked to sections
- [ ] Interactive feedback widget

### Optional Variants
- [ ] Tutor guidebook at `/tutor/guidebook`
- [ ] Parent-specific guidebook
- [ ] Quick-start guide (condensed version)
- [ ] FAQ section

---

## Deployment Notes

### Cloudflare Workers
- Frontend builds with Next.js and OpenNextJS
- Static pages serve from Cloudflare cache
- Dynamic routing works with hash anchors
- Mobile redirect handled by viewport meta

### Performance
- Lazy loading for long sections (future)
- Sidebar navigation is lightweight
- No external API calls
- Client-side scrolling only

---

## Git History

### Commits
1. **582a347** — docs: add comprehensive TUTORERA Student & Parent Guidebook
   - Created markdown documentation in `docs/STUDENT_PARENT_GUIDEBOOK.md`
   - 784 lines, 29 sections

2. **962e281** — feat: add interactive student guidebook with sidebar navigation
   - Created interactive frontend page
   - Sidebar navigation with 29 sections
   - Hash-based routing
   - Mobile responsive design

---

## Support & Maintenance

### Contact
- **Email:** hello@mentisera.pk
- **Report Issues:** Use GitHub issues with label `docs`

### Updates
When updating the guidebook:
1. Update markdown version in `docs/STUDENT_PARENT_GUIDEBOOK.md`
2. Update frontend component in `tutorera-frontend/src/app/student/guidebook/page.tsx`
3. Keep section list and anchors in sync
4. Test all deep links on deployment
5. Verify mobile responsiveness

---

## Version

**Current:** 1.0  
**Last Updated:** 2026-09-12  
**Status:** Production Ready ✅
