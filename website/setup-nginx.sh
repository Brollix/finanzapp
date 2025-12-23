#!/bin/bash

# Script to set up Nginx configuration on EC2
# This script will SSH into EC2 and configure Nginx for finanzapp.info

set -e  # Exit on error

echo "🔧 Setting up Nginx configuration on EC2..."

# Step 1: Check if repository exists on EC2
echo "📁 Checking if repository exists on EC2..."
ssh aws "test -d ~/finanzapp && echo 'Repository exists' || echo 'Repository not found'"

# Step 2: If repository doesn't exist, we'll need to clone it
# (This is a manual step - user should clone it first if needed)

# Step 3: Copy nginx configuration
echo "📋 Copying nginx configuration..."
ssh aws "cd ~/finanzapp && sudo cp backend/aws-api/nginx/finanzapp.conf /etc/nginx/sites-available/finanzapp.info"

# Step 4: Create symlink
echo "🔗 Creating symlink..."
ssh aws "sudo ln -sf /etc/nginx/sites-available/finanzapp.info /etc/nginx/sites-enabled/"

# Step 5: Remove default configuration (optional)
echo "🗑️  Removing default nginx configuration..."
ssh aws "sudo rm -f /etc/nginx/sites-enabled/default"

# Step 6: Test nginx configuration
echo "✅ Testing nginx configuration..."
ssh aws "sudo nginx -t"

# Step 7: Reload nginx
echo "🔄 Reloading nginx..."
ssh aws "sudo systemctl reload nginx"

echo "✅ Nginx configuration complete!"
echo ""
echo "Next steps:"
echo "1. Verify the site is accessible: curl http://finanzapp.info"
echo "2. Set up SSL with: ssh aws 'sudo certbot --nginx -d finanzapp.info -d www.finanzapp.info'"

