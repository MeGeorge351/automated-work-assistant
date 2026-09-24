# Calm interface and hourly motivation

## Changes
- Add a centered motivational bubble shared across all three tools.
- Show it once after the first hour of an open session, then every hour, with a clear dismiss control.
- Rotate through concise professional encouragement messages.
- Refresh the existing design tokens with calm blue, teal, and soft green hues while preserving readability and the current light enterprise layout.
- Make the overlay comfortable on both narrow and wide screens, with reduced-motion support.

## Technical details
- Keep timer state inside the shared app layout and clean up the interval when the layout unmounts.
- Use the existing semantic color system and shared button component patterns.
- Verify the app builds and visually check the active Task Planner screen.
