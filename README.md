# Cartify - AI Shopping Assistant

![Cartify Logo](CartifyAI-logo.png)

> Your intelligent shopping companion that understands your needs, mood, and budget.

---

## 🛒 What is Cartify?

Cartify is an AI-powered e-commerce platform that transforms online shopping into a conversational experience. Instead of endless scrolling and filtering, simply tell Cartify what you need and let AI find the perfect products for you.

**Example:** Say "I want to cook biryani under $50" and Cartify will understand you need biryani ingredients, find the essential items (rice, chicken, spices), and recommend products within your budget.

---

## ✨ Features

### 🤖 AI Shopping Assistant
- Natural language product search - just describe what you need
- Context-aware recommendations based on intent (cooking, party, cleaning, etc.)
- Smart budget optimization - finds the best products within your price range
- Mood-based suggestions - understands sentiment and adapts recommendations

### 🎤 Voice-Enabled Shopping
- Hands-free shopping experience
- High-quality speech-to-text powered by ElevenLabs
- Speak your requests naturally - "Find me party supplies for under $100"

### 🛍️ Real-Time Product Data
- Live product information from Walmart
- Up-to-date pricing and availability
- Product images, ratings, and reviews

### � SRmart Cart Management
- Add AI-suggested items to cart with one click
- Persistent cart across sessions
- Easy quantity adjustments

### 📊 Analytics Dashboard
- View shopping patterns and trends
- Track most searched products
- Sales insights by category

### 👤 User Authentication
- Secure sign up and sign in
- Personal shopping history
- Order tracking

### 📱 Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Clean, modern UI with intuitive navigation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CARTIFY                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐     ┌─────────────────────────────────┐  │
│  │     FRONTEND     │     │      RAINDROP BACKEND           │  │
│  │  React + Vite    │────▶│                                 │  │
│  │  Tailwind CSS    │     │  /api/cartify-agent             │  │
│  │  Zustand         │     │   ├─ Groq AI (Llama 3.1)        │  │
│  │                  │     │   └─ SerpAPI (Products)         │  │
│  │                  │     │                                 │  │
│  │                  │     │  /api/speech-to-text            │  │
│  │                  │     │   └─ ElevenLabs                 │  │
│  │                  │     │                                 │  │
│  │                  │     │  /api/products                  │  │
│  │                  │     │   └─ SerpAPI                    │  │
│  └──────────────────┘     └─────────────────────────────────┘  │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │    SUPABASE      │  Authentication, Cart, Orders            │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State Management** | Zustand |
| **Backend** | LiquidMetal AI Raindrop Platform (Vultr Cloud) |
| **AI Model** | Groq API (Llama 3.1) |
| **Voice AI** | ElevenLabs Speech-to-Text |
| **Product Data** | SerpAPI (Walmart) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Raindrop CLI

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/cartify.git
cd cartify
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Raindrop Backend
VITE_RAINDROP_API_URL=your_raindrop_api_url
```

### 3. Deploy Backend

```bash
# Install Raindrop CLI
npm install -g @liquidmetal-ai/raindrop

# Login
raindrop auth login

# Navigate to backend
cd raindrop-backend
npm install

# Set API keys
raindrop build env set env:GROQ_API_KEY your_groq_key
raindrop build env set env:SERPAPI_KEY your_serpapi_key
raindrop build env set env:ELEVENLABS_API_KEY your_elevenlabs_key

# Deploy
raindrop build deploy --start

# Get your API URL
raindrop build find
```

### 4. Run Frontend

```bash
cd ..
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/cartify-agent` | POST | AI shopping assistant - processes natural language queries |
| `/api/speech-to-text` | POST | Converts voice input to text |
| `/api/products` | GET | Search products by query |

### Example Request

```bash
curl -X POST https://your-api-url/api/cartify-agent \
  -H "Content-Type: application/json" \
  -d '{"query": "cook biryani under $50"}'
```

### Example Response

```json
{
  "products": [
    {"name": "Basmati Rice 5lb", "price": 8.99, "image_url": "..."},
    {"name": "Chicken Breast 2lb", "price": 12.99, "image_url": "..."},
    {"name": "Shan Biryani Masala", "price": 4.99, "image_url": "..."},
    {"name": "Plain Yogurt 32oz", "price": 3.49, "image_url": "..."},
    {"name": "Yellow Onions 3lb", "price": 2.99, "image_url": "..."}
  ],
  "message": "Here are the essential items for Hyderabadi Biryani! 🛒"
}
```

---

## 📁 Project Structure

```
cartify/
├── src/
│   ├── components/         # React components
│   │   ├── goCartAssistant.tsx    # AI chatbot
│   │   ├── FloatingCartifyButton.tsx
│   │   ├── Header.tsx
│   │   ├── HeroBanner.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CheckoutPage.tsx
│   │   └── AgentAnalyticsTool.tsx
│   ├── lib/                # Utilities
│   │   ├── supabase.ts
│   │   ├── serpapi.ts
│   │   └── raindrop-config.ts
│   ├── store/              # State management
│   │   └── useStore.ts
│   ├── App.tsx
│   └── main.tsx
├── raindrop-backend/       # Backend API
│   └── src/api/index.ts
├── public/
└── supabase/              # Database schema
```

---

## 🎯 Use Cases

- **Meal Planning**: "I want to cook pasta for 4 people"
- **Party Shopping**: "Birthday party supplies under $75"
- **Seasonal Prep**: "Winter home essentials"
- **Gift Finding**: "Gift ideas for a tech lover under $100"
- **Mood Shopping**: "I'm feeling low, need some comfort snacks"

---

## 🔒 Security

- API keys stored securely on server-side
- Supabase Row Level Security (RLS) for data protection
- HTTPS for all API communications
- No sensitive data exposed in frontend

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for improvements, bug fixes, or new features.

---

> **Cartify – Shop Smarter with AI** 🛒✨
