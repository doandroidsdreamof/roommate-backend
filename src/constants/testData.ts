export const createPostingTestDto = {
  title: 'Test Posting',
  coverImageUrl: 'https://example.com/cover.jpg',
  city: 'Istanbul',
  district: 'Kadikoy',
  neighborhoodId: 1,
  latitude: 41.0082,
  longitude: 28.9784,
  rentAmount: 20000,
  roomCount: 2,
  bathroomCount: 1,
  squareMeters: 100,
  isFurnished: true,
  preferredRoommateGender: 'mixed' as const,
  availableFrom: new Date().toISOString(),

  specs: {
    description: '', //  Violates CHECK: LENGTH(TRIM(description)) > 0
    depositAmount: 40000,
    billsIncluded: false,
    floor: 3,
    totalFloors: 5,
    hasBalcony: true,
    hasParking: false,
    hasElevator: true,
  },

  images: [{ url: 'https://example.com/img1.jpg', order: 0 }],
};

export interface ICreatePostingTestDto {
  title: string;
  coverImageUrl: string;
  city: string;
  district: string;
  neighborhoodId: number;
  latitude: number;
  longitude: number;
  rentAmount: number;
  roomCount: number;
  bathroomCount: number;
  squareMeters: number;
  isFurnished: boolean;
  preferredRoommateGender: 'mixed' | 'male_only' | 'female_only';
  availableFrom: string;
  specs: {
    description: string;
    depositAmount: number;
    billsIncluded: boolean;
    floor: number;
    totalFloors: number;
    hasBalcony: boolean;
    hasParking: boolean;
    hasElevator: boolean;
  };
  images: Array<{ url: string; order: number }>;
}
