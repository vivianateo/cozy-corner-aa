export interface Place {
  id: string;
  name: string;
  category: 'ristoranti' | 'parchi' | 'musei' | 'caffè' | 'hotel' | 'altro';
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string;
  avg_rating: number;
  review_count: number;
  amenities: string[];
  created_at: string;
}

export interface Review {
  id: string;
  place_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PlaceDetail extends Place {
  reviews: Review[];
}
