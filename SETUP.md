# Sounds Fishy - Setup Guide

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0+)
- MongoDB (local or cloud)

## Quick Start

### Option 1: Install MongoDB Locally (Recommended for Development)

**macOS:**
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongod --version
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Option 2: Use MongoDB Atlas (Free Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a free cluster (M0)
4. Get your connection string
5. Update `.env` file in `service/` directory:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sounds-fishy
   ```

## Installation

### Backend Setup

```bash
cd service

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env and set your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/sounds-fishy

# Start development server
bun run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd app

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start development server
bun run dev
```

Frontend will run on `http://localhost:3000`

## Testing

### Backend Tests
```bash
cd service
bun test
```

### Frontend Tests
```bash
cd app
bun test              # Component tests
bun run test:e2e      # E2E tests with Playwright
```

## Troubleshooting

### CORS Issues

If you get CORS errors in the browser console:

1. Make sure backend is running on port 3001
2. Check `service/.env` has correct `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=http://localhost:3000
   ```

3. Clear browser cache and hard refresh (Cmd+Shift+R)

### MongoDB Connection Errors

**Error: "MongoDB is not running or not installed"**

1. Check if MongoDB is running:
   ```bash
   pgrep -x mongod
   ```

2. If not running, start it:
   ```bash
   brew services start mongodb-community  # macOS
   sudo systemctl start mongod            # Linux
   ```

3. Or use MongoDB Atlas (see Option 2 above)

### Port Already in Use

**Error: "Port 3000/3001 is in use"**

Find and kill the process:
```bash
# Find process on port 3000
lsof -ti:3000 | xargs kill -9

# Find process on port 3001
lsof -ti:3001 | xargs kill -9
```

## Environment Variables

### Backend (service/.env)
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sounds-fishy

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Configuration (Optional - Phase 2)
# AI_API_KEY=sk-...
# AI_MODEL=gpt-3.5-turbo
# AI_BASE_URL=https://api.openai.com/v1
```

### Frontend (app/.env)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Development Workflow

1. **Start MongoDB** (if using local)
   ```bash
   brew services start mongodb-community
   ```

2. **Start Backend** (Terminal 1)
   ```bash
   cd service
   bun run dev
   ```

3. **Start Frontend** (Terminal 2)
   ```bash
   cd app
   bun run dev
   ```

4. **Open Browser**
   - Go to `http://localhost:3000`
   - Create a room or join existing

5. **Test Real-time Features**
   - Open multiple browser tabs
   - Join same room from different tabs
   - Watch real-time updates!

## Next Steps

After setup is complete:
- ✅ Phase 1: Lobby System (Complete)
- ⏳ Phase 2: Briefing & AI Integration
- ⏳ Phase 3: Game Flow
- ⏳ Phase 4: Elimination & Scoring
