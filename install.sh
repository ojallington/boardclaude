#!/usr/bin/env bash
set -euo pipefail

# BoardClaude Installer
# Copies plugin files into the target project directory.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-.}"

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo "Error: Target directory '$1' does not exist."
  exit 1
}

DIRS=(".claude-plugin" "agents" "commands" "skills" "panels" "hooks")

echo "BoardClaude Installer"
echo "====================="
echo "Source:  $SCRIPT_DIR"
echo "Target:  $TARGET_DIR"
echo ""

# Check that source dirs exist
for dir in "${DIRS[@]}"; do
  if [ ! -d "$SCRIPT_DIR/$dir" ]; then
    echo "Error: Missing source directory '$dir'. Are you running from the BoardClaude repo root?"
    exit 1
  fi
done

# Copy each directory
for dir in "${DIRS[@]}"; do
  if [ -d "$TARGET_DIR/$dir" ]; then
    echo "  Updating $dir/ ..."
  else
    echo "  Installing $dir/ ..."
  fi
  cp -r "$SCRIPT_DIR/$dir" "$TARGET_DIR/"
done

echo ""
echo "Done! BoardClaude installed to $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. Run: /bc:init"
echo "  3. Run: /bc:audit"
