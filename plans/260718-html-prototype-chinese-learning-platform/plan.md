# HTML Prototype: Chinese Learning Platform MVP

**Plan ID:** 260718-html-prototype-chinese-learning-platform
**Created:** 2025-07-18
**Status:** ✅ Completed
**Type:** Frontend Prototype
**Completed:** 2025-07-18

---

## Overview

High-fidelity HTML prototype for Chinese Learning Platform with interactive UI, fake data, and responsive design using Tailwind CSS CDN in a single HTML file.

---

## Pages & Sections

### 1. Auth Pages
- **Login Form**: Email, password, remember me, forgot password link
- **Register Form**: Username, email, password, confirm password

### 2. HSK List Page
- Grid/card layout displaying 6 HSK levels (HSK 1-6)
- Each card shows: level number, description, progress bar, lesson count

### 3. Progress Dashboard
- Overall stats: total words learned, lessons completed, study streak
- HSK progress cards for each level
- Recent completed lessons list

### 4. Lesson Detail Page
- Lesson info (title, HSK level, description)
- Vocabulary list with: Hanzi, Pinyin, Vietnamese meaning
- Audio icon placeholder, favorite button

### 5. Profile Page
- User avatar, username
- Stats: words learned, lessons completed, study streak, days active
- Edit profile button

---

## File Structure

```
index.html          # Single file containing all pages
├── <head>
│   ├── Tailwind CSS CDN
│   ├── Google Fonts (Inter, Noto Sans SC)
│   └── <style> for custom animations
├── <body>
│   ├── Navigation (header)
│   ├── Main content sections (hidden/shown via JS)
│   └── Footer
└── <script>
    ├── Fake data objects
    ├── Navigation functions
    └── Page render functions
```

---

## Component Breakdown

### Shared Components
1. **Navigation Bar**
   - Logo/brand name
   - Links: Home, HSK Levels, Progress, Profile
   - User menu (avatar, logout)

2. **Page Container**
   - Responsive max-width container
   - Padding for mobile/desktop

3. **Card Component**
   - Shadow, rounded corners
   - Hover effects
   - Progress bar

4. **Button Component**
   - Primary/secondary styles
   - Loading state
   - Hover/active states

5. **Input Component**
   - Text fields, password fields
   - Label styling
   - Error states

### Page-Specific Components

#### Auth Pages
- Form container with centered layout
- Input fields with labels
- Submit button
- Toggle between login/register

#### HSK List
- 6 cards in responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Each card: HSK level badge, title, progress bar, "Continue" button

#### Progress Dashboard
- Stats row (4 stat cards)
- HSK progress section (6 progress cards)
- Recent lessons list (table or card list)

#### Lesson Detail
- Breadcrumb navigation
- Lesson header (title, level badge)
- Vocabulary list (card or table layout)
- Each vocab item: Hanzi (large), Pinyin, Meaning, audio btn, favorite btn

#### Profile
- Profile header (avatar centered, username, edit button)
- Stats grid (2x2)
- Settings section (optional)

---

## Fake Data Structure

```javascript
const fakeData = {
  currentUser: {
    id: 1,
    username: "learner123",
    email: "learner@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=learner",
    stats: {
      wordsLearned: 342,
      lessonsCompleted: 28,
      studyStreak: 7,
      daysActive: 45
    }
  },

  hskLevels: [
    { id: 1, level: "HSK 1", title: "Beginner", description: "150 basic words", lessons: 10, progress: 100, completedLessons: 10 },
    { id: 2, level: "HSK 2", title: "Elementary", description: "300 words", lessons: 15, progress: 73, completedLessons: 11 },
    { id: 3, level: "HSK 3", title: "Intermediate", description: "600 words", lessons: 20, progress: 45, completedLessons: 9 },
    { id: 4, level: "HSK 4", title: "Upper Intermediate", description: "1200 words", lessons: 25, progress: 20, completedLessons: 5 },
    { id: 5, level: "HSK 5", title: "Advanced", description: "2500 words", lessons: 30, progress: 5, completedLessons: 2 },
    { id: 6, level: "HSK 6", title: "Proficient", description: "5000+ words", lessons: 35, progress: 0, completedLessons: 0 }
  ],

  lessons: {
    1: [
      { id: 1, hskLevel: 1, title: "Greetings", vocabCount: 15, completed: true },
      { id: 2, hskLevel: 1, title: "Numbers 1-10", vocabCount: 12, completed: true },
      { id: 3, hskLevel: 1, title: "Family Members", vocabCount: 18, completed: true },
      { id: 4, hskLevel: 1, title: "Colors", vocabCount: 10, completed: false }
    ],
    2: [
      { id: 11, hskLevel: 2, title: "Daily Routine", vocabCount: 20, completed: true },
      { id: 12, hskLevel: 2, title: "Food & Drinks", vocabCount: 25, completed: true },
      { id: 13, hskLevel: 2, title: "Shopping", vocabCount: 22, completed: false }
    ]
  },

  vocabularies: {
    1: [
      { id: 1, hanzi: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào", isFavorite: true },
      { id: 2, hanzi: "我", pinyin: "wǒ", meaning: "Tôi", isFavorite: false },
      { id: 3, hanzi: "你", pinyin: "nǐ", meaning: "Bạn", isFavorite: true },
      { id: 4, hanzi: "他", pinyin: "tā", meaning: "Anh ấy/Hắn", isFavorite: false },
      { id: 5, hanzi: "她", pinyin: "tā", meaning: "Cô ấy/Nàng", isFavorite: false },
      { id: 6, hanzi: "好", pinyin: "hǎo", meaning: "Tốt", isFavorite: true },
      { id: 7, hanzi: "谢谢", pinyin: "xiè xie", meaning: "Cảm ơn", isFavorite: true },
      { id: 8, hanzi: "再见", pinyin: "zài jiàn", meaning: "Tạm biệt", isFavorite: false }
    ],
    11: [
      { id: 51, hanzi: "起床", pinyin: "qǐ chuáng", meaning: "Thức dậy", isFavorite: false },
      { id: 52, hanzi: "吃早饭", pinyin: "chī zǎo fàn", meaning: "Ăn sáng", isFavorite: true },
      { id: 53, hanzi: "上班", pinyin: "shàng bān", meaning: "Đi làm", isFavorite: false },
      { id: 54, hanzi: "回家", pinyin: "huí jiā", meaning: "Về nhà", isFavorite: true },
      { id: 55, hanzi: "睡觉", pinyin: "shuì jiào", meaning: "Ngủ", isFavorite: false }
    ]
  },

  recentActivity: [
    { lessonId: 11, title: "Daily Routine", completedAt: "2025-07-17", hskLevel: 2 },
    { lessonId: 3, title: "Family Members", completedAt: "2025-07-16", hskLevel: 1 },
    { lessonId: 12, title: "Food & Drinks", completedAt: "2025-07-15", hskLevel: 2 }
  ]
};
```

---

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (Single Page)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Navigation Bar                    │    │
│  │  [Logo] [Home] [HSK] [Progress] [Profile] [Avatar]    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Main Content                      │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  #auth-section (hidden/shown)                 │  │    │
│  │  │    - Login form                               │  │    │
│  │  │    - Register form                            │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  #hsk-list-section (hidden/shown)             │  │    │
│  │  │    - HSK 1-6 cards                             │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  #dashboard-section (hidden/shown)             │  │    │
│  │  │    - Stats cards                                │  │    │
│  │  │    - Progress cards                             │  │    │
│  │  │    - Recent lessons                             │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  #lesson-detail-section (hidden/shown)          │  │    │
│  │  │    - Lesson header                              │  │    │
│  │  │    - Vocabulary list                            │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  #profile-section (hidden/shown)                │  │    │
│  │  │    - User info & stats                         │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      Footer                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Navigation States
1. **Not Authenticated**: Show login/register, hide nav
2. **Authenticated**: Show all pages, hide auth
3. **Default Page**: Dashboard (after login)

---

## Implementation Steps

### Phase 1: Setup & Structure
1. Create `index.html` with HTML5 boilerplate
2. Add Tailwind CSS CDN
3. Add Google Fonts (Inter, Noto Sans SC for Chinese)
4. Set up basic page structure with header, main, footer
5. Create section containers for each page (hidden by default)

### Phase 2: Fake Data
1. Create `fakeData` object in `<script>`
2. Populate users, HSK levels, lessons, vocabularies
3. Add helper functions for data access

### Phase 3: Auth Pages
1. Build login form with email/password
2. Build register form with validation
3. Add toggle between login/register
4. Style forms with Tailwind
5. Add fake login function (set currentUser in localStorage)

### Phase 4: Navigation
1. Build navigation bar component
2. Add navigation links
3. Implement `showSection()` function to hide/show sections
4. Add active state styling for current page
5. Handle logout (clear localStorage, show auth)

### Phase 5: HSK List Page
1. Build HSK card template
2. Render 6 HSK levels from fakeData
3. Add progress bars
4. Add "Continue" button navigation
5. Responsive grid layout

### Phase 6: Progress Dashboard
1. Build stats cards row
2. Build HSK progress section
3. Build recent lessons list
4. Populate from fakeData.currentUser.stats
5. Add visual indicators (icons, colors)

### Phase 7: Lesson Detail Page
1. Build lesson header with breadcrumb
2. Build vocabulary list component
3. Render vocab items with Hanzi, Pinyin, Meaning
4. Add audio button (placeholder icon)
5. Add favorite toggle button
6. Add back button to return to HSK list

### Phase 8: Profile Page
1. Build profile header with avatar
2. Build stats grid
3. Add edit profile button (modal placeholder)
4. Populate from fakeData.currentUser

### Phase 9: Interactivity
1. Add form validation
2. Add hover states and transitions
3. Add loading states (button spinners)
4. Add toast notifications (optional)
5. Test all navigation flows

### Phase 10: Responsive Design
1. Test on mobile (320px+)
2. Test on tablet (768px+)
3. Test on desktop (1024px+)
4. Adjust breakpoints
5. Fix overflow issues

---

## Success Criteria

### Functional
- [ ] All 5 pages render correctly
- [ ] Navigation between pages works smoothly
- [ ] Login/Register forms accept input
- [ ] Fake login persists in session
- [ ] All fake data displays correctly
- [ ] Responsive design works on mobile, tablet, desktop

### UI/UX
- [ ] Consistent styling across all pages
- [ ] Hover states on all interactive elements
- [ ] Progress bars show correct percentages
- [ ] Chinese characters display correctly (Noto Sans SC)
- [ ] Color scheme is professional and readable

### Technical
- [ ] Single HTML file (no external CSS/JS files)
- [ ] Tailwind CSS CDN loads correctly
- [ ] No console errors
- [ ] File size reasonable (< 500KB)
- [ ] Works in major browsers (Chrome, Firefox, Safari, Edge)

---

## Technical Notes

### Tailwind CDN
```html
<script src="https://cdn.tailwindcss.com"></script>
```

### Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

### Avatar Service
Using DiceBear for consistent placeholder avatars:
```
https://api.dicebear.com/7.x/avataaars/svg?seed={username}
```

### Color Palette (Tailwind)
- Primary: `blue-600`
- Secondary: `gray-600`
- Success: `green-500`
- Warning: `yellow-500`
- Background: `gray-50`
- Card: `white`

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Single file becomes too large | Keep code organized with clear comments, use functions for rendering |
| Tailwind CDN may be slow | Add loading spinner, fallback styles |
| Chinese font may not load quickly | Use system font as fallback |
| Browser compatibility | Test in multiple browsers, avoid modern JS features |
| Too much fake data in memory | Keep data minimal but realistic |

---

## Next Steps

1. Review and approve this plan
2. Create `index.html` in project root
3. Begin Phase 1: Setup & Structure
4. Progress through phases sequentially
5. Test thoroughly after each phase

---

**Status:** Pending approval
**Estimated Time:** 3-4 hours for full implementation
