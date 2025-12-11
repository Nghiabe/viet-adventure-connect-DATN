export interface PlannerData {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budget: string;
    travelStyle: string;
    interests: string[];
}

export interface ItineraryItem {
    _id: string;
    name: string;
    destination: string;
    start_date?: string;
    end_date?: string;
    travelers: number;
    total_cost: number;
    status: string;
    travel_style?: string;
    created_at?: string;
    current_day?: number;
    completed_slots?: string[];
    itinerary_content?: any;
}
