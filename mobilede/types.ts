import type { Page, BrowserContext } from 'patchright';

export interface CarData {
  car_name: string;
  price: string;
  maker: string;
  image: string;
  detail_url: string;
  first_registration: string;
  mileage: string;
  power: string;
  cubic_capacity: string;
  fuel: string;
  transmission: string;
  drive_type: string;
  colour: string;
  number_of_seats: string;
  door_count: string;
  weight: string;
  cylinders: string;
  tank_capacity: string;
  condition: string;
  category: string;
  availability: string;
  origin: string;
  battery_capacity: string;
  battery_status: string;
  plug_types: string;
  co2_emissions: string;
  environmental_badge: string;
  hu: string;
  air_conditioning: string;
  parking_assist: string;
  airbags: string;
  manufacturer_color: string;
  interior: string;
  features: string;
  description: string;
  dealer_name: string;
  dealer_address: string;
  dealer_rating: string;
  price_evaluation: string;
  images: string;
}

export interface CarExtractionResult extends Partial<CarData> {
  error?: string;
  error_message?: string;
  status?: string;
}

export interface ProcessingConfig {
  concurrent: boolean;
  maxConcurrentPages: number;
}

export type CarProcessFunction = (
  browser: BrowserContext,
  car: CarData,
  filename: string
) => Promise<void>;