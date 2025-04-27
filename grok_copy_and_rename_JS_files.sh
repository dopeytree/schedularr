#!/bin/bash

# Set the source and destination directories
SRC_DIR="/Users/ed/Downloads/Grandad Care Scheduler/Schedularr/src"
DEST_DIR="/Users/ed/Downloads/Grandad Care Scheduler/Schedularr/grok"
LOG_FILE="$DEST_DIR/script_log.txt"

# Create the destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Function to log messages
echo_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
    echo "$1"
}

# Log script start
echo_log "Starting script execution."

echo_log "Command: cp \"$SRC_DIR\"/*.js \"$DEST_DIR\""
# Copy all .js files from source to destination
cp "$SRC_DIR"/*.js "$DEST_DIR" 2>/dev/null || echo_log "No .js files found in source directory or directory is empty."
if [ $? -eq 0 ]; then
    echo_log "Copy operation successful."
else
    echo_log "Copy operation failed."
fi

echo_log "Command: cd \"$DEST_DIR\""
# Navigate to the destination directory
cd "$DEST_DIR"
if [ $? -eq 0 ]; then
    echo_log "Changed directory to $DEST_DIR."
else
    echo_log "Failed to change directory to $DEST_DIR."
fi

# Rename all .js files to .jsx
echo_log "Starting rename operation for .js to .jsx files."
for file in *.js; do
    if [ -f "$file" ]; then
        echo_log "Command: mv \"$file\" \"${file%.js}.jsx\""
        mv "$file" "${file%.js}.jsx"
        if [ $? -eq 0 ]; then
            echo_log "Renamed $file to ${file%.js}.jsx"
        else
            echo_log "Failed to rename $file"
        fi
    fi
done

echo_log "Script execution completed."
