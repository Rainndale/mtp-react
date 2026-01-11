# Voyager Deployment Guide (XAMPP)

This guide provides step-by-step instructions for deploying the **Voyager Trip Planner** application on a local **XAMPP** server.

## Prerequisites

1.  **XAMPP Installed:** Ensure you have XAMPP installed on your computer.
    *   [Download XAMPP](https://www.apachefriends.org/download.html)

## Deployment Steps

### 1. Copy Files

1.  Locate the `htdocs` folder in your XAMPP installation directory.
    *   **Windows:** Usually `C:\xampp\htdocs`
    *   **macOS:** Usually `/Applications/XAMPP/xamppfiles/htdocs`
    *   **Linux:** Usually `/opt/lampp/htdocs`
2.  Create a new folder inside `htdocs` named `voyager` (or any name you prefer).
3.  Copy all contents from the `dist` folder (extracted from `voyager-app.zip`) into this new `voyager` folder.

### 2. Accessing the App

*   Start the **Apache** module in the XAMPP Control Panel.
*   Open your web browser and navigate to:
    `http://localhost/voyager`

## Enabling PWA (HTTPS Required)

To install the app as a Progressive Web App (PWA) on your mobile device or desktop, the site must be served over **HTTPS**. XAMPP is not configured for HTTPS by default.

### Windows (Simplest Method)

1.  Open the **XAMPP Control Panel**.
2.  Stop Apache if it is running.
3.  Click **Config** > **Apache (httpd-ssl.conf)**.
4.  Find the `<VirtualHost _default_:443>` section.
5.  Ensure `DocumentRoot` points to your htdocs folder and `ServerName` is `localhost:443`.
6.  You may need to generate a self-signed certificate or use the default `server.crt` and `server.key` provided by XAMPP in the `apache/conf/ssl.crt` and `apache/conf/ssl.key` directories.

### Creating a Self-Signed Certificate (for Mobile Access)

To access the app from your phone (e.g., `https://<YOUR_PC_IP>/voyager`), you need a certificate trusted by your device, or you must bypass security warnings.

1.  Find your computer's local IP address (e.g., `192.168.1.50`).
    *   **Windows:** Open Command Prompt (`cmd`) and type `ipconfig`.
    *   **Mac/Linux:** Open Terminal and type `ifconfig` or `ip a`.
2.  On your phone, navigate to `https://<YOUR_IP>/voyager`.
3.  Accept the security warning ("Advanced" -> "Proceed to...").
4.  Once loaded, you should see the "Install" prompt or look for "Add to Home Screen" in your browser menu.

## Troubleshooting

*   **White Screen:** Ensure you copied the *contents* of the `dist` folder, not the `dist` folder itself, into your `voyager` directory. The `index.html` should be at `htdocs/voyager/index.html`.
*   **Routing Errors:** This app uses hash-based routing or relative paths, so refreshing on sub-pages should work. If you encounter issues, navigate back to the root `index.html`.
