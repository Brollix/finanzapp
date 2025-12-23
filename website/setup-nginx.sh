#!/bin/bash

# Script to set up Nginx configuration on EC2
# This script will SSH into EC2 and configure Nginx for finanzapp.info

set -e  # Exit on error

echo "🔧 Setting up Nginx configuration on EC2..."

# Step 1: Check if repository exists on EC2
echo "📁 Checking if repository exists on EC2..."
if ! ssh aws "test -d ~/finanzapp"; then
    echo "❌ Repository not found at ~/finanzapp"
    echo "Please clone the repository first:"
    echo "  ssh aws 'cd ~ && git clone https://github.com/YOUR_USERNAME/finanzapp.git'"
    exit 1
fi
echo "✅ Repository exists"

# Step 2: Check if nginx is installed
echo "🔍 Checking if nginx is installed..."
if ! ssh aws "command -v nginx" &>/dev/null; then
    echo "📦 Nginx not found. Installing nginx..."
    echo "🔧 Fixing any broken dependencies first..."
    ssh aws "sudo apt --fix-broken install -y"
    echo "📦 Installing nginx..."
    ssh aws "sudo apt update && sudo apt install -y nginx"
    echo "✅ Nginx installed"
else
    echo "✅ Nginx is already installed"
fi

# Step 3: Verify nginx directories exist
echo "📂 Verifying nginx directories..."
ssh aws "sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled"

# Step 4: Copy nginx configuration
echo "📋 Copying nginx configuration..."
ssh aws "cd ~/finanzapp && sudo cp backend/aws-api/nginx/finanzapp.conf /etc/nginx/sites-available/finanzapp.info"

# Step 5: Create symlink (force to overwrite if exists)
echo "🔗 Creating symlink..."
ssh aws "sudo ln -sf /etc/nginx/sites-available/finanzapp.info /etc/nginx/sites-enabled/"

# Step 6: Remove default configuration (optional)
echo "🗑️  Removing default nginx configuration..."
ssh aws "sudo rm -f /etc/nginx/sites-enabled/default"

# Step 7: Test nginx configuration
echo "✅ Testing nginx configuration..."
if ssh aws "sudo nginx -t"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Step 8: Start nginx if not running
echo "🚀 Starting nginx service..."
ssh aws "sudo systemctl start nginx || true"
ssh aws "sudo systemctl enable nginx || true"

# Step 9: Reload nginx
echo "🔄 Reloading nginx..."
ssh aws "sudo systemctl reload nginx"

# Step 10: Verify nginx is running
echo "🔍 Verifying nginx status..."
ssh aws "sudo systemctl status nginx --no-pager | head -n 5"

echo "✅ Nginx configuration complete!"
echo ""
echo "Next steps:"
echo "1. Verify the site is accessible: curl http://finanzapp.info"
echo "2. Set up SSL with: ssh aws 'sudo certbot --nginx -d finanzapp.info -d www.finanzapp.info'"

