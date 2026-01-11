# MealPrepper

MealPrepper is a modern, intuitive meal planning application designed to help you organize your weekly nutrition with ease. Built with Next.js and powered by AI, it offers a seamless drag-and-drop interface for planning meals, tracking macros, and discovering new recipes.

## Features

- **📅 Interactive Weekly Planner**: meaningful drag-and-drop interface to organize your meals for the week.
- **✨ AI-Powered Suggestions**: Get intelligent meal ideas based on your preferences using Google's Gemini AI.
- **🥗 Recipe Management**: Create, edit, and store your favorite recipes with detailed macro breakdowns.
- **📊 Macro Tracking**: Keep track of your daily nutritional intake (Calories, Protein, Carbs, Fats) automatically.
- **📱 Responsive & Modern UI**: A sleek, mobile-first design with smooth animations and dark/light mode support.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)
- **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started

Follow these steps to get the project running locally.

### Prerequisites

- Node.js 18+ installed
- A Firebase project
- A Google Cloud project with Gemini API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mealprepper
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your Firebase and Google API credentials:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google Gemini API
   NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm start` - Starts the production server.
- `npm run lint` - Runs ESLint checks.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
