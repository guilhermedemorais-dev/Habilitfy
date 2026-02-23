# Hostinger MySQL Setup for HabilitFy

This document explains how to configure and connect to the Hostinger MySQL database from both local development and production environments.

## Current Configuration Status

Use a local-only file (`.env.production`) created from `.env.production.example`.  
Do not commit production credentials to Git.

### 1. Production Deployment (On Hostinger)
**This configuration is likely CORRECT** if:
- Your Node.js application is running on the *same* Hostinger shared hosting account as the database.
- Hostinger's internal network routes `127.0.0.1` to the local MySQL instance.

**Action:** Deploy the application and check logs. If it fails, you may need to use “localhost” or the specific private IP provided in hPanel.

### 2. Local Development (Your Machine)
**This configuration currently FAILS** because:
- `127.0.0.1` points to your *local* machine's MySQL, not Hostinger's.
- Connecting directly to the remote IP (`147.79.105.92`) times out due to firewall restrictions.

#### Option A: SSH Tunnel (Recommended)
This allows you to use `127.0.0.1` locally, matching your production config.

1.  **Enable SSH Access** in Hostinger hPanel > Advanced > SSH Access.
2.  **Open a Terminal** and run:
    ```bash
    ssh -L 3306:127.0.0.1:3306 -N u540864618@147.79.105.92
    # Replace u540864618 with your SSH username and 147.79.105.92 with your SSH host/IP
    ```
    *(You will need your SSH password)*
3.  **Keep this terminal open.**
4.  Run your local test:
    ```bash
    node --env-file=.env.production test-db.cjs
    ```

#### Option B: Remote MySQL Access (Direct)
1.  **Get your Local IP**: Search "what is my ip" on Google.
2.  **Whitelist IP in hPanel**: Go to Databases > Remote MySQL. Add your public IP.
3.  **Update `.env.production`** (for local use ONLY):
    ```env
    DB_HOST=<hostinger-mysql-host>
    DATABASE_URL=mysql://<user>:<password>@<hostinger-mysql-host>:3306/<database>
    ```
