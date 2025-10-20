# Live View - Visual Reference & Layout Guide

## Page Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HEADER / NAVIGATION                            │
│  CheckLoops | Upload CSV | 2week | LiveView | Settings | Calendar Admin│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🟢 Live Operational View                                              │
│  Real-time clinician appointments — updates every 30 seconds           │
│                                                                         │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐           │
│  │  6          │ │  2       │ │  4       │ │  🟢 LIVE    │           │
│  │ CLINICIANS  │ │ IN SESS  │ │AVAILABLE │ │ 12:13:06    │           │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ [ All ] [ In Session ] [ Available ] [ On Break ]                       │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬─────────────────────────────────────────────────────┐
│  LEFT SIDEBAR      │  RIGHT CONTENT AREA                                 │
│                    │                                                     │
│ CLINICIAN STATUS   │ DETAILED APPOINTMENTS                              │
│                    │                                                     │
│ ┌──────────────┐   │ ┌──────────────────────────────────────────────┐   │
│ │ 🟢 • · · · │   │ │ Dr. Kelly MANSELL      🟢 IN SESSION      │   │
│ │ Dr. Kelly M.│   │ ├──────────────────────────────────────────────┤   │
│ │ In Session   │   │ │ Time │ Avail    │ Duration │ Slot Type │   │
│ └──────────────┘   │ ├──────┼──────────┼──────────┼───────────────┤   │
│                    │ │ 11:30│ Blocked  │ 30m      │ Admin         │   │
│ ┌──────────────┐   │ │ 12:00│ Blocked  │ 30m      │ Admin         │   │
│ │ 🟡 ○ · · · │   │ │ 12:30│ Blocked  │ 30m      │ Lunch Break   │   │
│ │ Dr. Sarah M. │   │ └──────────────────────────────────────────────┘   │
│ │ Available    │   │                                                     │
│ └──────────────┘   │ ┌──────────────────────────────────────────────┐   │
│                    │ │ Dr. Sarah MASTERSON   (Available)            │   │
│ ┌──────────────┐   │ ├──────────────────────────────────────────────┤   │
│ │ 🟡 ○ · · · │   │ │ Time │ Avail    │ Duration │ Slot Type │   │
│ │ Dr. Kelly A. │   │ ├──────┼──────────┼──────────┼───────────────┤   │
│ │ Available    │   │ │ 11:45│ Booked   │ 15m      │ Prebookable   │   │
│ └──────────────┘   │ │ 12:00│ Other    │ 30m      │ Admin         │   │
│                    │ │ 12:30│ Other    │ 30m      │ Lunch Break   │   │
│ ┌──────────────┐   │ └──────────────────────────────────────────────┘   │
│ │ 🟡 ○ · · · │   │                                                     │
│ │ Dr. Salman S.│   │ [More cards below in scrollable grid...]           │
│ │ Available    │   │                                                     │
│ └──────────────┘   │                                                     │
│                    │                                                     │
│ ┌──────────────┐   │                                                     │
│ │ 🟡 ○ · · · │   │                                                     │
│ │ Dr. James G. │   │                                                     │
│ │ Available    │   │                                                     │
│ └──────────────┘   │                                                     │
│                    │                                                     │
│ ┌──────────────┐   │                                                     │
│ │ 🔴 ● · · · │   │                                                     │
│ │ Dr. Diana G. │   │                                                     │
│ │ On Break     │   │                                                     │
│ └──────────────┘   │                                                     │
│                    │                                                     │
│ (scrollable)       │ (scrollable grid of cards)                         │
└────────────────────┴─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Hero Status Section

```
╔════════════════════════════════════════════════════════════════════════╗
║                      DARK GRADIENT BACKGROUND                          ║
║  #0f172a → #1e293b (diagonal gradient)                               ║
║                                                                        ║
║  🟢 Live Operational View                                             ║
║  Real-time clinician appointments — updates every 30 seconds          ║
║                                                                        ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              ║
║  │    6     │  │    2     │  │    4     │  │🟢 LIVE  │              ║
║  │ #22c55e  │  │ #3b82f6  │  │ #f59e0b  │  │ 12:13:06 │              ║
║  │CLINICIANS│  │IN SESSION│  │ AVAILABLE│  │ ─────────│              ║
║  │DOCTORS   │  │ SESSIONS │  │ FOR APT'S│  │UPDATED: │              ║
║  │          │  │ HAPPENING│  │ NOW      │  │ LIVE STATUS           ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘              ║
║                                                                        ║
║  Metrics update every 30 seconds automatically                        ║
╚════════════════════════════════════════════════════════════════════════╝

Dimensions:
- Height: ~140px
- Padding: 32px top/bottom
- Metric boxes: 4x equal width
- Text alignment: Center
- Font sizes: 32px (numbers), 12px (labels)
- Colors: White text, semi-transparent boxes
```

### 2. Filter Buttons

```
┌──────────────────────────────────────────────────────────────────┐
│ [ ⊞ All ] [ ▶ In Session ] [ ✓ Available ] [ ⏸ On Break ]      │
│                                                                  │
│ Active Button Style:                                            │
│ - Border: 2px solid #2563eb                                     │
│ - Background: #eff6ff                                           │
│ - Color: #2563eb                                                │
│ - Font-weight: 600                                              │
│                                                                  │
│ Inactive Button Style:                                          │
│ - Border: 2px solid #e0e0e0                                     │
│ - Background: white                                             │
│ - Color: #64748b                                                │
│ - Font-weight: 600                                              │
│                                                                  │
│ Hover Effect:                                                   │
│ - Transform: translateY(-1px)                                   │
│ - Box-shadow: 0 2px 8px rgba(0,0,0,0.1)                         │
│ - Transition: 0.2s ease                                         │
└──────────────────────────────────────────────────────────────────┘

Button Dimensions:
- Height: 36px
- Padding: 8px 16px
- Border-radius: 8px
- Font-size: 13px
- Gap between buttons: 8px
```

### 3. Left Sidebar (Clinician Pills)

```
┌────────────────────────┐
│ CLINICIAN STATUS       │  (Header: 13px, uppercase)
│ (Scrollable List)      │
├────────────────────────┤
│                        │
│ ┌──────────────────┐   │
│ │ 🟢 • · · · · · │   │  Status dot (8px, animated pulse)
│ │ Dr. Kelly M.     │   │  Name (12px, bold)
│ │ In Session       │   │  Status (10px, muted)
│ │                  │   │  Icon (14px, right-aligned)
│ └──────────────────┘   │
│                        │
│ ┌──────────────────┐   │  Background: rgba(240,253,244)
│ │ 🟡 ○ · · · · · │   │  Border: 2px solid #22c55e
│ │ Dr. Sarah M.     │   │  Padding: 12px
│ │ Available        │   │  Border-radius: 10px
│ │                  │   │  Hover: slide right 4px
│ └──────────────────┘   │
│                        │
│ ┌──────────────────┐   │
│ │ 🔴 ● · · · · · │   │  Red variant for break
│ │ Dr. Diana G.     │   │  Background: rgba(254,242,242)
│ │ On Break         │   │  Border: 2px solid #ef4444
│ │                  │   │
│ └──────────────────┘   │
│                        │
│ (max-height: 600px)    │
│ (overflow-y: auto)     │
└────────────────────────┘

Sidebar Dimensions:
- Width: 280px (fixed)
- Max-height: 600px
- Padding: 20px
- Gap between pills: 8px
```

### 4. Status Pills (Detailed)

```
┌────────────────────────────────┐
│ 🟢 • · · · · · · · · · · · ▶  │  Entire pill is clickable
│ Dr. Kelly Mansell              │  Can highlight to scroll card into view
│ In Session                      │
└────────────────────────────────┘

Display: Flex
Gap: 8px
Align-items: Center
Justify-content: Space-between

Status Dot Variations:
- 🟢 Green (#22c55e) + Pulse animation = Currently in session
- 🟡 Orange (#f59e0b) + No animation = Available
- 🟠 Purple (#8b5cf6) + No animation = Between appointments (not used in current version)
- 🔴 Red (#ef4444) + No animation = On break/lunch

Status Label Options:
- "In Session" (green variant)
- "Available" (orange variant)
- "On Break" (red variant)

Icon Options:
- bi-play-circle-fill (green, for "In Session")
- bi-dash-circle (orange, for "Available")
- bi-pause-circle-fill (red, for "On Break")
```

### 5. Appointment Cards

```
┌──────────────────────────────────────────────────────┐
│ Dr. Kelly MANSELL    🟢 IN SESSION                  │ Header
├──────────────────────────────────────────────────────┤ Divider
│ Time  │ Availability │ Duration │ Slot Type         │ Table Header
├───────┼──────────────┼──────────┼───────────────────┤
│ 11:30 │  🔴 Blocked  │   30m    │ Admin             │ Row 1
│ 12:00 │  🔴 Blocked  │   30m    │ Admin             │ Row 2
│ 12:30 │  🔴 Blocked  │   30m    │ Lunch Break       │ Row 3
└──────────────────────────────────────────────────────┘

Card Dimensions:
- Width: 360px minimum
- Max-width: 400px
- Padding: 20px
- Border-radius: 12px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.08)
- Border-left: 4px solid #3b82f6 (or #22c55e if current)

Current Appointment Card:
- Border-left-color: #22c55e (green)
- Background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)

Break Appointment Card:
- Border-left-color: #f59e0b (orange)
- Background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)

Header Layout:
- Display: Flex
- Justify-content: Space-between
- Align-items: Center
- Padding-bottom: 12px
- Border-bottom: 2px solid #e0e0e0

Status Badge (Header):
- Background: #22c55e or #ef4444 (depending on status)
- Color: white
- Padding: 4px 10px
- Border-radius: 20px
- Font-size: 11px
- Font-weight: 700
- Animation: pulse 2s ease-in-out infinite (if active)
- Display: Flex
- Align-items: Center
- Gap: 6px

Table Header:
- Font-size: 12px
- Font-weight: 700
- Color: #64748b
- Text-transform: uppercase
- Letter-spacing: 0.3px
- Border-bottom: 2px solid #e0e0e0

Table Rows:
- Font-size: 0.85rem (13.6px)
- Padding: 10px
- Border-bottom: 1px solid #e0e0e0
- Background: transparent (or #f0fdf4 if current appointment)

Availability Badge:
- Display: inline-block
- Padding: 4px 8px
- Border-radius: 4px
- Font-size: 0.75rem (12px)
- Font-weight: 600

Badge Colors:
- Booked: background #fee2e2, color #dc2626 (red)
- Available: background #dcfce7, color #22c55e (green)
- Other: background #f1f5f9, color #64748b (grey)
```

### 6. Grid Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Split-View Grid:                                            │
│                                                             │
│ display: grid                                               │
│ grid-template-columns: 280px 1fr                            │
│ gap: 20px                                                   │
│                                                             │
│ Left Column: 280px (fixed width)                            │
│ - Clinician pills list                                      │
│ - Scrollable (max-height 600px)                             │
│ - Sticky header optional                                    │
│                                                             │
│ Right Column: 1fr (flexible)                                │
│                                                             │
│   Appointment Cards Grid:                                   │
│   display: grid                                             │
│   grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))
│   gap: 16px                                                 │
│   min-height: 400px                                         │
│                                                             │
│   Cards fill available space responsively                   │
│   - Desktop (1920px): 4+ columns                            │
│   - Laptop (1366px): 2-3 columns                            │
│   - Tablet (768px): 1-2 columns                             │
│   - Mobile (375px): 1 column                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Reference

### Hero Banner
```
Background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)
Text: #ffffff (white)
Metric boxes: rgba(255, 255, 255, 0.08)
Metric borders: rgba(255, 255, 255, 0.1)
Metric numbers: #22c55e, #3b82f6, #f59e0b, #ffffff
Metric labels: #cbd5e1
```

### Filter Buttons
```
Active:
  Border: #2563eb
  Background: #eff6ff
  Text: #2563eb

Inactive:
  Border: #e0e0e0
  Background: #ffffff
  Text: #64748b

Hover:
  Shadow: 0 2px 8px rgba(0,0,0,0.1)
```

### Clinician Pills
```
Current (Green):
  Background: #f0fdf4
  Border: #22c55e
  Text: #16a34a
  Dot: #22c55e (animated pulse)

Available (Orange):
  Background: #fffbeb
  Border: #f59e0b
  Text: #b45309
  Dot: #f59e0b

On Break (Red):
  Background: #fef2f2
  Border: #ef4444
  Text: #991b1b
  Dot: #ef4444
```

### Cards
```
Current (In Session):
  Background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)
  Border-left: 4px solid #22c55e
  Status badge: background #22c55e, color white

Regular:
  Background: #ffffff
  Border-left: 4px solid #3b82f6

Break:
  Background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)
  Border-left: 4px solid #f59e0b
  Status badge: background #ef4444, color white
```

### Tables
```
Header:
  Background: transparent
  Text: #64748b
  Border-bottom: 2px solid #e0e0e0

Current row:
  Background: #f0fdf4
  Border-bottom: 1px solid #e0e0e0

Availability badges:
  Booked: #fee2e2 bg, #dc2626 text
  Available: #dcfce7 bg, #22c55e text
  Other: #f1f5f9 bg, #64748b text
```

---

## Animation Specifications

### Pulse Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

Applied to:
- LIVE badge indicator
- Status dot on in-session pills
- Status badge on in-session cards

Duration: 2s
Timing: ease-in-out
Iteration: infinite
```

### Pulse Dot Animation
```css
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

Applied to:
- Status dots on in-session pills

Duration: 2s
Timing: ease-in-out
Iteration: infinite
```

### Hover Effects
```css
Filter buttons:
  Transition: all 0.2s ease
  transform: translateY(-1px)
  box-shadow: 0 2px 8px rgba(0,0,0,0.1)

Clinician pills:
  Transition: all 0.2s ease
  transform: translateX(4px)
  background: lighter variant
  border-color: darker variant

Cards:
  Transition: all 0.3s ease
  box-shadow: 0 4px 16px rgba(0,0,0,0.12)
  transform: translateY(-2px)
```

---

## Responsive Breakpoints

### Desktop (1920px+)
- Hero: Full width with 4 columns
- Sidebar: 280px fixed
- Cards: 4+ columns visible
- Optimal experience

### Laptop (1366px)
- Hero: Full width
- Sidebar: 280px fixed
- Cards: 2-3 columns visible
- Good experience

### Tablet (768px)
- Hero: Metrics may stack
- Sidebar: May become toggleable
- Cards: 1-2 columns
- Adequate experience

### Mobile (375px)
- Hero: Stacked metrics
- Sidebar: May be hidden/collapsed
- Cards: Single column full width
- Functional experience

---

## Accessibility Notes

### Color Contrast
- All text meets WCAG AA standards
- Important info not conveyed by color alone
- Status labels accompany colored dots/badges
- Icons have semantic meaning

### Keyboard Navigation
- Tab to cycle through filter buttons
- Tab to cycle through pills (future enhancement)
- Enter/Space to activate buttons
- All interactive elements accessible

### Screen Reader
- Semantic HTML (buttons, sections)
- Labels on all interactive elements
- Status updates announced
- No redundant aria labels

### Touch-Friendly
- Buttons minimum 44×44 px
- Pills minimum 36px height
- Adequate spacing between interactive elements
- No hover-only information

---

## Typography Scale

```
Hero Title: 32px, 800 weight, #ffffff
Subtitle: 14px, 400 weight, #cbd5e1

Card Title: 18px, 700 weight, #0f172a
Table Header: 12px, 700 weight, #64748b, uppercase
Table Data: 13px, 600 weight (time), 400 (other), #0f172a
Labels: 12px, 600 weight, #64748b
Status: 11px, 700 weight
Timestamp: 11px, 400 weight, #cbd5e1
```

---

**Reference Complete** ✨

This visual reference guide covers all layout, color, animation, and responsive design aspects of the Live View redesign.
