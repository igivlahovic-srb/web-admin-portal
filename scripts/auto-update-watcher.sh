#!/bin/bash

# Auto-update watcher script for Web Admin
# This script monitors for update completion and restarts the application

RESTART_FLAG="/tmp/web-admin-restart-required"
PM2_APP_NAME="water-service-web-admin"
APP_DIR="/home/itserbia/web-admin"

echo "Web Admin auto-update watcher started..."

while true; do
  # Check if restart flag exists
  if [ -f "$RESTART_FLAG" ]; then
    echo "Update detected! Restarting application..."

    # Remove the flag file
    rm "$RESTART_FLAG"

    # Change to app directory
    cd "$APP_DIR" || exit 1

    # Restart using PM2 if available
    if command -v pm2 &> /dev/null; then
      echo "Restarting with PM2..."
      pm2 restart "$PM2_APP_NAME" || pm2 start npm --name "$PM2_APP_NAME" -- run start
    else
      # If using systemd
      if systemctl is-active --quiet web-admin; then
        echo "Restarting with systemd..."
        sudo systemctl restart web-admin
      else
        echo "No process manager found. Please restart manually."
      fi
    fi

    echo "Application restarted successfully!"
  fi

  # Check every 5 seconds
  sleep 5
done
