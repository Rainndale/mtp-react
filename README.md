# Voyager | Premium Trip Planner

Voyager is a premium, offline-capable trip planning application built with React and Vite. It allows users to create itineraries, manage daily plans, and visualize their trips with a beautiful, responsive interface.

## Features

-   **Trip Management**: Create and manage multiple trips.
-   **Itinerary Planning**: Drag-and-drop interface to organize plans by day.
-   **Offline Support**: Fully functional PWA (Progressive Web App) that works offline.
-   **Responsive Design**: optimized for both desktop and mobile devices.
-   **Local Storage**: All data is persisted locally in your browser.

## Tech Stack

-   **Framework**: [React](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
-   **Icons**: [FontAwesome](https://fontawesome.com/)

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/mtp-react.git
    cd mtp-react
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

### Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment

This project is configured to deploy to **GitHub Pages** automatically using GitHub Actions.

1.  Push your code to the `main` or `master` branch.
2.  Ensure your GitHub repository settings under **Settings > Pages** has **Source** set to **GitHub Actions**.
3.  The workflow defined in `.github/workflows/deploy.yml` will trigger and deploy the app to `https://<your-username>.github.io/mtp-react/`.

**Note**: If you change the repository name, update the `base` property in `vite.config.js` to match your new repository name (e.g., `/new-repo-name/`).
