# Sounds Fishy - Complete Setup Guide

## Prerequisites

- **Bun** (v1.0.0+) - [Install Guide](https://bun.sh/)
- **MongoDB** (v7.0+) - Local installation or cloud (MongoDB Atlas)
- **Git** - For version control

---

## 📦 MongoDB Setup

### Option 1: MongoDB Local Installation (Recommended for Development)

#### macOS

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB as a background service
brew services start mongodb-community

# Verify it's running
mongod --version

# Check service status
brew services list | grep mongodb

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community
```

**Configuration File Location:** `/opt/homebrew/etc/mongod.conf`
**Data Directory:** `/opt/homebrew/var/mongodb`
**Log Directory:** `/opt/homebrew/var/log/mongodb`

**Manual Start (foreground):**
```bash
mongod --config /opt/homebrew/etc/mongod.conf
```

#### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

#### Windows

1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer (MSI)
3. Choose "Complete" installation
4. Install as a Windows Service (recommended)
5. MongoDB runs automatically after installation

**Verify Installation:**
```powershell
# Open PowerShell
mongod --version
```

---

### Option 2: MongoDB Atlas (Free Cloud Database)

**Step-by-Step Setup:**

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for free account
   - Verify email address

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE** tier (M0 Sandbox)
   - Select cloud provider and region (choose closest to you)
   - Click "Create Cluster"

3. **Configure Access**
   
   **Database Access:**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password
   - Set user privileges to "Read and write to any database"
   - Click "Add User"
   
   **Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

4. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `sounds-fishy`

   **Example:**
   ```
   mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/sounds-fishy?retryWrites=true&w=majority
   ```

5. **Test Connection**
   ```bash
   # Install mongosh (MongoDB Shell)
   brew install mongodb/brew/mongodb-shell  # macOS
   
   # Connect
   mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sounds-fishy"
   ```

---

## 🔧 Backend Setup

### 1. Navigate to Service Directory

```bash
cd service
```

### 2. Install Dependencies

```bash
bun install
```

**Expected Output:**
```
bun install v1.0.0
+ @elysiajs/cors@1.0.0
+ elysia@1.0.0
+ mongoose@8.0.0
+ @types/bun@1.0.0
[1234] packages installed
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Minimum Configuration:**
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sounds-fishy
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sounds-fishy

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Optional AI Configuration (Phase 2):**
```bash
# AI Configuration (OpenAI-compatible)
AI_API_KEY=sk-your-api-key-here
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1

# Alternative: OpenRouter
# AI_API_KEY=your-openrouter-key
# AI_MODEL=meta-llama/llama-3-70b-instruct
# AI_BASE_URL=https://openrouter.ai/api/v1

# Alternative: Local Ollama
# AI_API_KEY=ollama
# AI_MODEL=llama3
# AI_BASE_URL=http://localhost:11434/v1
```

### 4. Start Development Server

```bash
bun run dev
```

**Expected Output:**
```
🔌 MongoDB connected successfully
🐟 Sounds Fishy is running at 0.0.0.0:3001
🔌 WebSocket endpoint: ws://0.0.0.0:3001/ws
```

**Test the Server:**
- Open browser: `http://localhost:3001`
- Should see: `🐟 Sounds Fishy API is running!`
- Health check: `http://localhost:3001/health`

### 5. Run in Production Mode

```bash
bun run start
```

---

## 🎨 Frontend Setup

### 1. Navigate to App Directory

```bash
cd app
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Configuration:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# WebSocket Configuration
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

### 4. Start Development Server

```bash
bun run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Open Browser:**
- Go to `http://localhost:3000`

---

## 🧪 Testing

### Backend Tests

```bash
cd service

# Run all tests
bun test

# Run unit tests only
bun run test:unit

# Run integration tests only
bun run test:integration

# Run with coverage (future)
bun test --coverage
```

**Example Output:**
```
bun test v1.0.0

service/src/__tests__/unit/room-service.test.ts:
✓ RoomService > generateRoomCode should return 6-character string [0.50ms]
✓ RoomService > assignRoles should assign 1 guesser, 1 big fish, rest red herrings [1.20ms]

 2 pass
 0 fail
 5 expect() calls
```

### Frontend Tests

```bash
cd app

# Component tests
bun test

# E2E tests with Playwright
bun run test:e2e
```

---

## 🚀 Complete Development Workflow

### 1. Start MongoDB (if using local)

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
pgrep -x mongod  # Should return process ID
```

### 2. Start Backend (Terminal 1)

```bash
cd service
bun run dev
```

**Verify:**
- ✅ Running on `http://localhost:3001`
- ✅ WebSocket on `ws://localhost:3001/ws`
- ✅ Connected to MongoDB

### 3. Start Frontend (Terminal 2)

```bash
cd app
bun run dev
```

**Verify:**
- ✅ Running on `http://localhost:3000`

### 4. Test the Application

1. **Open Browser** → `http://localhost:3000`
2. **Create a Room** → Click "Create Room"
3. **Join from Another Tab** → Open new tab, join with room code
4. **Test Real-time Updates** → Watch players list update

### 5. Test WebSocket Connection

**Using Browser Console:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws?roomCode=TEST123&playerId=test-player');

ws.onopen = () => {
  console.log('Connected!');
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};

ws.send(JSON.stringify({
  type: 'join_room',
  data: { roomCode: 'TEST123', playerId: 'test-player' }
}));
```

---

## 🔍 Troubleshooting

### MongoDB Connection Issues

#### Error: "MongoNetworkError: connect ECONNREFUSED"

**Cause:** MongoDB is not running

**Solution:**
```bash
# Check if MongoDB is running
pgrep -x mongod

# Start MongoDB (macOS)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Verify it's running
mongod --version
```

#### Error: "MongoServerError: Authentication failed"

**Cause:** Incorrect credentials in `.env`

**Solution:**
1. Verify `MONGODB_URI` in `service/.env`
2. For Atlas: Check username and password
3. For Atlas: Ensure IP whitelist includes your IP
4. Test connection with `mongosh`

**Test Connection:**
```bash
# Local
mongosh mongodb://localhost:27017/sounds-fishy

# Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/sounds-fishy"
```

#### Error: "MongoServerError: Insufficient storage"

**Cause:** Disk space full (local MongoDB)

**Solution:**
```bash
# Check disk space
df -h

# Clean MongoDB logs (macOS)
sudo rm /opt/homebrew/var/log/mongodb/mongod.log.*

# Restart MongoDB
brew services restart mongodb-community
```

---

### Port Already in Use

#### Error: "EADDRINUSE: address already in use :::3001"

**Cause:** Another process is using port 3001

**Solution:**
```bash
# Find process on port 3001
lsof -ti:3001

# Kill the process
lsof -ti:3001 | xargs kill -9

# Restart backend
cd service && bun run dev
```

**For port 3000 (frontend):**
```bash
lsof -ti:3000 | xargs kill -9
```

---

### CORS Issues

#### Error: "Access-Control-Allow-Origin" in browser console

**Cause:** Backend CORS not configured correctly

**Solution:**
1. Verify backend is running on port 3001
2. Check `service/.env` has correct `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=http://localhost:3000
   ```
3. Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
4. Restart backend server

**Verify CORS Headers:**
```bash
curl -I http://localhost:3001
# Should see: Access-Control-Allow-Origin: http://localhost:3000
```

---

### WebSocket Connection Issues

#### Error: "WebSocket connection failed"

**Possible Causes:**
1. Backend not running
2. Wrong WebSocket URL
3. CORS blocking
4. Firewall blocking

**Solution:**
```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check WebSocket URL format
# Correct: ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123

# 3. Test WebSocket connection
# Use browser console or wscat tool
wscat -c "ws://localhost:3001/ws?roomCode=TEST123"

# 4. Check browser console for errors
# Press F12 → Console tab
```

#### Error: "WebSocket closed before open"

**Cause:** Query parameters missing or invalid

**Solution:**
Ensure connection URL includes required parameters:
```javascript
// ✅ Correct
new WebSocket('ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123')

// ❌ Wrong - missing roomCode
new WebSocket('ws://localhost:3001/ws')
```

---

### Room Not Found

#### Error: "Room not found" when joining

**Possible Causes:**
1. Room code is incorrect
2. Room was deleted (all players left)
3. Typo in room code

**Solution:**
```bash
# Verify room exists (using curl)
curl http://localhost:3001/api/rooms/FISH42

# Check MongoDB directly
mongosh
use sounds-fishy
db.gamerooms.find({ roomCode: "FISH42" })
```

**Note:** Room codes are case-insensitive (auto-converted to uppercase)

---

### Host Transfer Issues

#### Problem: Host leaves but no new host assigned

**Possible Causes:**
1. No other players in room
2. WebSocket event not received
3. Database not updated

**Solution:**
1. Verify at least 2 players in room before host leaves
2. Check browser console for `host_transferred` event
3. Query room in MongoDB to verify `hostId` changed

**Test:**
```bash
# Check room state
curl http://localhost:3001/api/rooms/FISH42 | jq '.data.hostId'
```

---

### Bun Installation Issues

#### Error: "bun: command not found"

**Solution:**
```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Add to PATH (if needed)
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Verify installation
bun --version
```

**Windows:**
```powershell
# Install via winget
winget install Oven.bun

# Or use npm
npm install -g bun
```

---

### Dependency Issues

#### Error: "Cannot find module"

**Solution:**
```bash
# Clear node_modules and reinstall
cd service
rm -rf node_modules bun.lockb
bun install

# For frontend
cd ../app
rm -rf node_modules bun.lockb
bun install
```

---

## 📊 Environment Variables Reference

### Backend (service/.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `PORT` | ❌ No | `3001` | Server port number |
| `HOST` | ❌ No | `0.0.0.0` | Network interface to bind |
| `FRONTEND_URL` | ❌ No | `http://localhost:3000` | Frontend URL for CORS |
| `AI_API_KEY` | ❌ No | - | OpenAI-compatible API key |
| `AI_MODEL` | ❌ No | `gpt-3.5-turbo` | AI model to use |
| `AI_BASE_URL` | ❌ No | `https://api.openai.com/v1` | AI API base URL |

### Frontend (app/.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | - | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ Yes | - | WebSocket server URL |

---

## 🎯 Quick Start Checklist

- [ ] Install Bun
- [ ] Install MongoDB (or create Atlas account)
- [ ] Start MongoDB service
- [ ] Clone repository
- [ ] Backend: `cd service && bun install`
- [ ] Backend: Copy `.env.example` to `.env`
- [ ] Backend: Configure `MONGODB_URI`
- [ ] Backend: `bun run dev`
- [ ] Frontend: `cd app && bun install`
- [ ] Frontend: Copy `.env.example` to `.env`
- [ ] Frontend: `bun run dev`
- [ ] Open `http://localhost:3000`
- [ ] Create a room
- [ ] Join from another tab
- [ ] Test real-time updates!

---

## 📚 Additional Resources

- **[service/README.md](service/README.md)** - Backend service documentation
- **[BACKEND.md](BACKEND.md)** - Detailed backend architecture
- **[AGENTS.md](AGENTS.md)** - Game rules and flow
- **[Bun Documentation](https://bun.sh/docs)** - Bun runtime docs
- **[ElysiaJS Documentation](https://elysiajs.com)** - ElysiaJS framework docs
- **[MongoDB Documentation](https://docs.mongodb.com)** - MongoDB docs
- **[Mongoose Documentation](https://mongoosejs.com)** - Mongoose ODM docs

---

## 🆘 Getting Help

If you encounter issues not covered here:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check browser console for frontend errors
5. Review the troubleshooting section above
6. Search existing issues in the repository

---

## ✅ Next Steps

After setup is complete:
- ✅ Phase 1: Lobby System (Complete)
- ⏳ Phase 2: Briefing & AI Integration
- ⏳ Phase 3: Game Flow
- ⏳ Phase 4: Elimination & Scoring
