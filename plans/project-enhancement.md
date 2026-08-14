# UI/UX Design Prompt for AI Agent

Design a modern, professional web application for monitoring bird populations through environmental audio recordings.

The application is used by researchers, ecologists, conservation organizations, and environmental agencies to record bird sounds, upload audio files, visualize recording locations on a map, and analyze biodiversity over time.

The application is browser based and optimized for desktop and laptop use. It should feel like a professional GIS and environmental data platform rather than a consumer application.

## Selected Solution

shadcn/ui + Tailwind CSS

## Design Goals

The interface should communicate:

- Scientific accuracy
- Reliability
- Professionalism
- Simplicity
- Data driven decision making

Think of a combination of ArcGIS, GitHub, Linear, and Notion, with subtle natural colors instead of a dark industrial appearance.

## Overall Style

- Modern, clean, minimal interface
- Plenty of whitespace
- Card based layout
- Rounded corners (8 to 12px)
- Soft shadows
- Consistent spacing using an 8px grid
- Professional data visualization
- Fast and uncluttered workflow
- Responsive layout that works from 1280px to ultrawide monitors

Avoid:

- Cartoon illustrations
- Large gradients
- Glassmorphism
- Heavy skeuomorphism
- Consumer or social media aesthetics

## Color Palette

Primary:

- Forest Green

Secondary:

- Moss Green

Background:

- Warm White
- Light Beige
- Very Light Gray

Accent:

- Sky Blue for GPS and map features

Status Colors:

- Green for success
- Orange for warnings
- Red for errors
- Gray for inactive states

Use muted colors that remain readable outdoors.

## Typography

Use a clean sans serif font.

Examples:

- Inter
- Geist
- IBM Plex Sans

Maintain a clear visual hierarchy.

## Project architecture

Each information bound to a project, so that people can navigate between projects to project and compare different set of information. let people easily create and navigate between projects. A Project will contains, project name, assigned users (will be introduced later), description, target location, e.g.

## Layout

Use a desktop application layout with:

Top Navigation Bar

Contains:

- [x] Project selector
- [x] Notifications (empty-state shell only -- not wired up to a backend yet)
- [x] User profile (mock user, no auth yet)
- [x] Settings

Left Sidebar

Contains navigation:

- [x] Dashboard
- [x] Recordings
- [x] Interactive Map
- [x] Statistics
- [x] Projects
- [x] Settings (page exists, but is a placeholder -- no settings are wired up to a backend yet)

Main Content Area

- [x] Displays the currently selected module.

Right Side Context Panel

- [x] Optional details panel that updates based on the selected recording or map marker.

## Dashboard

The dashboard should immediately provide an overview of the current project.

Display cards for:

- [x] Total recordings in the selected project (not actually project-scoped yet -- shows all recordings regardless of the selected project)
- [ ] Recording hours (placeholder -- always shows "—", no duration field exists yet)
- [x] Active recording locations
- [x] Species detected
- [x] Estimated biodiversity index
- [ ] Upload success rate (placeholder -- always shows "—", failures aren't tracked yet)
- [x] Recent activity

Below the cards:

- [x] Interactive map
- [x] Weekly recording activity chart
- [x] Species distribution chart
- [x] Recent recordings table

## Interactive Map

The map is one of the primary features.

Requirements:

- [x] Large interactive map
- [x] Marker clustering
- [x] Zoom controls
- [x] Layer controls
- [x] Heatmap support
- [x] Satellite and terrain view
- [x] Filtering by date
- [x] Filtering by species
- [ ] Filtering by project (UI exists, but recordings aren't scoped to a project server-side yet -- non-default projects always show 0 results)

Clicking a marker opens a side panel showing:

- [x] Recording information
- [x] Timestamp
- [x] GPS coordinates
- [x] AI detection summary
- [x] Species detected
- [x] Confidence score
- [ ] Notes (disabled placeholder field -- no notes column exists yet)

## Recordings Page

Display recordings in both:

- [x] Table view
- [x] Card view

Each recording includes:

- [x] Name
- [x] Date
- [ ] Duration (no duration field exists yet)
- [x] GPS location
- [ ] Upload status (hardcoded "Uploaded" badge on every row, not derived from a real field)
- [ ] AI status (hardcoded "Analyzed" badge on every row, not derived from a real field)
- [x] Species count
- [ ] Recording quality (placeholder -- always "Not assessed", no field exists yet)
- [ ] Tags (placeholder -- always "None" in the detail panel, no field exists yet)

Actions:

- [ ] Open on map (not implemented)
- [x] View details

## Upload Experience

Support:

- [x] Drag and drop upload
- [x] Upload progress
- [x] Failed upload recovery

Progress should be clearly visible.

## AI Analysis

Each processed recording should display:

- [x] Species detected
- [x] Confidence
- [x] Number of calls
- [ ] Recording quality (placeholder -- always "Not assessed")
- [ ] Background noise level (not implemented -- unused placeholder constant only)
- [x] Detection timeline (only available for a recording still in memory from the current upload/record session -- audio isn't persisted, so historical recordings can't show one)
- [ ] AI generated summary (not implemented)

Use charts instead of long text whenever possible.

## Statistics

Create an analytics page containing:

- [x] Species trends over time (mock data -- not computed from real detections yet)
- [x] Recordings by location
- [x] Biodiversity heatmaps (mock data -- hardcoded sample locations, not derived from real detections)
- [x] Seasonal comparisons (mock data -- hardcoded year-over-year numbers)
- [x] Recording frequency
- [ ] Upload statistics (placeholder -- always shows "—", failures aren't tracked yet)
- [x] Interactive filters

Charts should be clean, modern, and interactive.

## Audio Player (no audio stored in the database yet)

The audio player should include (all only available for a recording still in memory from the current upload/record session -- historical recordings show a disabled placeholder player):

- [x] Waveform visualization
- [x] Play and pause
- [x] Playback speed
- [x] Zoomable waveform
- [x] Timestamp markers
- [x] AI detection markers
- [x] Download button

## Empty States

Design informative empty states.

Examples:

- [x] "No recordings available."
- [x] "Upload your first audio recording."
- [x] "Select a map location to begin."

Avoid playful illustrations.

Use clean scientific graphics.

## Loading States

- [x] Prefer skeleton loading over spinners.
- [ ] Use progressive rendering for maps and tables. (not implemented -- full dataset renders at once, no chunking/virtualization)

## Animations

Animations should be subtle.

Examples:

- [ ] Sidebar transitions (only a color transition on hover/active nav items -- no collapse/expand animation)
- [x] Map marker animations (default cluster animation from `react-leaflet-cluster`; no custom marker-select animation)
- [ ] Smooth filtering (map/table filters re-render instantly, no transition)
- [x] Card hover effects
- [x] Upload progress
- [ ] Table sorting (not implemented -- tables aren't sortable yet)
- [ ] Expandable detail panels (context panel mounts/unmounts instantly, no slide/expand transition)

Animations should enhance usability without becoming distracting.

## Components

Use reusable components including:

- [x] Cards
- [x] Tables
- [x] Interactive charts
- [ ] Tree views (not implemented)
- [ ] Filter chips (filtering exists, but via selects/popovers/checkboxes, not a chip UI)
- [x] Badges
- [x] Progress indicators
- [ ] Context menus (only click-triggered dropdown menus exist, no right-click context menu)
- [ ] Breadcrumbs (primitive component exists but isn't used on any page yet)
- [x] Split panels
- [x] Resizable panels
- [x] Modal dialogs

## Overall Impression

The application should feel like enterprise scientific software used daily by environmental professionals. It should emphasize data quality, geographic exploration, and efficient workflows while maintaining a calm, modern aesthetic inspired by nature.

Avoid making it look like a music player, consumer bird watching app, or generic file manager. Instead, it should resemble a professional environmental intelligence platform where maps, recordings, analytics, and AI insights work together seamlessly.
