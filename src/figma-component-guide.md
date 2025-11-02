# Figma Component Recreation Guide

## **1. Sidebar Component (FigmaSidebar)**

### Layout Structure
```
Sidebar Container (320px wide)
├── Header Section (80px height)
│   ├── Logo Area (48px x 48px)
│   ├── Brand Text ("ERP System")
│   └── Collapse Button (32px x 32px)
├── Navigation Menu
│   ├── Module Groups
│   │   ├── Dashboard (single item)
│   │   ├── Core Modules (collapsible group)
│   │   │   ├── Master Data Management
│   │   │   ├── R&D Management  
│   │   │   ├── Image & Document Management
│   │   │   ├── Workflow Automation
│   │   │   └── Production & Plant Management
│   │   ├── Operations (collapsible group)
│   │   │   ├── Procurement & Inventory
│   │   │   ├── User & Role Management
│   │   │   └── Notifications & Alerts
│   │   └── Analytics (collapsible group)
│   │       └── Reporting & Analytics
└── Footer Section
```

### Styling Details
- **Background**: `oklch(0.985 0 0)` 
- **Width**: 320px normal, 64px collapsed
- **Border Right**: `1px solid oklch(0.922 0 0)`
- **Menu Item Height**: 48px
- **Icon Size**: 20px
- **Active State**: Blue background with white text
- **Hover**: Subtle background change

## **2. Header Bar Component**

### Layout Structure  
```
Header Container (100% width, 80px height)
├── Left Section
│   └── Module Title (dynamic)
├── Right Section
│   ├── Search Input (optional)
│   ├── Notification Bell + Badge
│   ├── User Profile Dropdown
│   │   ├── Avatar (32px circle)
│   │   ├── User Name
│   │   └── Role Badge
│   └── Settings Gear Icon
```

### Styling Details
- **Background**: White with bottom shadow
- **Height**: 80px
- **Padding**: 24px horizontal
- **Notification Badge**: Red circle with white count
- **Avatar**: 32px circle with gradient background

## **3. Card Components**

### Standard Card
```
Card Container
├── Header (optional)
│   ├── Title (text-xl, font-medium)  
│   └── Action Button (optional)
├── Content Area
│   └── Main content with 24px padding
└── Footer (optional)
```

### Dashboard Metric Card
```
Metric Card (specific layout)
├── Icon Area (48px circle with gradient)
├── Content Area
│   ├── Metric Value (text-2xl, font-bold)
│   ├── Metric Label (text-sm, muted)
│   └── Change Indicator (green/red with arrow)
└── Mini Chart (optional)
```

## **4. Table Component (R&D Management)**

### Column Structure & Widths
1. **Project Code & Details (20%)**
   - Project code badge (48px circle)
   - Project name and description
   - Duration badge

2. **Brand & Category (14%)**  
   - Brand name (font-bold)
   - Brand code (text-xs, muted)
   - Category badge

3. **Material & Origin (14%)**
   - Color circle indicator
   - Material type
   - Country origin

4. **Project Status (14%)**
   - Status badge with color coding
   - Progress bar (full width)
   - Percentage complete

5. **Financial Overview (16%)**
   - Target cost (₹ symbol + amount)
   - Final cost (if available)
   - Variance (green/red indicator)

6. **Timeline & Dates (14%)**
   - Start date with calendar icon
   - End date with clock icon  
   - Next update in yellow box

7. **Client Feedback (12%)**
   - Feedback status badge
   - Last update date
   - PO information box

8. **Actions (8%)**
   - View button (eye icon)
   - Edit button (pencil icon)
   - Delete button (trash icon)

### Table Styling
- **Header Background**: `linear-gradient(to right, #f9fafb, #f3f4f6)`
- **Row Height**: Minimum 80px for content
- **Borders**: `1px solid #e5e7eb`
- **Hover State**: `#dbeafe` background
- **Alternate Rows**: `#f9fafb` for even rows

## **5. Form Components**

### Input Field
- **Height**: 44px
- **Background**: `#f8f9fa`
- **Border**: `1px solid rgba(0, 0, 0, 0.1)`
- **Border Radius**: 8px
- **Padding**: `12px 16px`
- **Focus State**: Blue border + shadow

### Select Dropdown
- Same styling as input
- Down arrow icon (16px)
- Dropdown menu with white background
- Option hover: Light blue background

### Button Variants
- **Primary**: Blue background, white text, 8px radius
- **Secondary**: Transparent background, blue border and text
- **Ghost**: Transparent, hover shows light background
- **Sizes**: Small (32px), Medium (40px), Large (44px)

## **6. Status Badges**

Create component variants for each status:
- **Padding**: `6px 12px`
- **Border Radius**: 16px (pill shape)
- **Font Size**: 12px
- **Font Weight**: Medium

### Status Colors (Background + Text)
- Idea Submitted: `#dbeafe` + `#1e40af`
- Costing Pending: `#fef3c7` + `#92400e`
- Costing Received: `#fed7aa` + `#ea580c`
- Prototype: `#e9d5ff` + `#7c2d12`
- Red Seal: `#fecaca` + `#dc2626`
- Green Seal: `#bbf7d0` + `#166534`
- Final Approved: `#a7f3d0` + `#065f46`
- PO Issued: `#f3f4f6` + `#374151`

## **Figma Best Practices for Recreation**

1. **Create a Design System First**
   - Set up color styles for all your colors
   - Create text styles for typography
   - Define spacing and sizing tokens

2. **Use Auto Layout Extensively**  
   - Sidebar uses vertical auto layout
   - Table rows use horizontal auto layout
   - Card content uses vertical auto layout with proper spacing

3. **Create Component Variants**
   - Button: Primary, Secondary, Ghost variants
   - Badge: All status variants  
   - Card: Different types and sizes

4. **Use Proper Constraints**
   - Sidebar: Fixed left, stretch vertically
   - Header: Stretch horizontally, fixed top
   - Main content: Fill remaining space

5. **Layer Organization**
   - Use clear naming conventions
   - Group related elements
   - Use frames for major sections

This guide provides all the specifications needed to recreate your ERP interface in Figma with pixel-perfect accuracy.