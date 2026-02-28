# 🎵 Spotify Clone

A full-stack Spotify-like music streaming platform built with:
- **Backend:** Go (Gin) + Firebase Admin SDK
- **Web:** Next.js + Tailwind CSS + Three.js
- **Android:** Kotlin + Jetpack Compose
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Auth:** Firebase Authentication

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- Firebase project (free tier)

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or **"Add project"**)
3. Name it (e.g., `spotify-clone`)
4. Disable Google Analytics (optional) → **Create Project**
5. Enable **Authentication**: Firebase Console → Authentication → Sign-in method → Enable **Email/Password** and **Google**
6. Enable **Firestore**: Firebase Console → Firestore Database → Create database → Start in **test mode**
7. Enable **Storage**: Firebase Console → Storage → Get started
8. Get Service Account Key:
   - Firebase Console → ⚙️ Project Settings → **Service Accounts** tab
   - Click **"Generate new private key"** → Downloads a JSON file
   - Rename it to `serviceAccountKey.json`
   - Place it in `backend/serviceAccountKey.json`

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your Firebase Storage bucket name
# (Found in Firebase Console → Storage → gs://YOUR_BUCKET_NAME)
go mod tidy
go run main.go
```

### 3. Web Setup
```bash
cd web
npm install
npm run dev
```

### 4. Environment Variables
See `backend/.env.example` for all required variables.

## 📂 Project Structure
```
spotify/
├── backend/          # Go API server
├── web/              # Next.js web app
├── android/          # Kotlin Android app
└── firebase/         # Security rules
```

## 🎵 Music Sources
- **Jamendo API** — Creative Commons music
- **Internet Archive** — Public domain audio
- **Free Music Archive** — CC-licensed tracks
- **Spotify API** — Metadata only (no audio)
- **Artist Uploads** — Direct MP3/WAV uploads

## 📄 License
Personal use only.
