import type { IncomingMessage, ServerResponse } from 'http';
import dbConnect from '../../../lib/dbConnect';
import Tour from '../../../models/Tour';
import Destination from '../../../models/Destination';
import mongoose from 'mongoose';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

interface SearchQueryParams {
  destinationSlug?: string;
  startDate?: string;
  adults?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  duration?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc';
  page?: string;
  limit?: string;
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const handlerName = '/api/tours/search';
  
  try {
    console.log(`[${handlerName}] Starting request processing...`);
    
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
    }

    await dbConnect();
    console.log(`[${handlerName}] Database connected successfully.`);

    const url = new URL(req.url || '', 'http://localhost');
    const queryParams: SearchQueryParams = Object.fromEntries(url.searchParams);

    // Parse and validate query parameters
    const {
      destinationSlug,
      startDate,
      adults,
      minPrice,
      maxPrice,
      minRating,
      duration,
      sortBy = 'relevance',
      page = '1',
      limit = '12'
    } = queryParams;

    console.log(`[${handlerName}] Raw query params:`, {
      destinationSlug,
      startDate,
      adults,
      minPrice,
      maxPrice,
      minRating,
      duration,
      sortBy,
      page,
      limit,
    });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const minRatingNum = minRating ? parseFloat(minRating) : undefined;

    // Build the aggregation pipeline
    const pipeline: mongoose.PipelineStage[] = [];

    // Stage 1: Initial destination lookup if destinationSlug is provided
    if (destinationSlug) {
      const inputSlug = String(destinationSlug).trim();
      const normalizeSlug = (s: string) => s
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const normalized = normalizeSlug(inputSlug);
      console.log(`[${handlerName}] Received destinationSlug="${inputSlug}", normalized="${normalized}"`);

      // Try exact slug match first
      let destination = await Destination.findOne({ slug: inputSlug, status: 'published' }).lean();
      console.log(`[${handlerName}] Destination exact lookup result:`, destination?._id || null);

      // Try normalized exact slug if not found and different
      if (!destination && normalized && normalized !== inputSlug) {
        destination = await Destination.findOne({ slug: normalized, status: 'published' }).lean();
        console.log(`[${handlerName}] Destination normalized lookup result:`, destination?._id || null);
      }

      // Try regex contains on slug as a resilient fallback (prefix/contains)
      if (!destination && normalized) {
        const regex = new RegExp(normalized.replace(/[-]+/g, '[-]*'), 'i');
        destination = await Destination.findOne({ slug: { $regex: regex }, status: 'published' }).lean();
        console.log(`[${handlerName}] Destination regex lookup result:`, destination?._id || null, ` regex=/${regex.source}/i`);
      }

      if (!destination) {
        // Hardened behavior: destination not found should yield empty successful result
        console.log(`[${handlerName}] No destination matched for slug. Returning empty successful response.`);
        return send(res, 200, {
          success: true,
          data: {
            tours: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalTours: 0,
              hasNextPage: false,
              hasPrevPage: pageNum > 1
            },
            filters: {
              applied: {
                destinationSlug,
                minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
                maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
                minRating: minRating ? parseFloat(minRating) : undefined,
                duration: duration ? duration.split(',') : undefined,
                sortBy
              }
            }
          }
        });
      }

      const matchStage: any = { 
        destination: destination._id,
        status: 'published'
      };
      console.log(`[${handlerName}] Final $match (destination + status):`, matchStage);

      // Add destination filter to the pipeline
      pipeline.push({ $match: matchStage });
    } else {
      // If no destination specified, only show published tours
      pipeline.push({
        $match: { status: 'published' }
      });
    }

    // Stage 2: Additional filters
    const additionalFilters: any = {};
    
    if (minPrice || maxPrice) {
      additionalFilters.price = {};
      if (minPrice) additionalFilters.price.$gte = parseInt(minPrice, 10);
      if (maxPrice) additionalFilters.price.$lte = parseInt(maxPrice, 10);
    }

    // Note: rating filter (minRating) is intentionally excluded from additionalFilters
    // so that filterCounts are computed across other active filters. The rating filter
    // will be applied inside the paginatedResults and metadata facets only.

    if (duration) {
      // Handle both single duration and array of durations
      const durationValues = duration.includes(',') ? duration.split(',') : [duration];
      additionalFilters.duration = { $in: durationValues };
    }

    // Add additional filters if any exist
    if (Object.keys(additionalFilters).length > 0) {
      console.log(`[${handlerName}] Additional filters to apply:`, additionalFilters);
      pipeline.push({ $match: additionalFilters });
    }

    // Stage 3: Lookup related data
    pipeline.push(
      {
        $lookup: {
          from: 'destinations',
          localField: 'destination',
          foreignField: '_id',
          as: 'destinationInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'tour',
          as: 'reviews'
        }
      }
    );

    // Stage 4: Unwind and project
    pipeline.push(
      {
        $unwind: {
          path: "$destinationInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$ownerInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $avg: "$reviews.rating" },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          price: 1,
          duration: 1,
          maxGroupSize: 1,
          mainImage: 1,
          imageGallery: 1,
          isSustainable: 1,
          itinerary: 1,
          inclusions: 1,
          exclusions: 1,
          averageRating: 1,
          reviewCount: 1,
          createdAt: 1,
          destination: {
            _id: "$destinationInfo._id",
            name: "$destinationInfo.name",
            slug: "$destinationInfo.slug",
            mainImage: "$destinationInfo.mainImage"
          },
          owner: {
            _id: "$ownerInfo._id",
            name: "$ownerInfo.name"
          }
        }
      }
    );

    // Stage 5: Sort based on sortBy parameter
    let sortStage: any = {};
    switch (sortBy) {
      case 'price_asc':
        sortStage = { price: 1 };
        break;
      case 'price_desc':
        sortStage = { price: -1 };
        break;
      case 'rating_desc':
        sortStage = { averageRating: -1 };
        break;
      case 'relevance':
      default:
        // Relevance: combination of rating and review count
        sortStage = { 
          averageRating: -1, 
          reviewCount: -1 
        };
        break;
    }
    // Stage 5 & 6: Facet to compute paginated results, total count, and filter counts in one pass
    pipeline.push({
      $facet: {
        paginatedResults: [
          ...(minRatingNum ? [{ $match: { averageRating: { $gte: minRatingNum } } }] : []),
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limitNum }
        ],
        metadata: [
          ...(minRatingNum ? [{ $match: { averageRating: { $gte: minRatingNum } } }] : []),
          { $count: 'total' }
        ],
        filterCounts: [
          {
            $group: {
              _id: null,
              rating_5: { $sum: { $cond: [{ $gte: ["$averageRating", 5] }, 1, 0] } },
              rating_4: { $sum: { $cond: [{ $gte: ["$averageRating", 4] }, 1, 0] } },
              rating_3: { $sum: { $cond: [{ $gte: ["$averageRating", 3] }, 1, 0] } },
              rating_2: { $sum: { $cond: [{ $gte: ["$averageRating", 2] }, 1, 0] } },
              rating_1: { $sum: { $cond: [{ $gte: ["$averageRating", 1] }, 1, 0] } }
            }
          }
        ]
      }
    });

    console.log(`[${handlerName}] Executing aggregation pipeline with params:`, {
      destinationSlug,
      minPrice,
      maxPrice,
      minRating,
      duration,
      sortBy,
      page: pageNum,
      limit: limitNum
    });
    console.log(`[${handlerName}] Aggregation pipeline (stages):`, JSON.stringify(pipeline, null, 2));

    const [results] = await Tour.aggregate(pipeline);
    
    // CRITICAL REFACTOR: Gracefully handle the case where the aggregation returns no data.
    // Instead of throwing an error or returning a 404, create a default empty structure.
    const tours = results?.paginatedResults || [];
    const totalTours = results?.metadata?.[0]?.total || 0;
    const ratingsFacet = results?.filterCounts?.[0] || {} as any;
    const totalPages = Math.ceil(totalTours / limitNum);

    console.log(`[${handlerName}] Search completed. Found ${totalTours} total tours, returning ${tours.length}.`);

    // This response is now ALWAYS successful unless a true server error occurs.
    return send(res, 200, {
      success: true,
      data: {
        tours, // This will be [] if no results are found
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalTours,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filterCounts: {
          ratings: {
            "5": ratingsFacet?.rating_5 || 0,
            "4": ratingsFacet?.rating_4 || 0,
            "3": ratingsFacet?.rating_3 || 0,
            "2": ratingsFacet?.rating_2 || 0,
            "1": ratingsFacet?.rating_1 || 0
          }
        },
        filters: {
          applied: {
            destinationSlug,
            minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            duration: duration ? duration.split(',') : undefined,
            sortBy
          }
        }
      }
    });

  } catch (error: any) {
    // This block now only catches REAL server errors (DB connection, etc.)
    console.error(`[ERROR in ${handlerName}]`, error);
    console.error(`[ERROR in ${handlerName}] Stack trace:`, error.stack);
    return send(res, 500, { 
      success: false, 
      error: `Server Error: ${error.message}` 
    });
  }
}

export default handler;



