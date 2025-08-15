# Monc Chat - AI Persona Based Chat Application

<img src="https://github.com/rahoolsingh/monc-chat/blob/main/screenshot2.png?raw=true">

A chatApp styled application that lets you interact with AI personas based on popular tech influencers and creators. Chat with AI versions of Hitesh Choudhary, Piyush Garg, and more!

## 🌐 Live Demo

**Try it now:** [https://chat.monc.space/](https://chat.monc.space/)

## ✨ Features

-   🤖 **AI Personas**: Chat with AI versions of popular influencers or celebs.
-   💬 **Real-time Messaging**: Streaming responses with natural conversation flow
-   🔗 **Link Previews**: Automatic link detection with metadata previews
-   📱 **Responsive Design**: WhatsApp-style interface that works on all devices
-   ⚡ **Fast & Modern**: Built with React, TypeScript, and Express

## 🚀 Quick Start

### Prerequisites

-   Node.js (v20 or higher)
-   npm or pnpm
-   OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/rahoolsingh/monc-chat
cd monc-chat
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
# or
pnpm install

# Create environment file
cp .env.example .env
```

**Environment Variables:**

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:3001" > .env
```

### 4. Run the Application

**Start Backend Server:**

```bash
# In backend directory
npm start
# or
pnpm start

# For development with auto-reload
npm run dev
# or
pnpm dev
```

**Start Frontend Development Server:**

```bash
# In frontend directory
npm run dev
# or
pnpm dev
```

The application will be available at:

-   **Frontend**: http://localhost:5173
-   **Backend API**: http://localhost:3001

## 📖 How to Use

### 1. Select a Persona

-   Open the application in your browser
-   Browse available AI personas in the sidebar
-   Click on any persona to start chatting

### 2. Start Chatting

-   Type your message in the input field at the bottom
-   Press Enter or click the send button
-   Watch as the AI responds in real-time with multiple message parts

### 3. Rich Text Features

**Formatting:**

-   `**bold text**` → **bold text**
-   `` `inline code` `` → `inline code`

**Code Blocks:**

```javascript
function hello() {
    console.log("Hello, World!");
}
```

**Links:**

-   Paste any URL and it will become clickable with a preview
-   Supports GitHub, YouTube, Stack Overflow, and more

### 4. Chat History

-   Your conversations are automatically saved locally
-   Switch between personas to see different conversation histories
-   Chat history persists across browser sessions

## 🔧 Development

### Backend Development

**Available Scripts:**

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend Development

**Available Scripts:**

```bash
npm run dev          # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🔒 Environment Variables

### Backend (.env)

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001
```

## 🚀 Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### Frontend Deployment

1. Set `VITE_BACKEND_URL` to your backend URL
2. Build the project: `npm run build`
3. Deploy the `dist` folder to your hosting platform

---

**Made with ❤️ by [Veer Rajpoot](https://veerrajpoot.com)**

_Don't forget to ⭐ star this repository if you found it helpful!_

<img src="https://github.com/rahoolsingh/monc-chat/blob/main/frontend/src/assets/logo-full.png?raw=true">
