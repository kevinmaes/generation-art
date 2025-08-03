#!/bin/bash

# Environment Setup Script for Generation Art
# This script helps set up environment variables from various sources

set -e

echo "🔧 Setting up environment variables..."

# Create client/.env.local if it doesn't exist
ENV_FILE="client/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo "✅ $ENV_FILE already exists"
else
    echo "📝 Creating $ENV_FILE from template..."
    cp client/.env.example "$ENV_FILE"
    echo "⚠️  Please edit $ENV_FILE and add your API keys"
fi

# Option 1: Pull from Vercel (if vercel CLI is available)
if command -v vercel &> /dev/null; then
    echo "🌐 Vercel CLI found. You can pull environment variables with:"
    echo "   vercel env pull client/.env.local"
    read -p "Would you like to pull from Vercel now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd client && vercel env pull .env.local && cd ..
        echo "✅ Environment variables pulled from Vercel"
    fi
else
    echo "📦 To install Vercel CLI: npm i -g vercel"
    echo "   Then run: vercel env pull client/.env.local"
fi

# Option 2: 1Password CLI (if op CLI is available)
if command -v op &> /dev/null; then
    echo "🔐 1Password CLI found. You can retrieve secrets with:"
    echo "   op read 'op://vault/item/field' > client/.env.local"
    echo "   Or use the 1Password integration in your editor"
else
    echo "📦 To install 1Password CLI: https://developer.1password.com/docs/cli/get-started"
fi

# Option 3: Manual setup
echo ""
echo "🔑 Required environment variables:"
echo "   VITE_OPENAI_API_KEY=sk-..."
echo "   VITE_ANTHROPIC_API_KEY=sk-ant-..."
echo "   VITE_LLM_PROVIDER=openai (or anthropic)"
echo ""
echo "📝 Edit $ENV_FILE to add your API keys"

# Check if env vars are set
if [ -f "$ENV_FILE" ]; then
    if grep -q "your-.*-api-key-here" "$ENV_FILE"; then
        echo "⚠️  Remember to replace placeholder values in $ENV_FILE"
    else
        echo "✅ Environment file appears to be configured"
    fi
fi

echo "🚀 Run 'pnpm dev' to start the development server"