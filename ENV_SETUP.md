# Environment Variables Setup Guide

This project requires API keys for OpenAI and/or Anthropic to use the smart layout transformer. Here are your options for managing these securely:

## 🚀 Quick Setup

```bash
# Run the setup script
pnpm run dev:setup
```

## Option 1: Vercel CLI (Recommended for Vercel projects)

If your project is deployed on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables from Vercel
cd client && vercel env pull .env.local && cd ..

# Start development
pnpm dev
```

## Option 2: 1Password CLI Integration

If you use 1Password:

```bash
# Install 1Password CLI
# https://developer.1password.com/docs/cli/get-started

# Store your API keys in 1Password, then:
op read "op://Private/OpenAI API Key/credential" | VITE_OPENAI_API_KEY=$(cat) \
op read "op://Private/Anthropic API Key/credential" | VITE_ANTHROPIC_API_KEY=$(cat) \
echo "VITE_LLM_PROVIDER=openai" > client/.env.local

# Or create a script to populate .env.local from 1Password
```

## Option 3: Manual Setup

```bash
# Copy the example file
cp client/.env.example client/.env.local

# Edit the file with your API keys
nano client/.env.local
```

Required variables:

```env
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_LLM_PROVIDER=openai
```

## Option 4: direnv (Automatic environment loading)

Install direnv for automatic environment loading:

```bash
# Install direnv
brew install direnv

# Add to your shell profile
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Create .envrc file
echo 'dotenv client/.env.local' > .envrc

# Allow the configuration
direnv allow
```

## Option 5: Docker Secrets (for containerized deployments)

```bash
# Use Docker secrets for production
docker secret create openai_key your_api_key
docker secret create anthropic_key your_api_key
```

## Automated Setup Script

The project includes `scripts/setup-env.sh` which:

- Creates `.env.local` from template
- Checks for Vercel CLI and offers to pull env vars
- Checks for 1Password CLI
- Provides manual setup instructions

## Security Best Practices

1. ✅ Never commit `.env.local` files
2. ✅ Use different API keys for development/production
3. ✅ Rotate API keys regularly
4. ✅ Use environment-specific configurations
5. ✅ Store secrets in secure vaults (1Password, Vercel, etc.)

## Troubleshooting

**Environment variables not loading?**

- Check `client/.env.local` exists
- Ensure variables start with `VITE_`
- Restart the dev server after changes

**API calls failing?**

- Verify API keys are valid
- Check network connectivity
- Review rate limits

## Development Workflow

```bash
# New machine setup
git clone <repo>
pnpm install
pnpm run dev:setup  # Runs environment setup
# Follow prompts to configure API keys
pnpm dev
```

This ensures environment variables are always available after pulling from remote locations.
