export interface SerpApiProduct {
  title: string
  price: number
  thumbnail: string
  link: string
  rating?: number
  reviews?: number
  source?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  stock_quantity: number
  rating: number
  review_count: number
  brand: string
  sku?: string
  is_featured?: boolean
  serpapi_id?: string
}

export async function fetchProducts(query: string, page: number = 1): Promise<Product[]> {
  const raindropUrl = import.meta.env.VITE_RAINDROP_API_URL;

  try {
    // Use Raindrop backend to fetch products (avoids CORS issues)
    if (raindropUrl) {
      const response = await fetch(`${raindropUrl}/api/products?query=${encodeURIComponent(query)}&page=${page}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          return data.products;
        }
      }
    }
    
    // Fallback to mock data if Raindrop backend fails
    console.log('Using fallback mock data');
    return generateMockProducts(query);
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    
    // Fallback to mock data if API fails
    console.log('Using fallback mock data');
    return generateMockProducts(query);
  }
}

function generateMockProducts(query: string): Product[] {
  const mockProducts: Product[] = [
    {
      id: 'mock-1',
      name: `${query} - Premium Item`,
      description: `High-quality ${query} for your needs`,
      price: 29.99,
      image_url: 'https://via.placeholder.com/300x300?text=Premium+Product',
      category_id: 'general',
      stock_quantity: 50,
      rating: 4.5,
      review_count: 234,
      brand: 'Premium Brand',
      is_featured: true
    },
    {
      id: 'mock-2',
      name: `${query} - Standard Item`,
      description: `Reliable ${query} at great value`,
      price: 19.99,
      image_url: 'https://via.placeholder.com/300x300?text=Standard+Product',
      category_id: 'general',
      stock_quantity: 100,
      rating: 4.2,
      review_count: 156,
      brand: 'Standard Brand'
    },
    {
      id: 'mock-3',
      name: `${query} - Budget Item`,
      description: `Affordable ${query} without compromise`,
      price: 12.99,
      image_url: 'https://via.placeholder.com/300x300?text=Budget+Product',
      category_id: 'general',
      stock_quantity: 75,
      rating: 3.8,
      review_count: 89,
      brand: 'Budget Brand'
    }
  ];
  
  return mockProducts;
}