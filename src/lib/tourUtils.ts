/**
 * Shared utility functions for tour data operations.
 * Used across ToursSearch, ExperienceDetail, TourCard, etc.
 */

interface TourImage {
    url?: string;
    thumbnail?: string;
    caption?: string;
}

interface TourLike {
    images?: TourImage[];
    main_image?: string;
    mainImage?: string;
    image_gallery?: string[];
    imageGallery?: string[];
}

/**
 * Get the first valid image URL from a tour object.
 * Priority: AI-enriched images → mainImage → imageGallery → null
 */
export function getTourImageUrl(tour: TourLike): string | null {
    // Check AI-enriched images array (snake_case from API)
    if (tour.images && Array.isArray(tour.images) && tour.images.length > 0) {
        const firstImg = tour.images[0];
        if (typeof firstImg === 'object') {
            if (firstImg.url && firstImg.url.startsWith('http')) return firstImg.url;
            if (firstImg.thumbnail && firstImg.thumbnail.startsWith('http')) return firstImg.thumbnail;
        }
    }

    // Check main_image (snake_case from API) or mainImage (camelCase)
    const mainImg = tour.main_image || tour.mainImage;
    if (mainImg && typeof mainImg === 'string' && mainImg.startsWith('http')) {
        return mainImg;
    }

    // Check image_gallery or imageGallery
    const gallery = tour.image_gallery || tour.imageGallery;
    if (gallery && Array.isArray(gallery) && gallery.length > 0) {
        const firstGalleryImg = gallery[0];
        if (typeof firstGalleryImg === 'string' && firstGalleryImg.startsWith('http')) {
            return firstGalleryImg;
        }
    }

    return null;
}

/**
 * Get all valid image URLs from a tour object.
 * Returns array of URLs, prioritizing AI-enriched images.
 */
export function getAllTourImages(tour: TourLike): string[] {
    const images: string[] = [];

    // Add AI-enriched images
    if (tour.images && Array.isArray(tour.images)) {
        for (const img of tour.images) {
            if (img.url && img.url.startsWith('http')) {
                images.push(img.url);
            } else if (img.thumbnail && img.thumbnail.startsWith('http')) {
                images.push(img.thumbnail);
            }
        }
    }

    // Add from gallery
    const gallery = tour.image_gallery || tour.imageGallery;
    if (gallery && Array.isArray(gallery)) {
        for (const url of gallery) {
            if (typeof url === 'string' && url.startsWith('http') && !images.includes(url)) {
                images.push(url);
            }
        }
    }

    // Add main image if not already included
    const mainImg = tour.main_image || tour.mainImage;
    if (mainImg && typeof mainImg === 'string' && mainImg.startsWith('http') && !images.includes(mainImg)) {
        images.unshift(mainImg);  // Add to front
    }

    return images;
}

/**
 * Format price as Vietnamese currency string (without ₫ symbol).
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
}

/**
 * Format price with ₫ symbol.
 */
export function formatPriceVND(price: number): string {
    return `${formatPrice(price)}₫`;
}

/**
 * Parse tour schedule text that contains "Ngày X:" patterns into day-based structure.
 * Used for multi-day tours where morning/afternoon/evening fields contain multiple days mixed.
 */
interface ScheduleActivity {
    time: string;
    content: string;
    color: 'amber' | 'orange' | 'indigo';
}

interface DaySchedule {
    day: number;
    activities: ScheduleActivity[];
}

interface TourSchedule {
    morning?: string;
    afternoon?: string;
    evening?: string;
}

export function parseScheduleByDay(schedule: TourSchedule): DaySchedule[] {
    const allText = [
        schedule.morning ? `Sáng: ${schedule.morning}` : '',
        schedule.afternoon ? `Chiều: ${schedule.afternoon}` : '',
        schedule.evening ? `Tối: ${schedule.evening}` : ''
    ].filter(Boolean).join(' | ');

    // Check if data contains day markers
    const dayPattern = /Ngày\s*(\d+)[:\s]/gi;
    const hasMultipleDays = allText.match(dayPattern);

    if (!hasMultipleDays) {
        // Single day tour - just show morning/afternoon/evening
        return [{
            day: 1,
            activities: [
                schedule.morning ? { time: 'Sáng', content: schedule.morning, color: 'amber' as const } : null,
                schedule.afternoon ? { time: 'Chiều', content: schedule.afternoon, color: 'orange' as const } : null,
                schedule.evening ? { time: 'Tối', content: schedule.evening, color: 'indigo' as const } : null
            ].filter((a): a is ScheduleActivity => a !== null)
        }];
    }

    // Multi-day tour - parse by day
    const result: DaySchedule[] = [];

    const parsePeriod = (text: string | undefined, periodName: string, color: 'amber' | 'orange' | 'indigo') => {
        if (!text) return;

        const parts = text.split(/Ngày\s*(\d+)[:\s]/i).filter(Boolean);

        for (let i = 0; i < parts.length; i += 2) {
            const dayNum = parseInt(parts[i]);
            const content = parts[i + 1]?.trim();

            if (!isNaN(dayNum) && content) {
                let dayEntry = result.find(d => d.day === dayNum);
                if (!dayEntry) {
                    dayEntry = { day: dayNum, activities: [] };
                    result.push(dayEntry);
                }
                dayEntry.activities.push({ time: periodName, content, color });
            }
        }
    };

    parsePeriod(schedule.morning, 'Sáng', 'amber');
    parsePeriod(schedule.afternoon, 'Chiều', 'orange');
    parsePeriod(schedule.evening, 'Tối', 'indigo');

    result.sort((a, b) => a.day - b.day);

    // Fallback if parsing failed
    if (result.length === 0) {
        return [{
            day: 1,
            activities: [
                schedule.morning ? { time: 'Sáng', content: schedule.morning, color: 'amber' as const } : null,
                schedule.afternoon ? { time: 'Chiều', content: schedule.afternoon, color: 'orange' as const } : null,
                schedule.evening ? { time: 'Tối', content: schedule.evening, color: 'indigo' as const } : null
            ].filter((a): a is ScheduleActivity => a !== null)
        }];
    }

    return result;
}

export type { TourImage, TourLike, TourSchedule, DaySchedule, ScheduleActivity };
