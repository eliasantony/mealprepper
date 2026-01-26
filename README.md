# 🍱 MealPrepper

**Master Your Nutrition with AI-Powered Precision.**

MealPrepper is a high-performance, intuitive meal planning application designed to streamline your weekly nutrition. Built with **Next.js 16**, **TypeScript**, and **Firebase**, it leverages **Google's Gemini AI** to provide a seamless, personalized planning experience that fits your lifestyle.

---

## ✨ Key Features

### 🤖 Smart AI Meal Generation
- **Direct Mode**: Describe a craving (e.g., "Skyr with Granola") and get an instant, macro-balanced recipe.
- **Brainstorm Mode**: Stuck? Let the AI suggest a variety of recipes based on your dietary preferences and calorie targets.
- **Smart Recipe Selection**: AI suggests recipes based on your dietary preferences and nutritional goals, ensuring every suggestion fits your lifestyle.

### 📅 Advanced Weekly Planner
- **Drag-and-Drop Interface**: Effortlessly organize your breakfast, lunch, dinner, and snacks.
- **Auto-Calculated Macros**: Real-time tracking of Calories, Protein, Carbs, and Fats as you build your plan.
- **Smart Distribution**: Choose from "Big Breakfast", "No Snacks", or custom distributions to match your metabolism.

### 📱 Progressive Web App (PWA) & Desktop
- **Installable**: Add MealPrepper to your home screen or desktop for a native-app feel.
- **Push Notifications**: Never miss a meal or a prep step with FCM-powered desktop and mobile notifications.
- **Offline Ready**: Access your weekly plan even when you're off the grid.

### 🎨 Premium User Experience
- **Plus Jakarta Sans Typography**: Modern, geometric typography for a clean, professional aesthetic.
- **Glassmorphism Design**: A sleek, dark-themed UI with vibrant gradients (Orange → Red) and subtle micro-animations.
- **Interactive Heroes**: A dynamic landing page with floating elements and real-time status updates.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend** | [Firebase](https://firebase.google.com/) (Firestore, Auth, Messaging) |
| **AI** | [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (Gemini Pro) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Typography** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Google Cloud project with the **Generative Language API** enabled.
- A Firebase project with **Firestore** and **Cloud Messaging** enabled.

### Installation

1. **Clone & Setup**
   ```bash
   git clone https://github.com/eliasantony/mealprepper.git
   cd mealprepper
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY=...
   ```

3. **Development**
   ```bash
   npm run dev
   ```

---

## 📸 Instagram & Branding
MealPrepper is designed to be visual. We use a signature linear gradient:
- **Primary**: `#f97316` (Orange 500)
- **Secondary**: `#ef4444` (Red 500)

Check out our [Instagram Branding Guide](.gemini/antigravity/brain/a3d22099-280c-4929-a6d2-cd1f8679428f/launch_plan.md) for more details on the visual identity.

---

## ⚖️ License
[MIT](LICENSE)
