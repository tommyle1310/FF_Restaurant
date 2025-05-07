export type Type_Address = {
  id: string;
  street: string;
  city: string;
  nationality: string;
  is_default: boolean;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  postal_code: number;
  location: {
    lng: number; // lnggitude
    lat: number; // Latitude
  };
  title: string;
};
