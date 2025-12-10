import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Hono } from 'hono';
import { Env } from './raindrop.gen';

// ============================================
// Interfaces
// ============================================

interface ShoppingMission {
  intent: string;
  mission: string;
  required_items: string[];
  budget: number | null;
}

interface WalmartProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  brand: string;
  product_url?: string;
}

// Helper: Call Groq API (Llama 3) to extract context, required items, and budget
async function extractShoppingMission(query: string, groqApiKey: string): Promise<ShoppingMission> {
  const llamaModel = 'llama-3.1-8b-instant';

  const prompt = `
You are a smart shopping assistant for a grocery/retail store. Given a user query, respond ONLY with a valid JSON object.

IMPORTANT RULES:
1. For cooking queries: Return ONLY the essential main ingredients (5-8 items MAX). Focus on key ingredients that define the dish.
2. For other queries: Return only the most important items (5-8 items MAX).
3. Be specific with ingredient names (e.g., "basmati rice" not just "rice").
4. Do NOT include common pantry items like salt, water, or oil unless specifically requested.

JSON keys:
- intent (e.g. search, cook, party, clean, festival, etc.)
- mission (short description of what user wants)
- required_items (list of 5-8 ESSENTIAL items only - be specific)
- budget (if mentioned, as a number, otherwise null)

Examples:
Query: "cook biryani"
{"intent": "cook", "mission": "Hyderabadi Biryani", "required_items": ["basmati rice", "chicken", "biryani masala", "yogurt", "onions", "ginger garlic paste", "saffron"], "budget": null}

Query: "birthday party under $100"
{"intent": "party", "mission": "birthday party", "required_items": ["birthday cake", "balloons", "party plates", "candles", "streamers"], "budget": 100}

Query: "cleaning supplies"
{"intent": "clean", "mission": "home cleaning", "required_items": ["all-purpose cleaner", "mop", "sponges", "trash bags", "disinfectant"], "budget": null}

DO NOT include any explanation or text outside the JSON. Only output the JSON object.

User: ${query}
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llamaModel,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Groq response is not valid JSON. Try rephrasing your request.');
  }
}

// Helper: Fetch Walmart products from SerpAPI (returns only 1 best match per query)
async function fetchWalmartProducts(query: string, serpApiKey: string): Promise<WalmartProduct[]> {
  const url = `https://serpapi.com/search.json?engine=walmart&query=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`SerpAPI error: ${response.status} ${errorBody}`);
  }
  
  const data = await response.json() as any;
  
  // Return only 1 best match per ingredient to keep results focused
  return (data.organic_results || []).slice(0, 1).map((item: any) => ({
    id: item.product_id || `prod-${Math.random().toString(36).substring(2, 11)}`,
    name: item.title,
    price: item.primary_offer?.offer_price ?? 0,
    image_url: item.thumbnail,
    brand: item.seller_name || 'Walmart',
    product_url: item.product_page_url,
  }));
}

// ============================================
// Service Handler
// ============================================

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (path === '/health' && method === 'GET') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString() 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Cartify AI Agent endpoint
      if (path === '/api/cartify-agent' && method === 'POST') {
        const body = await request.json() as { query?: string };
        const { query } = body;
        
        if (!query) {
          return new Response(JSON.stringify({ error: 'Missing query' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const groqApiKey = this.env.GROQ_API_KEY;
        const serpApiKey = this.env.SERPAPI_KEY;

        if (!groqApiKey || !serpApiKey) {
          return new Response(JSON.stringify({ 
            error: 'Missing required API keys. Please ensure GROQ_API_KEY and SERPAPI_KEY are set.' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 1. Extract mission/intent/items/budget using Groq AI
        const ai = await extractShoppingMission(query, groqApiKey);
        const requiredItems = ai.required_items || [];
        const budget = ai.budget || null;

        // 2. For each required item, fetch Walmart products
        let allProducts: WalmartProduct[] = [];
        for (const item of requiredItems) {
          const products = await fetchWalmartProducts(item, serpApiKey);
          allProducts = allProducts.concat(products);
        }

        // 3. If budget, try to fit products under budget (simple greedy)
        let selectedProducts = allProducts;
        if (budget) {
          let total = 0;
          selectedProducts = [];
          for (const p of allProducts) {
            if (total + p.price <= budget) {
              selectedProducts.push(p);
              total += p.price;
            }
          }
        }

        // Generate a helpful message based on the mission
        const missionMessage = ai.mission 
          ? `Here are the essential items for ${ai.mission}! 🛒`
          : `Found ${selectedProducts.length} products for you!`;
        
        return new Response(JSON.stringify({
          products: selectedProducts,
          ai,
          message: missionMessage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Speech-to-Text Endpoint (ElevenLabs)
      if (path === '/api/speech-to-text' && method === 'POST') {
        const elevenLabsApiKey = this.env.ELEVENLABS_API_KEY;
        
        if (!elevenLabsApiKey) {
          return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
          return new Response(JSON.stringify({ error: 'No audio file found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const elevenLabsUrl = 'https://api.elevenlabs.io/v1/speech-to-text';
        
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append('file', audioFile);
        elevenLabsFormData.append('model_id', 'scribe_v1');

        const elevenLabsResponse = await fetch(elevenLabsUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
          },
          body: elevenLabsFormData,
        });

        if (!elevenLabsResponse.ok) {
          const errorBody = await elevenLabsResponse.text();
          throw new Error(`ElevenLabs API failed: ${elevenLabsResponse.status}: ${errorBody}`);
        }
        
        const result = await elevenLabsResponse.json() as { text: string };

        return new Response(JSON.stringify({ transcription: result.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Products search endpoint (for main product grid)
      if (path === '/api/products' && method === 'GET') {
        const query = url.searchParams.get('query') || 'popular items';
        const page = parseInt(url.searchParams.get('page') || '1');
        const serpApiKey = this.env.SERPAPI_KEY;

        if (!serpApiKey) {
          return new Response(JSON.stringify({ error: 'SerpAPI key not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const serpUrl = `https://serpapi.com/search.json?engine=walmart&query=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=20&page=${page}`;
        
        const serpResponse = await fetch(serpUrl);
        if (!serpResponse.ok) {
          const errorBody = await serpResponse.text();
          throw new Error(`SerpAPI error: ${serpResponse.status} ${errorBody}`);
        }
        
        const data = await serpResponse.json() as any;
        
        const products = (data.organic_results || []).map((item: any, idx: number) => ({
          id: item.product_id || `${page}-${idx}`,
          name: item.title || 'Product',
          description: item.snippet || item.title || 'No description available',
          price: item.primary_offer?.offer_price || item.price || 0,
          image_url: item.thumbnail || 'https://via.placeholder.com/300x300?text=No+Image',
          category_id: item.category || 'general',
          stock_quantity: item.out_of_stock ? 0 : Math.floor(Math.random() * 100) + 10,
          rating: item.rating || Math.floor(Math.random() * 2) + 3,
          review_count: item.reviews || Math.floor(Math.random() * 500) + 10,
          brand: item.seller_name || item.brand || 'Generic',
          sku: item.us_item_id || undefined,
          is_featured: false,
          serpapi_id: item.product_id || undefined
        }));

        return new Response(JSON.stringify({ products }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('API error:', errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}
