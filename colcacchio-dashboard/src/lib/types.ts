export interface MenuItem {
  name: string;
  category: string;
  citationUrl: string;
}

export interface Special {
  name: string;
  description: string;
  citationUrl: string;
}

export interface Store {
  name: string;
  location: string;
  region: "Gauteng" | "Western Cape" | "KZN" | "Pretoria";
  rating: number;
  reviewCount: number;
  uberEatsUrl: string;
  slug: string;
  items: MenuItem[];
  specials: Special[];
}

export interface DashboardData {
  stores: Store[];
  generatedAt: string;
}
