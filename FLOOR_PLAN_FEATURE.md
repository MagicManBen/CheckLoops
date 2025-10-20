# Floor Plan Feature - Complete Implementation ✅

## Overview
A visual floor plan editor that allows users to position clinician cards on a canvas to match their surgery's physical layout. Users can also draw rooms and corridors to create a complete floor map.

## Features Implemented

### 1. **Navigation**
- ✅ Added "Floor Plan" button to main navigation with grid icon
- ✅ Integrated with existing page routing system

### 2. **Drawing Tools**
Four interactive tools for managing the floor plan:

#### **Select Mode** (Default)
- Drag and drop clinician cards to position them anywhere on the canvas
- Cards snap to mouse position and are constrained within canvas bounds
- Visual feedback: cards show grabbing cursor and shadow effects

#### **Room Mode**
- Click and drag to draw rectangular rooms
- Preview shown while drawing (semi-transparent blue rectangle)
- Minimum size requirement (20x20px) prevents accidental tiny shapes
- Rooms displayed with blue border and light blue background

#### **Corridor Mode**
- Click and drag to draw corridor shapes (narrow rectangles)
- Preview shown while drawing (semi-transparent grey rectangle)
- Corridors displayed with grey border and light grey background
- Perfect for connecting rooms and showing hallways

#### **Delete Mode**
- Click on any shape (room or corridor) to remove it
- Shapes highlight in red on hover when in delete mode
- Clinician cards cannot be deleted (only repositioned)

### 3. **Clinician Cards**
Auto-generated cards showing:
- Clinician name (from "Full Name of the Session Holder of the Session")
- Number of appointments for today
- Filtered list (excludes "Unknown" and "FED, GP (Ms)")
- Standard size: 180px × 120px for consistent layout

Initial Layout:
- Cards arranged in a 4-column grid by default
- 20px spacing between cards
- Starting position: 20px from top-left

Card Features:
- White background with blue left border
- Drop shadow for depth
- Hover effect (enhanced shadow)
- Draggable in Select mode
- Smooth animations

### 4. **Canvas**
- Fixed size: 100% width × 600px height
- Light grey background (#f8fafc)
- Dashed border for clear boundaries
- Two layers:
  - **Shapes layer** (bottom): Rooms and corridors
  - **Cards layer** (top): Draggable clinician cards

### 5. **Optional Grid**
- Toggle grid overlay with "Toggle Grid" button
- 20px × 20px grid pattern
- Semi-transparent (#e2e8f0 at 50% opacity)
- Helps with alignment and spacing
- Does not affect functionality (visual aid only)

### 6. **Save & Load**
**Save Function:**
- Stores complete layout in browser localStorage
- Saves card positions (x, y coordinates)
- Saves all shapes (rooms and corridors) with dimensions
- Timestamp included for tracking

**Load Function:**
- Automatically loads saved layout when page opens
- Falls back to fresh card generation if no saved layout
- Fresh generation queries today's appointments from Supabase

**Reset Function:**
- Confirmation dialog before clearing
- Removes all shapes
- Resets cards to default grid positions
- Clears localStorage

### 7. **Visual Feedback**
- Active tool button highlighted in blue
- Cursor changes based on selected tool:
  - Select: default pointer
  - Room/Corridor: crosshair
  - Delete: not-allowed cursor
- Cards show grabbing/grabbed cursor states
- Shapes preview while drawing
- Hover effects on all interactive elements

## Technical Implementation

### Data Structure
```javascript
floorPlanState = {
  currentTool: 'select',      // Current tool selection
  shapes: [                    // Array of drawn shapes
    {
      type: 'room' | 'corridor',
      x: number,
      y: number,
      width: number,
      height: number
    }
  ],
  cards: [                     // Array of clinician cards
    {
      id: string,
      clinician: string,
      appointments: number,
      x: number,
      y: number
    }
  ],
  isDragging: boolean,
  draggedCard: number | null,
  isDrawing: boolean,
  drawStart: { x, y } | null,
  gridEnabled: boolean
}
```

### Storage Format (localStorage)
```javascript
{
  shapes: [...],
  cards: [...],
  savedAt: ISO timestamp
}
```

### Key Functions
- `initFloorPlan()` - Initialize the page and load layout
- `selectTool(tool)` - Switch between drawing tools
- `createFreshCards()` - Query Supabase and generate cards
- `renderShapes()` - Render all rooms/corridors
- `renderCards()` - Render all clinician cards
- `startDragCard()` - Handle card dragging
- `handleCanvasMouseDown/Move/Up()` - Handle shape drawing
- `saveFloorPlan()` - Save to localStorage
- `resetFloorPlan()` - Clear and regenerate

## Usage Instructions

### Creating Your Floor Plan
1. Navigate to "Floor Plan" from the main menu
2. Cards automatically load with today's clinicians
3. Use **Select** tool to drag cards to room locations
4. Switch to **Room** tool and draw rectangles for consultation rooms
5. Switch to **Corridor** tool and draw hallways/connecting spaces
6. Click **Save Layout** to store your configuration
7. Use **Delete** tool to remove any shapes you don't want

### Best Practices
- Enable grid for easier alignment
- Draw rooms first, then position cards
- Use corridors to show traffic flow
- Save frequently (changes aren't auto-saved)
- Cards automatically update with today's appointments

## Files Modified
- `/Users/benhoward/Desktop/CheckLoop/checkloops/emis_reporting.html`
  - Added navigation button (line ~1126)
  - Added Floor Plan page HTML (line ~1441-1514)
  - Added Floor Plan CSS (line ~1073-1146)
  - Added Floor Plan JavaScript (line ~2720-3065)
  - Updated showPage() to call initFloorPlan() (line ~2224)

## Future Enhancements (Optional)
- 🔲 Save layouts to Supabase instead of localStorage (multi-device sync)
- 🔲 Add text labels to rooms
- 🔲 Color-code cards by current status (current/upcoming/past)
- 🔲 Add room names from Supabase Rooms table
- 🔲 Export floor plan as image/PDF
- 🔲 Multiple floor plan templates (save different layouts)
- 🔲 Auto-arrange cards feature (optimize positioning)
- 🔲 Zoom and pan for larger floor plans
- 🔲 Real-time updates (cards update as appointments change)

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses ES6+ features (Map, arrow functions, etc.)
- localStorage required for save/load
