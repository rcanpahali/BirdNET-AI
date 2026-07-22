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

- Project selector
- Notifications
- User profile
- Settings

Left Sidebar

Contains navigation:

- Dashboard
- Recordings (They are not stored in the database yet)
- Interactive Map
- Statistics
- Projects
- Settings (Just a button for now)

Main Content Area

Displays the currently selected module.

Right Side Context Panel

Optional details panel that updates based on the selected recording or map marker.

## Dashboard

The dashboard should immediately provide an overview of the current project.

Display cards for:

- Total recordings in the selected project
- Recording hours
- Active recording locations
- Species detected
- Estimated biodiversity index
- Upload success rate
- Recent activity

Below the cards:

- Interactive map
- Weekly recording activity chart
- Species distribution chart
- Recent recordings table

## Interactive Map

The map is one of the primary features.

Requirements:

- Large interactive map
- Marker clustering
- Zoom controls
- Layer controls
- Heatmap support
- Satellite and terrain view
- Filtering by date
- Filtering by species
- Filtering by project

Clicking a marker opens a side panel showing:

- Recording information
- Timestamp
- GPS coordinates
- AI detection summary
- Species detected
- Confidence score
- Notes

## Recordings Page

Display recordings in both:

- Table view
- Card view

Each recording includes:

- Name
- Date
- Duration
- GPS location
- Upload status
- AI status
- Species count
- Recording quality
- Tags

Actions:

- Open on map
- View details

## Upload Experience

Support:

- Drag and drop upload
- Upload progress
- Failed upload recovery

Progress should be clearly visible.

## AI Analysis

Each processed recording should display:

- Species detected
- Confidence
- Number of calls
- Recording quality
- Background noise level
- Detection timeline
- AI generated summary

Use charts instead of long text whenever possible.

## Statistics

Create an analytics page containing:

- Species trends over time
- Recordings by location
- Biodiversity heatmaps
- Seasonal comparisons
- Recording frequency
- Upload statistics
- Interactive filters

Charts should be clean, modern, and interactive.

## Audio Player (no audio stored in the database yet)

The audio player should include:

- Waveform visualization
- Play and pause
- Playback speed
- Zoomable waveform
- Timestamp markers
- AI detection markers
- Download button

## Empty States

Design informative empty states.

Examples:

"No recordings available."

"Upload your first audio recording."

"Select a map location to begin."

Avoid playful illustrations.

Use clean scientific graphics.

## Loading States

Prefer skeleton loading over spinners.

Use progressive rendering for maps and tables.

## Animations

Animations should be subtle.

Examples:

- Sidebar transitions
- Map marker animations
- Smooth filtering
- Card hover effects
- Upload progress
- Table sorting
- Expandable detail panels

Animations should enhance usability without becoming distracting.

## Components

Use reusable components including:

- Cards
- Tables
- Interactive charts
- Tree views
- Filter chips
- Badges
- Progress indicators
- Context menus
- Breadcrumbs
- Split panels
- Resizable panels
- Modal dialogs

## Overall Impression

The application should feel like enterprise scientific software used daily by environmental professionals. It should emphasize data quality, geographic exploration, and efficient workflows while maintaining a calm, modern aesthetic inspired by nature.

Avoid making it look like a music player, consumer bird watching app, or generic file manager. Instead, it should resemble a professional environmental intelligence platform where maps, recordings, analytics, and AI insights work together seamlessly.
