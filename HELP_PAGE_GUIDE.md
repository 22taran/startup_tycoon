# Help Page Guide

## 📚 Student Help Page Created

I've created a comprehensive help page at `/help` that provides detailed instructions for students on how to:

1. **Submit Assignments** - Complete guide with team creation and submission process
2. **Invest in Peer Work** - Step-by-step investment and evaluation guide
3. **Quick Tips** - Best practices for success

## 🔗 Navigation Added

The help page is accessible from:
- **Main Navigation** - "Help" link in the top navigation bar
- **Mobile Menu** - "Help & Guide" in the mobile dropdown
- **Course Dashboard** - "Help & Guide" button in the course header

## 📸 Adding Screenshots

The help page includes placeholder areas for screenshots. To add actual screenshots:

### 1. Replace Screenshot Placeholders

The page uses `<ScreenshotPlaceholder>` components that you can replace with actual images:

```tsx
// Current placeholder
<ScreenshotPlaceholder 
  title="Course Dashboard - Create Team Button"
  description="Screenshot of course dashboard with 'Create Team' button highlighted"
/>

// Replace with actual image
<img 
  src="/screenshots/course-dashboard-create-team.png" 
  alt="Course Dashboard - Create Team Button"
  className="w-full rounded-lg border shadow-lg"
/>
```

### 2. Screenshot Locations Needed

You'll need to take screenshots of:

1. **Course Dashboard** - Showing "Create Team" button
2. **Assignments Tab** - Showing assignment cards with "Submit Work" buttons
3. **My Evaluations Tab** - Showing assigned peer work with investment options
4. **Submission Modal** - The actual submission form
5. **Investment Modal** - The investment form with token selection

### 3. Recommended Screenshot Specifications

- **Format**: PNG or JPG
- **Size**: 1200x800px or similar aspect ratio
- **Quality**: High resolution for clarity
- **Storage**: Place in `/public/screenshots/` directory

### 4. Example Implementation

```tsx
// In app/help/page.tsx, replace:
<ScreenshotPlaceholder 
  title="Course Dashboard - Create Team Button"
  description="Screenshot of course dashboard with 'Create Team' button highlighted"
/>

// With:
<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
  <img 
    src="/screenshots/course-dashboard-create-team.png" 
    alt="Course Dashboard - Create Team Button"
    className="w-full rounded-lg border shadow-lg"
  />
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
    Course Dashboard showing the "Create Team" button
  </p>
</div>
```

## 🎨 Page Features

- **Responsive Design** - Works on all devices
- **Dark Mode Support** - Adapts to user's theme preference
- **Interactive Navigation** - Quick links to different sections
- **Step-by-Step Instructions** - Clear, numbered steps
- **Visual Indicators** - Icons and badges for better UX
- **Quick Tips Section** - Best practices for success

## 📱 Mobile Optimization

The help page is fully optimized for mobile devices with:
- Responsive grid layouts
- Touch-friendly buttons
- Readable typography
- Proper spacing and padding

## 🔄 Future Enhancements

Consider adding:
- Video tutorials
- Interactive demos
- FAQ section
- Search functionality
- Print-friendly version

## 🚀 Usage

Students can access the help page by:
1. Clicking "Help" in the main navigation
2. Clicking "Help & Guide" in the mobile menu
3. Clicking "Help & Guide" button in course dashboard
4. Direct URL: `/help`

The page provides comprehensive guidance for both assignment submission and peer investment processes.
