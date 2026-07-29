#!/usr/bin/env bash
set -e

# 1. Switch or create feature branch
BRANCH_NAME="feat/donation-idempotency-key"

echo "Checking out branch $BRANCH_NAME..."
git checkout "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME"

# 2. Stage all changes
echo "Staging files..."
git add .

# 3. Commit changes
echo "Committing..."
git commit -m "feat: implement donation idempotency key" || echo "Nothing new to commit."

# 4. Push to origin
echo "Pushing to GitHub..."
git push -u origin "$BRANCH_NAME"

echo "Done! Task 908 branch is ready and pushed."
