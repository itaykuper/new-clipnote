# Clipnote

A web platform for video editors and clients to collaborate on video projects and exchange feedback.

## Features

- **For Video Editors:**
  - Google and Email Authentication
  - Project Dashboard
  - Video Upload & Sharing
  - Comment Management
  - Export Comments (CSV/SRT)

- **For Clients:**
  - No Login Required
  - Easy Video Review
  - Timeline-based Comments
  - Simple Feedback Interface

## Tech Stack

- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Supabase for:
  - Authentication
  - File Storage
  - Database
  - Real-time Updates

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                 # App router pages
├── components/         # Reusable components
├── lib/               # Utility functions and configurations
└── types/             # TypeScript type definitions
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
``` 