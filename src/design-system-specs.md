# ERP Design System Specifications for Figma Recreation

## **Color System**
Based on your current CSS variables:

### Primary Colors
- **Primary Blue**: `#0c9dcb` (Main brand color)
- **Secondary Blue**: `#26b4e0` (Supporting actions)
- **Background**: `#ffffff` (Main background)
- **Foreground**: `oklch(0.145 0 0)` (Main text)

### UI Colors
- **Card Background**: `#ffffff`
- **Muted**: `#ececf0` (Subtle backgrounds)
- **Muted Foreground**: `#717182` (Secondary text)
- **Accent**: `#e9ebef` (Subtle highlights)
- **Destructive**: `#d4183d` (Error states)
- **Border**: `rgba(0, 0, 0, 0.1)` (Subtle borders)

### Chart Colors
- **Chart 1**: `#0c9dcb`
- **Chart 2**: `#26b4e0` 
- **Chart 3**: `#4cc9f0`
- **Chart 4**: `#20c997`
- **Chart 5**: `#17a2b8`

## **Typography System**
Base font size: `14px`

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Text Sizes (relative to 14px base)
- **H1**: 24px (1.714em) - Medium weight
- **H2**: 20px (1.428em) - Medium weight  
- **H3**: 18px (1.285em) - Medium weight
- **H4**: 16px (1.142em) - Medium weight
- **Body/P**: 14px (1em) - Normal weight
- **Label**: 14px (1em) - Medium weight
- **Button**: 14px (1em) - Medium weight

### Line Height
All text elements use: `1.5` line-height

## **Layout System**

### Border Radius
- **Default**: `8px` (0.5rem)
- **Small**: `4px` (radius - 4px)
- **Medium**: `6px` (radius - 2px) 
- **Large**: `8px` (radius)
- **Extra Large**: `12px` (radius + 4px)

### Spacing System
Based on Tailwind's spacing scale:
- **xs**: `4px`
- **sm**: `8px`
- **md**: `12px`
- **lg**: `16px` 
- **xl**: `20px`
- **2xl**: `24px`
- **3xl**: `32px`

## **Component Specifications**

### **Sidebar Component**
- **Width**: `320px` (80 * 0.25rem)
- **Collapsed Width**: `64px` (16 * 0.25rem)
- **Background**: `oklch(0.985 0 0)` (Very light gray)
- **Border**: Right border with `oklch(0.922 0 0)`
- **Transition**: `300ms` duration for collapse

### **Header Bar**
- **Height**: `80px` 
- **Background**: White with subtle shadow
- **Position**: Fixed top, adjusts with sidebar state

### **Cards**
- **Background**: `#ffffff`
- **Border**: `1px solid rgba(0, 0, 0, 0.1)`
- **Border Radius**: `12px`
- **Shadow**: Subtle drop shadow
- **Padding**: `24px` (6 * 0.25rem)

### **Buttons**

#### Primary Button
- **Background**: `#0c9dcb`
- **Text Color**: White
- **Padding**: `12px 24px`
- **Border Radius**: `8px`
- **Font Weight**: Medium (500)
- **Hover**: Slightly darker blue

#### Secondary Button  
- **Background**: Transparent
- **Border**: `1px solid #0c9dcb`
- **Text Color**: `#0c9dcb`
- **Padding**: `12px 24px`
- **Border Radius**: `8px`

### **Form Inputs**
- **Height**: `44px` (h-11 = 2.75rem)
- **Background**: `#f8f9fa`
- **Border**: `1px solid rgba(0, 0, 0, 0.1)`
- **Border Radius**: `8px`
- **Padding**: `12px 16px`
- **Font Size**: `14px`

### **Tables**
- **Header Background**: `linear-gradient(to right, #f9fafb, #f3f4f6)`
- **Row Height**: `60px` minimum
- **Border**: `1px solid #e5e7eb`
- **Hover**: `#dbeafe` (blue-50)

### **Status Badges**

#### Workflow Status Colors
- **Idea Submitted**: `bg-blue-100 text-blue-800`
- **Costing Pending**: `bg-yellow-100 text-yellow-800`
- **Costing Received**: `bg-orange-100 text-orange-800`
- **Prototype**: `bg-purple-100 text-purple-800`
- **Red Seal**: `bg-red-100 text-red-800`
- **Green Seal**: `bg-green-100 text-green-800`
- **Final Approved**: `bg-emerald-100 text-emerald-800`
- **PO Issued**: `bg-gray-100 text-gray-800`

## **Key Component Layouts**

### **R&D Table Structure**
8 columns with specific widths:
1. **Project Details**: 20%
2. **Brand & Category**: 14%
3. **Material & Origin**: 14% 
4. **Project Status**: 14%
5. **Financial Overview**: 16%
6. **Timeline & Dates**: 14%
7. **Client Feedback**: 12%
8. **Actions**: 8%

### **Dashboard Grid**
- **Cards**: 4-column grid on desktop
- **Responsive**: 2-column on tablet, 1-column on mobile
- **Gap**: `24px` between cards

## **Indian Rupee (₹) Formatting**
- **Currency Symbol**: ₹ (Indian Rupee)
- **Format**: `₹2,50,000` (Indian number system)
- **Use**: `toLocaleString('en-IN')` formatting

## **Figma Recreation Steps**

1. **Set up your design system** with these color and typography tokens
2. **Create component variants** for buttons, inputs, cards
3. **Build table components** with the specified column widths  
4. **Use Auto Layout** to match the flex/grid structures
5. **Apply the color scheme** throughout your designs
6. **Create status badge variants** for all workflow states

## **Icons Used**
The app uses Lucide React icons. In Figma, use:
- **Lucide icon set** (available as Figma plugin)
- **Size**: Typically `16px` or `20px` (w-4 h-4 or w-5 h-5)