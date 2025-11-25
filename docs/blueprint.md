# **App Name**: ApparelFlow

## Core Features:

- User Authentication and Roles: Secure user registration and login with role-based access control (admin, verified user, pending approval). Firebase Authentication is implemented with email/password.
- Admin Approval Workflow: Admin approval system for new user registrations, with notification badge for pending approvals in the navigation bar.
- Inventory CRUD Operations: Create, read, update, and delete clothing items in the inventory with real-time updates. Display data using React Table with filtering and sorting.
- Predefined Types Management: Admin panel to manage predefined clothing types and composition types, including adding, editing, and deleting entries.
- Dashboard Analytics: Visual representation of inventory data with charts and analytics, providing insights into stock levels, value, and other key metrics.
- Report Generation: Generate reports based on date ranges and export them to CSV/Excel formats for further analysis.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) for a professional and trustworthy feel.
- Background color: Very light indigo (#F0F2FA) to maintain a clean and modern look.
- Accent color: Teal (#009688) for interactive elements and highlights.
- Body and headline font: 'Inter' for a modern, machined, objective, neutral look. Note: currently only Google Fonts are supported.
- Use Material-UI icons for a consistent and recognizable user experience.
- Responsive layout with clear sections for navigation, content display, and user actions. Utilize Material-UI's Grid and container components.
- Subtle transitions and loading animations to provide visual feedback and improve the user experience. Use Material-UI's Fade and CircularProgress components.