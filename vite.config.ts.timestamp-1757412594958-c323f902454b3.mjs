var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/dbConnect.ts
var dbConnect_exports = {};
__export(dbConnect_exports, {
  default: () => dbConnect
});
import mongoose from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI (or VITE_MONGODB_URI) environment variable");
  }
  const cached = globalWithMongoose.mongooseConn;
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Keep pool reasonable for local dev
      maxPoolSize: 5
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
var globalWithMongoose;
var init_dbConnect = __esm({
  "src/lib/dbConnect.ts"() {
    "use strict";
    globalWithMongoose = global;
    if (!globalWithMongoose.mongooseConn) {
      globalWithMongoose.mongooseConn = { conn: null, promise: null };
    }
  }
});

// src/models/Booking.ts
var Booking_exports = {};
__export(Booking_exports, {
  default: () => Booking_default
});
import mongoose2, { Schema } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var BookingSchema, Booking, Booking_default;
var init_Booking = __esm({
  "src/models/Booking.ts"() {
    "use strict";
    BookingSchema = new Schema(
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        tour: { type: Schema.Types.ObjectId, ref: "Tour", required: true, index: true },
        tourInfo: {
          title: { type: String, required: true },
          price: { type: Number, required: true },
          duration: { type: String, required: true }
        },
        bookingDate: { type: Date, required: true },
        participants: { type: Number, required: true, min: 1 },
        participantsBreakdown: {
          adults: { type: Number, default: 0 },
          children: { type: Number, default: 0 }
        },
        totalPrice: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ["pending", "confirmed", "cancelled", "refunded"], default: "pending" },
        paymentId: { type: String },
        paymentMethod: { type: String },
        paymentTransactionId: { type: String },
        priceBreakdown: {
          basePrice: { type: Number, default: 0 },
          taxes: { type: Number, default: 0 },
          fees: { type: Number, default: 0 }
        },
        history: [
          {
            at: { type: Date, default: () => /* @__PURE__ */ new Date() },
            action: { type: String, required: true },
            by: { type: Schema.Types.ObjectId, ref: "User" },
            note: { type: String }
          }
        ]
      },
      { timestamps: true }
    );
    Booking = mongoose2.models.Booking || mongoose2.model("Booking", BookingSchema);
    Booking_default = Booking;
  }
});

// src/models/Tour.ts
var Tour_exports = {};
__export(Tour_exports, {
  default: () => Tour_default
});
import mongoose3, { Schema as Schema2 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var TourSchema, Tour, Tour_default;
var init_Tour = __esm({
  "src/models/Tour.ts"() {
    "use strict";
    TourSchema = new Schema2(
      {
        title: { type: String, required: true },
        price: { type: Number, required: true },
        duration: { type: String, required: true },
        maxGroupSize: { type: Number },
        description: { type: String },
        itinerary: [
          {
            day: { type: Number, required: true },
            title: { type: String, required: true },
            description: { type: String, required: true }
          }
        ],
        inclusions: [{ type: String }],
        exclusions: [{ type: String }],
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0, min: 0 },
        isSustainable: { type: Boolean, default: false },
        destination: { type: Schema2.Types.ObjectId, ref: "Destination", required: true, index: true },
        owner: { type: Schema2.Types.ObjectId, ref: "User", required: true, index: true },
        status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
        mainImage: { type: String },
        imageGallery: [{ type: String }]
      },
      { timestamps: true }
    );
    Tour = mongoose3.models.Tour || mongoose3.model("Tour", TourSchema);
    Tour_default = Tour;
  }
});

// src/lib/auth/jwt.ts
var jwt_exports = {};
__export(jwt_exports, {
  signJwt: () => signJwt,
  verifyJwt: () => verifyJwt
});
import jwt from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/jsonwebtoken/index.js";
function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
var JWT_SECRET, JWT_EXPIRES_IN;
var init_jwt = __esm({
  "src/lib/auth/jwt.ts"() {
    "use strict";
    JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
    JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
  }
});

// src/models/Destination.ts
var Destination_exports = {};
__export(Destination_exports, {
  default: () => Destination_default
});
import mongoose4, { Schema as Schema3 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var DestinationSchema, Destination, Destination_default;
var init_Destination = __esm({
  "src/models/Destination.ts"() {
    "use strict";
    DestinationSchema = new Schema3(
      {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String },
        history: { type: String },
        culture: { type: String },
        geography: { type: String },
        mainImage: { type: String },
        imageGallery: [{ type: String }],
        bestTimeToVisit: { type: String },
        essentialTips: [{ type: String }],
        status: { type: String, enum: ["draft", "published"], default: "draft", index: true }
      },
      { timestamps: true }
    );
    Destination = mongoose4.models.Destination || mongoose4.model("Destination", DestinationSchema);
    Destination_default = Destination;
  }
});

// src/models/User.ts
var User_exports = {};
__export(User_exports, {
  default: () => User_default
});
import mongoose5, { Schema as Schema4 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
import bcrypt from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/bcrypt/bcrypt.js";
var UserSchema, User, User_default;
var init_User = __esm({
  "src/models/User.ts"() {
    "use strict";
    UserSchema = new Schema4(
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true, minlength: 6 },
        avatar: { type: String },
        role: { type: String, enum: ["user", "partner", "staff", "admin"], default: "user" },
        status: { type: String, enum: ["active", "pending_approval", "suspended"], default: "active" },
        savedTours: [{ type: Schema4.Types.ObjectId, ref: "Tour" }],
        savedStories: [{ type: Schema4.Types.ObjectId, ref: "Story" }],
        contributionScore: { type: Number, default: 0 }
      },
      { timestamps: true }
    );
    UserSchema.pre("save", async function(next) {
      const user = this;
      console.log(`[User Model] 'pre-save' hook triggered for user: ${user.email}`);
      if (!user.isModified("password")) {
        console.log("[User Model] Password not modified, skipping hashing.");
        return next();
      }
      try {
        console.log("[User Model] Password modified. Hashing password...");
        const saltRounds = 10;
        const hash = await bcrypt.hash(user.password, saltRounds);
        user.password = hash;
        console.log("[User Model] Password successfully hashed.");
        next();
      } catch (err) {
        console.error("[User Model] Error hashing password:", err);
        next(err);
      }
    });
    UserSchema.methods.comparePassword = async function(candidate) {
      console.log(`[User Model] Comparing password for user: ${this.email}`);
      console.log(`[User Model] Stored hash: ${this.password}`);
      console.log(`[User Model] Candidate password: ${candidate}`);
      const result = await bcrypt.compare(candidate, this.password);
      console.log(`[User Model] Password comparison result: ${result}`);
      return result;
    };
    User = mongoose5.models.User || mongoose5.model("User", UserSchema);
    User_default = User;
  }
});

// src/models/Coupon.ts
var Coupon_exports = {};
__export(Coupon_exports, {
  default: () => Coupon_default
});
import mongoose6, { Schema as Schema5 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var CouponSchema, Coupon, Coupon_default;
var init_Coupon = __esm({
  "src/models/Coupon.ts"() {
    "use strict";
    CouponSchema = new Schema5({
      code: { type: String, required: true, unique: true, index: true },
      description: { type: String },
      discountType: { type: String, enum: ["percentage", "fixed_amount"], required: true },
      discountValue: { type: Number, required: true, min: 0 },
      rules: {
        minimumSpend: { type: Number, default: 0 },
        applicableToDestinations: [{ type: Schema5.Types.ObjectId, ref: "Destination" }],
        applicableToPartners: [{ type: Schema5.Types.ObjectId, ref: "User" }],
        applicableToTours: [{ type: Schema5.Types.ObjectId, ref: "Tour" }]
      },
      limits: {
        totalUses: { type: Number, default: 0 },
        usesPerCustomer: { type: Boolean, default: false }
      },
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: true, index: true },
      usedCount: { type: Number, default: 0 },
      usedBy: [{ type: Schema5.Types.ObjectId, ref: "User" }]
    }, { timestamps: true });
    Coupon = mongoose6.models.Coupon || mongoose6.model("Coupon", CouponSchema);
    Coupon_default = Coupon;
  }
});

// src/models/Banner.ts
var Banner_exports = {};
__export(Banner_exports, {
  default: () => Banner_default
});
import mongoose7, { Schema as Schema6 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var BannerSchema, Banner, Banner_default;
var init_Banner = __esm({
  "src/models/Banner.ts"() {
    "use strict";
    BannerSchema = new Schema6({
      imageUrl: { type: String, required: true },
      title: { type: String },
      subtitle: { type: String },
      linkUrl: { type: String },
      isActive: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 0, index: true }
    }, { timestamps: true });
    Banner = mongoose7.models.Banner || mongoose7.model("Banner", BannerSchema);
    Banner_default = Banner;
  }
});

// src/models/Collection.ts
var Collection_exports = {};
__export(Collection_exports, {
  default: () => Collection_default
});
import mongoose8, { Schema as Schema7 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var CollectionSchema, Collection, Collection_default;
var init_Collection = __esm({
  "src/models/Collection.ts"() {
    "use strict";
    CollectionSchema = new Schema7({
      name: { type: String, required: true, trim: true },
      description: { type: String },
      tours: [{ type: Schema7.Types.ObjectId, ref: "Tour" }]
    }, { timestamps: true });
    Collection = mongoose8.models.Collection || mongoose8.model("Collection", CollectionSchema);
    Collection_default = Collection;
  }
});

// src/models/Settings.ts
var Settings_exports = {};
__export(Settings_exports, {
  default: () => Settings_default
});
import mongoose9, { Schema as Schema8 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var ReferralProgramSchema, SettingsSchema, Settings, Settings_default;
var init_Settings = __esm({
  "src/models/Settings.ts"() {
    "use strict";
    ReferralProgramSchema = new Schema8({
      rewardAmount: {
        type: Number,
        default: 0,
        min: 0,
        required: true
      },
      discountPercentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
        required: true
      }
    });
    SettingsSchema = new Schema8({
      referralProgram: {
        type: ReferralProgramSchema,
        default: () => ({})
      }
    }, {
      timestamps: true,
      // Ensure only one settings document exists
      collection: "settings"
    });
    SettingsSchema.index({}, { unique: true });
    Settings = mongoose9.models.Settings || mongoose9.model("Settings", SettingsSchema);
    Settings_default = Settings;
  }
});

// src/models/Review.ts
var Review_exports = {};
__export(Review_exports, {
  default: () => Review_default
});
import mongoose10, { Schema as Schema9 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var ReviewSchema, Review, Review_default;
var init_Review = __esm({
  "src/models/Review.ts"() {
    "use strict";
    init_Tour();
    ReviewSchema = new Schema9(
      {
        user: { type: Schema9.Types.ObjectId, ref: "User", required: true, index: true },
        tour: { type: Schema9.Types.ObjectId, ref: "Tour", required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
        rejectionReason: { type: String }
      },
      { timestamps: true }
    );
    ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });
    ReviewSchema.statics.calculateAverageRating = async function(tourId) {
      const stats = await this.aggregate([
        { $match: { tour: tourId, status: "approved" } },
        {
          $group: {
            _id: "$tour",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 }
          }
        }
      ]);
      const averageRating = stats[0]?.averageRating ?? 0;
      const reviewCount = stats[0]?.reviewCount ?? 0;
      await Tour_default.findByIdAndUpdate(tourId, { averageRating, reviewCount }, { new: true }).exec();
    };
    ReviewSchema.post("save", async function() {
      const review = this;
      await review.constructor.calculateAverageRating(review.tour);
    });
    ReviewSchema.post("remove", async function() {
      const review = this;
      await review.constructor.calculateAverageRating(review.tour);
    });
    Review = mongoose10.models.Review || mongoose10.model("Review", ReviewSchema);
    Review_default = Review;
  }
});

// src/models/Role.ts
var Role_exports = {};
__export(Role_exports, {
  default: () => Role_default
});
import mongoose11, { Schema as Schema10 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var RoleSchema, Role, Role_default;
var init_Role = __esm({
  "src/models/Role.ts"() {
    "use strict";
    RoleSchema = new Schema10({
      name: { type: String, required: true, unique: true },
      permissions: [{ type: String }]
    }, { timestamps: true });
    Role = mongoose11.models.Role || mongoose11.model("Role", RoleSchema);
    Role_default = Role;
  }
});

// src/models/Story.ts
var Story_exports = {};
__export(Story_exports, {
  default: () => Story_default
});
import mongoose12, { Schema as Schema11 } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
var StorySchema, Story, Story_default;
var init_Story = __esm({
  "src/models/Story.ts"() {
    "use strict";
    StorySchema = new Schema11(
      {
        author: { type: Schema11.Types.ObjectId, ref: "User", required: true, index: true },
        destination: { type: Schema11.Types.ObjectId, ref: "Destination" },
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        coverImage: { type: String },
        tags: [{ type: String, index: true }],
        likes: [{ type: Schema11.Types.ObjectId, ref: "User" }],
        likeCount: { type: Number, default: 0 },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
        rejectionReason: { type: String }
      },
      { timestamps: true }
    );
    StorySchema.pre("save", function(next) {
      const story = this;
      if (story.isModified("likes")) {
        story.likeCount = story.likes.length;
      }
      next();
    });
    Story = mongoose12.models.Story || mongoose12.model("Story", StorySchema);
    Story_default = Story;
  }
});

// src/pages/api/admin/tours/index.ts
var tours_exports = {};
__export(tours_exports, {
  default: () => tours_default
});
import mongoose13 from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js";
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
async function handler(req, res) {
  const handlerName = "/api/admin/tours";
  try {
    console.log(`[${handlerName}] Starting request processing...`);
    await dbConnect();
    console.log(`[${handlerName}] Database connected successfully.`);
    switch (req.method) {
      case "GET":
        console.log(`[${handlerName}] Received GET request.`);
        const url = new URL(req.url || "", "http://localhost");
        const {
          page = "1",
          limit = "10",
          status,
          destinationId,
          ownerId,
          search
        } = Object.fromEntries(url.searchParams);
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const matchStage = {};
        if (status) matchStage.status = status;
        if (destinationId) matchStage.destination = new mongoose13.Types.ObjectId(destinationId);
        if (ownerId) matchStage.owner = new mongoose13.Types.ObjectId(ownerId);
        if (search) matchStage.title = { $regex: search, $options: "i" };
        console.log(`[${handlerName}] Executing aggregation with match stage:`, matchStage);
        console.log(`[${handlerName}] Pagination: page=${pageNum}, limit=${limitNum}, skip=${skip}`);
        const pipeline = [
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: [
                { $skip: skip },
                { $limit: limitNum },
                { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "ownerInfo" } },
                { $lookup: { from: "destinations", localField: "destination", foreignField: "_id", as: "destinationInfo" } },
                { $lookup: { from: "bookings", localField: "_id", foreignField: "tour", as: "bookings" } },
                // Unwind owner and destination to handle cases where lookup might be empty
                { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$destinationInfo", preserveNullAndEmptyArrays: true } },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                    mainImage: 1,
                    price: 1,
                    averageRating: 1,
                    reviewCount: 1,
                    status: 1,
                    // Use $ifNull to prevent errors if a relationship is missing
                    owner: {
                      _id: { $ifNull: ["$ownerInfo._id", null] },
                      name: { $ifNull: ["$ownerInfo.name", "N/A"] }
                    },
                    destination: {
                      _id: { $ifNull: ["$destinationInfo._id", null] },
                      name: { $ifNull: ["$destinationInfo.name", "N/A"] }
                    },
                    bookingCount: { $size: "$bookings" },
                    totalRevenue: { $sum: "$bookings.totalPrice" }
                  }
                }
              ]
            }
          }
        ];
        console.log(`[${handlerName}] Executing aggregation pipeline...`);
        const [results] = await Tour_default.aggregate(pipeline);
        console.log(`[${handlerName}] Aggregation completed. Raw results:`, JSON.stringify(results, null, 2));
        const tours = results.data || [];
        const totalTours = results.metadata[0]?.total || 0;
        const totalPages = Math.ceil(totalTours / limitNum);
        console.log(`[${handlerName}] Aggregation successful. Found ${totalTours} total tours, returning ${tours.length}.`);
        return send(res, 200, {
          success: true,
          data: {
            tours,
            pagination: {
              currentPage: pageNum,
              totalPages,
              totalTours
            }
          }
        });
      case "POST":
        console.log(`[${handlerName}] Received POST request.`);
        let body = "";
        await new Promise((resolve) => {
          req.on("data", (chunk) => body += chunk.toString());
          req.on("end", () => resolve());
        });
        const payload = JSON.parse(body || "{}");
        console.log(`[${handlerName}] Creating tour with payload:`, payload);
        const created = await Tour_default.create(payload);
        console.log(`[${handlerName}] Tour created successfully:`, created._id);
        return send(res, 201, { success: true, data: created });
      default:
        console.log(`[${handlerName}] Method ${req.method} not allowed.`);
        res.setHeader("Allow", ["GET", "POST"]);
        return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`[ERROR in ${handlerName}]`, error);
    console.error(`[ERROR in ${handlerName}] Stack trace:`, error.stack);
    return send(res, 500, { success: false, error: `Server Error: ${error.message}` });
  }
}
var tours_default;
var init_tours = __esm({
  "src/pages/api/admin/tours/index.ts"() {
    "use strict";
    init_dbConnect();
    init_Tour();
    tours_default = handler;
  }
});

// src/lib/api/mediaHandler.ts
var mediaHandler_exports = {};
__export(mediaHandler_exports, {
  handleImageUpload: () => handleImageUpload
});
import formidable from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/formidable/src/index.js";
import fs from "fs";
import path from "path";
function handleImageUpload(req, res) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024
      // 10MB
    });
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("[FORMIDABLE ERROR]", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: `File parsing error: ${err.message}` }));
        return resolve();
      }
      const filesArray = files.file;
      if (!filesArray || filesArray.length === 0) {
        console.error('[MEDIA HANDLER] The "file" array is missing or empty.');
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: "Kh\xF4ng c\xF3 file n\xE0o \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn." }));
        return resolve();
      }
      const uploadedFile = filesArray[0];
      if (!uploadedFile) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: "File t\u1EA3i l\xEAn kh\xF4ng h\u1EE3p l\u1EC7." }));
        return resolve();
      }
      const publicUrl = `/uploads/images/${path.basename(uploadedFile.filepath)}`;
      console.log(`[MEDIA HANDLER] File uploaded successfully. Public URL: ${publicUrl}`);
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, data: { url: publicUrl } }));
      return resolve();
    });
  });
}
var init_mediaHandler = __esm({
  "src/lib/api/mediaHandler.ts"() {
    "use strict";
  }
});

// src/lib/auth/getAuthUser.ts
import jwt2 from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/jsonwebtoken/index.js";
import cookie from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js";
function getAuthUser(req) {
  const handlerName = "getAuthUser";
  try {
    if (!req.headers.cookie) {
      console.log(`[${handlerName}] No cookies found on the request.`);
      return null;
    }
    const cookies = parse(req.headers.cookie);
    const token = cookies.auth_token;
    if (!token) {
      console.log(`[${handlerName}] 'auth_token' cookie not found.`);
      return null;
    }
    const decoded = verify(token, process.env.JWT_SECRET);
    console.log(`[${handlerName}] Token successfully verified for user ID: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error(`[${handlerName}] Token verification failed:`, error);
    return null;
  }
}
var verify, parse;
var init_getAuthUser = __esm({
  "src/lib/auth/getAuthUser.ts"() {
    "use strict";
    ({ verify } = jwt2);
    ({ parse } = cookie);
  }
});

// src/lib/api/storyHandler.ts
var storyHandler_exports = {};
__export(storyHandler_exports, {
  handleCreateStory: () => handleCreateStory
});
import { z } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/zod/index.js";
function send2(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
async function handleCreateStory(req, res) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return send2(res, 401, { success: false, error: "Kh\xF4ng \u0111\u01B0\u1EE3c ph\xE9p truy c\u1EADp" });
    }
    await dbConnect();
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyString = Buffer.concat(chunks).toString("utf8");
    const body = bodyString ? JSON.parse(bodyString) : {};
    console.log("--- Backend Received Story Data ---");
    console.log("Raw body string:", bodyString);
    console.log("Parsed body:", body);
    console.log("Body type:", typeof body);
    console.log("Body keys:", Object.keys(body));
    console.log("Body values:", Object.values(body));
    console.log("Authenticated user ID:", authUser.userId);
    console.log("---------------------------------");
    const validationResult = CreateStorySchema.safeParse(body);
    console.log("--- Validation Result ---");
    console.log("Validation success:", validationResult.success);
    if (!validationResult.success) {
      console.log("Validation errors:", validationResult.error.errors);
    }
    console.log("------------------------");
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return send2(res, 400, {
        success: false,
        error: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
        details: errors
      });
    }
    const storyData = validationResult.data;
    const userId = authUser.userId;
    const story = await Story_default.create({
      author: userId,
      title: storyData.title,
      content: storyData.content,
      coverImage: storyData.coverImageUrl,
      tags: storyData.tags,
      destination: storyData.destinationId || void 0,
      status: "pending",
      // Default status for moderation
      likes: [],
      likeCount: 0
    });
    return send2(res, 201, {
      success: true,
      data: story,
      message: "B\xE0i vi\u1EBFt \u0111\xE3 \u0111\u01B0\u1EE3c t\u1EA1o th\xE0nh c\xF4ng v\xE0 \u0111ang ch\u1EDD ki\u1EC3m duy\u1EC7t"
    });
  } catch (error) {
    console.error("Create story error:", error);
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return send2(res, 400, {
        success: false,
        error: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
        details: validationErrors
      });
    }
    if (error.code === 11e3) {
      return send2(res, 400, {
        success: false,
        error: "B\xE0i vi\u1EBFt v\u1EDBi ti\xEAu \u0111\u1EC1 n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i"
      });
    }
    return send2(res, 500, {
      success: false,
      error: "L\u1ED7i server, vui l\xF2ng th\u1EED l\u1EA1i sau"
    });
  }
}
var CreateStorySchema;
var init_storyHandler = __esm({
  "src/lib/api/storyHandler.ts"() {
    "use strict";
    init_dbConnect();
    init_getAuthUser();
    init_Story();
    CreateStorySchema = z.object({
      title: z.string().min(1, "Ti\xEAu \u0111\u1EC1 kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng").max(200, "Ti\xEAu \u0111\u1EC1 kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 200 k\xFD t\u1EF1"),
      content: z.string().min(10, "N\u1ED9i dung ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 10 k\xFD t\u1EF1"),
      coverImageUrl: z.string().min(1, "Vui l\xF2ng t\u1EA3i l\xEAn m\u1ED9t \u1EA3nh b\xECa."),
      tags: z.array(z.string().min(1, "Tag kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng")).max(10, "Kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 10 tags"),
      destinationId: z.string().optional()
    });
  }
});

// src/lib/api/destinationHandler.ts
var destinationHandler_exports = {};
__export(destinationHandler_exports, {
  handleGetDestinationBySlug: () => handleGetDestinationBySlug
});
async function handleGetDestinationBySlug(req, res, slug) {
  try {
    await dbConnect();
    const destination = await Destination_default.findOne({ slug, status: "published" }).lean();
    if (!destination) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ success: false, error: "Destination not found." }));
    }
    const associatedTours = await Tour_default.find({ destination: destination._id, status: "published" }).select({
      title: 1,
      price: 1,
      duration: 1,
      averageRating: 1,
      reviewCount: 1,
      isSustainable: 1,
      mainImage: 1,
      destination: 1
    }).populate({ path: "destination", select: { name: 1 } }).lean();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      success: true,
      data: {
        destination: { ...destination, _id: String(destination._id) },
        associatedTours: associatedTours.map((t) => ({ ...t, _id: String(t._id) }))
      }
    }));
  } catch (error) {
    console.error(`[API Handler Error] /api/destinations/${slug}:`, error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: `Server Error: ${error.message}` }));
  }
}
var init_destinationHandler = __esm({
  "src/lib/api/destinationHandler.ts"() {
    "use strict";
    init_dbConnect();
    init_Destination();
    init_Tour();
  }
});

// src/pages/api/tours/search.ts
var search_exports = {};
__export(search_exports, {
  default: () => search_default
});
function send3(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
async function handler2(req, res) {
  const handlerName = "/api/tours/search";
  try {
    console.log(`[${handlerName}] Starting request processing...`);
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return send3(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
    }
    await dbConnect();
    console.log(`[${handlerName}] Database connected successfully.`);
    const url = new URL(req.url || "", "http://localhost");
    const queryParams = Object.fromEntries(url.searchParams);
    const {
      destinationSlug,
      startDate,
      adults,
      minPrice,
      maxPrice,
      minRating,
      duration,
      sortBy = "relevance",
      page = "1",
      limit = "12"
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
      limit
    });
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const minRatingNum = minRating ? parseFloat(minRating) : void 0;
    const pipeline = [];
    if (destinationSlug) {
      const inputSlug = String(destinationSlug).trim();
      const normalizeSlug = (s) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const normalized = normalizeSlug(inputSlug);
      console.log(`[${handlerName}] Received destinationSlug="${inputSlug}", normalized="${normalized}"`);
      let destination = await Destination_default.findOne({ slug: inputSlug, status: "published" }).lean();
      console.log(`[${handlerName}] Destination exact lookup result:`, destination?._id || null);
      if (!destination && normalized && normalized !== inputSlug) {
        destination = await Destination_default.findOne({ slug: normalized, status: "published" }).lean();
        console.log(`[${handlerName}] Destination normalized lookup result:`, destination?._id || null);
      }
      if (!destination && normalized) {
        const regex = new RegExp(normalized.replace(/[-]+/g, "[-]*"), "i");
        destination = await Destination_default.findOne({ slug: { $regex: regex }, status: "published" }).lean();
        console.log(`[${handlerName}] Destination regex lookup result:`, destination?._id || null, ` regex=/${regex.source}/i`);
      }
      if (!destination) {
        console.log(`[${handlerName}] No destination matched for slug. Returning empty successful response.`);
        return send3(res, 200, {
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
                minPrice: minPrice ? parseInt(minPrice, 10) : void 0,
                maxPrice: maxPrice ? parseInt(maxPrice, 10) : void 0,
                minRating: minRating ? parseFloat(minRating) : void 0,
                duration: duration ? duration.split(",") : void 0,
                sortBy
              }
            }
          }
        });
      }
      const matchStage = {
        destination: destination._id,
        status: "published"
      };
      console.log(`[${handlerName}] Final $match (destination + status):`, matchStage);
      pipeline.push({ $match: matchStage });
    } else {
      pipeline.push({
        $match: { status: "published" }
      });
    }
    const additionalFilters = {};
    if (minPrice || maxPrice) {
      additionalFilters.price = {};
      if (minPrice) additionalFilters.price.$gte = parseInt(minPrice, 10);
      if (maxPrice) additionalFilters.price.$lte = parseInt(maxPrice, 10);
    }
    if (duration) {
      const durationValues = duration.includes(",") ? duration.split(",") : [duration];
      additionalFilters.duration = { $in: durationValues };
    }
    if (Object.keys(additionalFilters).length > 0) {
      console.log(`[${handlerName}] Additional filters to apply:`, additionalFilters);
      pipeline.push({ $match: additionalFilters });
    }
    pipeline.push(
      {
        $lookup: {
          from: "destinations",
          localField: "destination",
          foreignField: "_id",
          as: "destinationInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo"
        }
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "tour",
          as: "reviews"
        }
      }
    );
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
    let sortStage = {};
    switch (sortBy) {
      case "price_asc":
        sortStage = { price: 1 };
        break;
      case "price_desc":
        sortStage = { price: -1 };
        break;
      case "rating_desc":
        sortStage = { averageRating: -1 };
        break;
      case "relevance":
      default:
        sortStage = {
          averageRating: -1,
          reviewCount: -1
        };
        break;
    }
    pipeline.push({
      $facet: {
        paginatedResults: [
          ...minRatingNum ? [{ $match: { averageRating: { $gte: minRatingNum } } }] : [],
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limitNum }
        ],
        metadata: [
          ...minRatingNum ? [{ $match: { averageRating: { $gte: minRatingNum } } }] : [],
          { $count: "total" }
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
    const [results] = await Tour_default.aggregate(pipeline);
    const tours = results?.paginatedResults || [];
    const totalTours = results?.metadata?.[0]?.total || 0;
    const ratingsFacet = results?.filterCounts?.[0] || {};
    const totalPages = Math.ceil(totalTours / limitNum);
    console.log(`[${handlerName}] Search completed. Found ${totalTours} total tours, returning ${tours.length}.`);
    return send3(res, 200, {
      success: true,
      data: {
        tours,
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
            minPrice: minPrice ? parseInt(minPrice, 10) : void 0,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : void 0,
            minRating: minRating ? parseFloat(minRating) : void 0,
            duration: duration ? duration.split(",") : void 0,
            sortBy
          }
        }
      }
    });
  } catch (error) {
    console.error(`[ERROR in ${handlerName}]`, error);
    console.error(`[ERROR in ${handlerName}] Stack trace:`, error.stack);
    return send3(res, 500, {
      success: false,
      error: `Server Error: ${error.message}`
    });
  }
}
var search_default;
var init_search = __esm({
  "src/pages/api/tours/search.ts"() {
    "use strict";
    init_dbConnect();
    init_Tour();
    init_Destination();
    search_default = handler2;
  }
});

// src/lib/api/tourHandler.ts
var tourHandler_exports = {};
__export(tourHandler_exports, {
  handleGetTourById: () => handleGetTourById
});
async function handleGetTourById(req, res, id) {
  try {
    await dbConnect();
    const tour = await Tour_default.findById(id).populate({ path: "destination", select: "name slug" }).populate({ path: "owner", select: "name avatar" }).lean();
    if (!tour) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ success: false, error: "Tour not found." }));
    }
    const reviews = await Review_default.find({ tour: tour._id, status: "approved" }).sort({ createdAt: -1 }).limit(5).populate({ path: "user", select: "name avatar" }).lean();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      success: true,
      data: {
        tour: { ...tour, _id: String(tour._id) },
        reviews: reviews.map((r) => ({ ...r, _id: String(r._id) }))
      }
    }));
  } catch (error) {
    const message = error?.message || "Server Error";
    const isCastError = /Cast to ObjectId failed/.test(message);
    res.statusCode = isCastError ? 400 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: isCastError ? "Invalid tour id." : `Server Error: ${message}` }));
  }
}
var init_tourHandler = __esm({
  "src/lib/api/tourHandler.ts"() {
    "use strict";
    init_dbConnect();
    init_Tour();
    init_Review();
  }
});

// src/utils/format.ts
var format_exports = {};
__export(format_exports, {
  formatCurrencyVND: () => formatCurrencyVND,
  formatDate: () => formatDate
});
import { format } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/date-fns/index.mjs";
import { vi } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/date-fns/locale.mjs";
function formatDate(date, pattern = "d 'th\xE1ng' M, yyyy") {
  if (!date) return "";
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return format(d, pattern, { locale: vi });
  } catch {
    return "";
  }
}
function formatCurrencyVND(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}
var init_format = __esm({
  "src/utils/format.ts"() {
    "use strict";
  }
});

// src/lib/api/journeysHandler.ts
var journeysHandler_exports = {};
__export(journeysHandler_exports, {
  handleGetUserJourneys: () => handleGetUserJourneys
});
async function handleGetUserJourneys(req, res) {
  try {
    const dbConnect2 = (await Promise.resolve().then(() => (init_dbConnect(), dbConnect_exports))).default;
    const Booking2 = (await Promise.resolve().then(() => (init_Booking(), Booking_exports))).default;
    const { formatDate: formatDate2 } = await Promise.resolve().then(() => (init_format(), format_exports));
    await dbConnect2();
    const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
    const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
    const cookies = parse2(req.headers.cookie || "");
    const token = cookies["auth_token"];
    if (!token) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ success: false, error: "Authentication required." }));
    }
    const payload = verifyJwt2(token);
    if (!payload) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ success: false, error: "Invalid or expired token." }));
    }
    const { userId } = payload;
    const userBookings = await Booking2.find({
      user: userId,
      status: "confirmed"
      // Using 'confirmed' as completed status since the model doesn't have 'completed'
    }).sort({ bookingDate: -1 }).populate({
      path: "tour",
      select: "title duration"
      // Only select the fields we absolutely need
    }).lean();
    const journeys = userBookings.map((booking) => ({
      id: booking._id.toString(),
      title: booking.tour?.title || booking.tourInfo?.title || "Tour kh\xF4ng x\xE1c \u0111\u1ECBnh",
      dateRange: formatDate2(booking.bookingDate, "dd/MM/yyyy"),
      status: "\u0110\xE3 ho\xE0n th\xE0nh",
      participants: booking.participants,
      totalPrice: booking.totalPrice
    }));
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      success: true,
      data: journeys
    }));
  } catch (error) {
    console.error("[API Handler Error] GET /api/users/journeys:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      success: false,
      error: `Server Error: ${errorMessage}`
    }));
  }
}
var init_journeysHandler = __esm({
  "src/lib/api/journeysHandler.ts"() {
    "use strict";
  }
});

// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/vite/dist/node/index.js";
import path2 from "path";
import react from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/@vitejs/plugin-react-swc/index.js";

// src/lib/api/bookingHandler.ts
init_dbConnect();
init_Booking();
init_Tour();
init_jwt();
import { parse as parseCookie } from "file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js";
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => body += chunk.toString());
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
async function handleCreateBooking(req, res) {
  try {
    await dbConnect();
    const cookies = parseCookie(req.headers.cookie || "");
    const token = cookies["auth_token"];
    const payload = token ? verifyJwt(token) : null;
    if (!payload) {
      return sendJson(res, 401, { success: false, error: "Authentication required." });
    }
    const body = await parseBody(req);
    const tourId = body?.tourId;
    const bookingDateRaw = body?.bookingDate;
    const participantsTotal = body?.participants;
    const participantsBreakdown = body?.participantsBreakdown;
    const customerInfo = body?.customerInfo;
    const paymentMethod = body?.paymentMethod;
    if (!tourId || !bookingDateRaw || !participantsTotal || !customerInfo) {
      return sendJson(res, 400, { success: false, error: "Missing required fields." });
    }
    const adults = Math.max(0, Number(participantsBreakdown?.adults || participantsTotal));
    const children = Math.max(0, Number(participantsBreakdown?.children || 0));
    const computedTotalParticipants = adults + children;
    if (computedTotalParticipants !== Number(participantsTotal)) {
      return sendJson(res, 400, { success: false, error: "Participants mismatch." });
    }
    const bookingDate = new Date(bookingDateRaw);
    if (isNaN(bookingDate.getTime())) {
      return sendJson(res, 400, { success: false, error: "Invalid bookingDate." });
    }
    const tour = await Tour_default.findById(tourId);
    if (!tour) {
      return sendJson(res, 404, { success: false, error: "Tour not found." });
    }
    const pricePerAdult = Number(tour.price || 0);
    const pricePerChild = pricePerAdult * 0.7;
    const basePrice = adults * pricePerAdult + children * pricePerChild;
    const taxes = Math.round(basePrice * 0);
    const fees = 0;
    const totalPrice = basePrice + taxes + fees;
    const newBooking = await Booking_default.create({
      user: (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.Types.ObjectId.createFromHexString(payload.userId),
      tour: tour._id,
      tourInfo: {
        title: tour.title,
        price: tour.price,
        duration: tour.duration
      },
      bookingDate,
      participants: computedTotalParticipants,
      participantsBreakdown: { adults, children },
      totalPrice,
      priceBreakdown: { basePrice, taxes, fees },
      paymentMethod,
      status: "pending",
      history: [
        { at: /* @__PURE__ */ new Date(), action: "Booking created (pending)" }
      ]
    });
    return sendJson(res, 201, { success: true, data: newBooking });
  } catch (error) {
    console.error("[API] POST /api/bookings error:", error);
    return sendJson(res, 500, { success: false, error: error?.message || "Server Error" });
  }
}

// vite.config.ts
init_Destination();
init_Tour();
init_User();
init_dbConnect();
var __vite_injected_original_dirname = "C:\\viet-adventure-connect\\viet-adventure-connect";
var haLongBayData = {
  name: "V\u1ECBnh H\u1EA1 Long",
  slug: "ha-long-bay",
  description: "V\u1ECBnh H\u1EA1 Long - m\u1ED9t trong b\u1EA3y k\u1EF3 quan thi\xEAn nhi\xEAn m\u1EDBi c\u1EE7a th\u1EBF gi\u1EDBi...",
  history: "...",
  culture: "...",
  geography: "...",
  mainImage: "https://images.unsplash.com/photo-1590237739814-a089f6483656",
  imageGallery: ["..."],
  bestTimeToVisit: "...",
  essentialTips: ["..."],
  status: "published"
};
var toursForHaLong = [{ title: "Du thuy\u1EC1n 2 ng\xE0y 1 \u0111\xEAm...", price: 25e5, duration: "2 ng\xE0y 1 \u0111\xEAm", maxGroupSize: 20, description: "...", itinerary: [], inclusions: [], exclusions: [], isSustainable: true }, { title: "Tour trong ng\xE0y...", price: 85e4, duration: "1 ng\xE0y", maxGroupSize: 40, description: "...", itinerary: [], inclusions: [], exclusions: [] }];
async function seedDatabase() {
  console.log("[SEEDER] Connecting to database...");
  await dbConnect();
  console.log("[SEEDER] Cleaning old data to ensure idempotency...");
  const oldDestination = await Destination_default.findOne({ slug: "ha-long-bay" });
  if (oldDestination) {
    await Tour_default.deleteMany({ destination: oldDestination._id });
    await Destination_default.deleteOne({ _id: oldDestination._id });
  }
  console.log("[SEEDER] Creating new data...");
  const createdDestination = await Destination_default.create({
    ...haLongBayData,
    status: "published"
    // Set status to published so it's searchable
  });
  let ownerUser = await User_default.findOne({ role: "partner" });
  if (!ownerUser) {
    ownerUser = await User_default.findOne({ role: "admin" });
    if (!ownerUser) {
      ownerUser = await User_default.create({ name: "Seed Admin", email: "seed-admin@example.com", password: "Password123!", role: "admin" });
    }
  }
  const toursWithDestinationId = toursForHaLong.map((tour) => ({ ...tour, destination: createdDestination._id, owner: ownerUser._id }));
  await Tour_default.insertMany(toursWithDestinationId);
  console.log("[SEEDER] Seeding complete!");
  const sampleTours = await Tour_default.find().limit(5).lean();
  const sampleDestinations = await Destination_default.find().limit(5).lean();
  console.log("--- DATABASE VERIFICATION (Vite Seeder) ---");
  console.log("Sample Tours from DB:", JSON.stringify(sampleTours, null, 2));
  console.log("Sample Destinations from DB:", JSON.stringify(sampleDestinations, null, 2));
}
function seedApiPlugin() {
  return {
    name: "vite-plugin-seed-endpoint",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl || req.url || "";
        const method = req.method;
        if (method === "POST" && url.startsWith("/api/bookings")) {
          console.log("[API ROUTER] Handling POST /api/bookings");
          return handleCreateBooking(req, res);
        }
        return next();
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/bookings")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        if (!token) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
        }
        const payload = verifyJwt2(token);
        if (!payload || !["admin", "staff"].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        const method = req.method;
        try {
          if (method === "GET" && url === "/api/admin/bookings") {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            const u = new URL(url, "http://localhost");
          }
          if (method === "GET" && url.startsWith("/api/admin/bookings")) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const fullUrl = new URL(req.originalUrl || url, "http://localhost");
            const page = Number(fullUrl.searchParams.get("page") || "1");
            const limit = Math.min(100, Number(fullUrl.searchParams.get("limit") || "20"));
            const q = (fullUrl.searchParams.get("q") || "").trim();
            const statusStr = fullUrl.searchParams.get("status") || "";
            const ownerId = fullUrl.searchParams.get("ownerId") || "";
            const dateFrom = fullUrl.searchParams.get("from");
            const dateTo = fullUrl.searchParams.get("to");
            const matchStage = {};
            if (statusStr && typeof statusStr === "string" && statusStr !== "all") {
              const allowedStatuses = ["pending", "confirmed", "completed", "cancelled", "refunded"];
              if (allowedStatuses.includes(statusStr)) {
                matchStage.status = statusStr;
              }
            }
            if (dateFrom || dateTo) {
              matchStage.bookingDate = {};
              if (dateFrom) matchStage.bookingDate.$gte = new Date(dateFrom);
              if (dateTo) matchStage.bookingDate.$lte = new Date(dateTo);
            }
            if (ownerId) {
              matchStage["tour.owner"] = new (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.Types.ObjectId(ownerId);
            }
            console.log(`[BOOKINGS API] Match stage:`, JSON.stringify(matchStage, null, 2));
            console.log(`[BOOKINGS API] Query params: status=${statusStr}, search=${q}, ownerId=${ownerId}, page=${page}, limit=${limit}`);
            const pipeline = [
              // First stage: Apply filters to the main booking collection
              { $match: matchStage },
              { $sort: { createdAt: -1 } },
              // Lookup related data
              { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              { $lookup: { from: "tours", localField: "tour", foreignField: "_id", as: "tour" } },
              { $unwind: { path: "$tour", preserveNullAndEmptyArrays: true } },
              { $lookup: { from: "users", localField: "tour.owner", foreignField: "_id", as: "owner" } },
              { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
              // Apply search filter after lookups (if search query provided)
              ...q ? [{
                $match: {
                  $or: [
                    { _id: { $regex: q, $options: "i" } },
                    { "tour.title": { $regex: q, $options: "i" } },
                    { "user.name": { $regex: q, $options: "i" } },
                    { "user.email": { $regex: q, $options: "i" } }
                  ]
                }
              }] : [],
              // Pagination
              { $skip: (page - 1) * limit },
              { $limit: limit }
            ];
            const [rows, totalArr] = await Promise.all([
              (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.connection.collection("bookings").aggregate(pipeline).toArray(),
              // Count total documents with the same filters (excluding search and pagination)
              (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.connection.collection("bookings").countDocuments(matchStage)
            ]);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows, total: totalArr }));
          }
          const singleMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)$/);
          if (method === "GET" && singleMatch) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const id = singleMatch[1];
            const doc = await Booking2.findById(id).populate("user", "name email avatar").populate({ path: "tour", select: "title owner mainImage", populate: { path: "owner", select: "name email" } }).lean();
            if (!doc) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Not found" }));
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          const statusMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)\/status$/);
          if (method === "PUT" && statusMatch) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const id = statusMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { status, note } = body || {};
            if (!["pending", "confirmed", "cancelled", "refunded", "completed"].includes(status)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid status" }));
            }
            const update = { status };
            const historyEntry = { at: /* @__PURE__ */ new Date(), action: `Status updated to '${status}'`, by: payload.userId ? (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.Types.ObjectId.createFromHexString(payload.userId) : void 0, note };
            const doc = await (await Promise.resolve().then(() => (init_Booking(), Booking_exports))).default.findByIdAndUpdate(id, { $set: update, $push: { history: historyEntry } }, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          const resendMatch = url.match(/^\/api\/admin\/bookings\/([^/]+)\/resend-confirmation$/);
          if (method === "POST" && resendMatch) {
            const id = resendMatch[1];
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, message: "Resent confirmation email", id }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/coupons") && !url.startsWith("/api/admin/banners") && !url.startsWith("/api/admin/collections") && !url.startsWith("/api/bookings/apply-coupon")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        const isAdmin = !!payload && payload.role === "admin";
        const isStaff = !!payload && ["admin", "staff"].includes(payload.role);
        await dbConnect();
        const method = req.method;
        try {
          if (url === "/api/admin/coupons" && method === "GET") {
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            const rows = await Coupon2.find({}).sort({ createdAt: -1 }).lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === "/api/admin/coupons" && method === "POST") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const created = await Coupon2.create(body);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          const couponMatch = url.match(/^\/api\/admin\/coupons\/([^/]+)$/);
          if (couponMatch && method === "PUT") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = couponMatch[1];
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const updated = await Coupon2.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (couponMatch && method === "DELETE") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = couponMatch[1];
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            await Coupon2.findByIdAndDelete(id);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/admin/banners" && method === "GET") {
            const { default: Banner2 } = await Promise.resolve().then(() => (init_Banner(), Banner_exports));
            const rows = await Banner2.find({}).sort({ displayOrder: 1 }).lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === "/api/admin/banners" && method === "POST") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Banner2 } = await Promise.resolve().then(() => (init_Banner(), Banner_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const highestOrderBanner = await Banner2.findOne({}).sort({ displayOrder: -1 }).lean();
            const newDisplayOrder = (highestOrderBanner?.displayOrder || 0) + 1;
            const bannerData = { ...body, displayOrder: newDisplayOrder };
            const created = await Banner2.create(bannerData);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          const bannerMatch = url.match(/^\/api\/admin\/banners\/([^/]+)$/);
          if (bannerMatch && method === "PUT") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Banner2 } = await Promise.resolve().then(() => (init_Banner(), Banner_exports));
            const id = bannerMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const updated = await Banner2.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (bannerMatch && method === "DELETE") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Banner2 } = await Promise.resolve().then(() => (init_Banner(), Banner_exports));
            const id = bannerMatch[1];
            await Banner2.findByIdAndDelete(id);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/admin/banners/reorder" && method === "PUT") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Banner2 } = await Promise.resolve().then(() => (init_Banner(), Banner_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { order } = body || { order: [] };
            for (const it of order || []) {
              await Banner2.findByIdAndUpdate(it.id, { displayOrder: it.displayOrder });
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/admin/collections" && method === "GET") {
            const { default: Collection2 } = await Promise.resolve().then(() => (init_Collection(), Collection_exports));
            const rows = await Collection2.find({}).populate("tours", "title mainImage").sort({ createdAt: -1 }).lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === "/api/admin/collections" && method === "POST") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Collection2 } = await Promise.resolve().then(() => (init_Collection(), Collection_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const created = await Collection2.create(body);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          const collectionMatch = url.match(/^\/api\/admin\/collections\/([^/]+)$/);
          if (collectionMatch && method === "PUT") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Collection2 } = await Promise.resolve().then(() => (init_Collection(), Collection_exports));
            const id = collectionMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const updated = await Collection2.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (collectionMatch && method === "DELETE") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Collection2 } = await Promise.resolve().then(() => (init_Collection(), Collection_exports));
            const id = collectionMatch[1];
            await Collection2.findByIdAndDelete(id);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/admin/settings/referral" && method === "GET") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Settings2 } = await Promise.resolve().then(() => (init_Settings(), Settings_exports));
            let settings = await Settings2.findOne({}).lean();
            if (!settings) {
              settings = await Settings2.create({});
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: settings.referralProgram }));
          }
          if (url === "/api/admin/settings/referral" && method === "PUT") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const { default: Settings2 } = await Promise.resolve().then(() => (init_Settings(), Settings_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { rewardAmount, discountPercentage } = body;
            if (typeof rewardAmount !== "number" || rewardAmount < 0) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid reward amount" }));
            }
            if (typeof discountPercentage !== "number" || discountPercentage < 0 || discountPercentage > 100) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid discount percentage" }));
            }
            const updated = await Settings2.findOneAndUpdate(
              {},
              { referralProgram: { rewardAmount, discountPercentage } },
              { upsert: true, new: true }
            );
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated.referralProgram }));
          }
          if (url === "/api/bookings/apply-coupon" && method === "POST") {
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { bookingId, couponCode } = body || {};
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            if (!bookingId || !couponCode) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "bookingId and couponCode are required" }));
            }
            const booking = await Booking2.findById(bookingId).populate("user", "_id").populate("tour", "owner destination").lean();
            if (!booking) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Booking not found" }));
            }
            const coupon = await Coupon2.findOne({ code: couponCode }).lean();
            if (!coupon || !coupon.isActive) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid coupon" }));
            }
            const now = /* @__PURE__ */ new Date();
            if (coupon.startDate && now < coupon.startDate) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon not started" }));
            }
            if (coupon.endDate && now > coupon.endDate) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon expired" }));
            }
            if (coupon.limits?.totalUses && coupon.usedCount >= coupon.limits.totalUses) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon usage limit reached" }));
            }
            if (coupon.limits?.usesPerCustomer && (coupon.usedBy || []).some((u) => String(u) === String(booking.user._id))) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon already used by this customer" }));
            }
            if (coupon.rules?.minimumSpend && booking.totalPrice < coupon.rules.minimumSpend) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Minimum spend not met" }));
            }
            if (coupon.rules?.applicableToTours?.length && !coupon.rules.applicableToTours.some((id) => String(id) === String(booking.tour))) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon not applicable to this tour" }));
            }
            if (coupon.rules?.applicableToDestinations?.length && !coupon.rules.applicableToDestinations.some((id) => String(id) === String(booking.tour.destination))) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon not applicable to this destination" }));
            }
            if (coupon.rules?.applicableToPartners?.length && !coupon.rules.applicableToPartners.some((id) => String(id) === String(booking.tour.owner))) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Coupon not applicable to this partner" }));
            }
            let discount = 0;
            if (coupon.discountType === "percentage") discount = (booking.totalPrice || 0) * (coupon.discountValue / 100);
            else discount = coupon.discountValue;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: { discount, newTotal: Math.max(0, (booking.totalPrice || 0) - discount) } }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/analytics")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        if (!payload || !["admin", "staff"].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        const u = new URL(req.originalUrl || url, "http://localhost");
        const startDate = u.searchParams.get("startDate") ? new Date(String(u.searchParams.get("startDate"))) : new Date(Date.now() - 30 * 24 * 3600 * 1e3);
        const endDate = u.searchParams.get("endDate") ? new Date(String(u.searchParams.get("endDate"))) : /* @__PURE__ */ new Date();
        try {
          if (url.startsWith("/api/admin/analytics/overview")) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            const revAgg = await Booking2.aggregate([
              { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ["confirmed", "refunded", "cancelled", "pending"] } } },
              { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]);
            const kpis = await Promise.all([
              Booking2.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ["confirmed", "refunded", "cancelled", "pending"] } } }, { $group: { _id: null, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } }]),
              User2.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
              Tour2.aggregate([{ $group: { _id: null, avgRating: { $avg: "$averageRating" } } }])
            ]);
            const topTours = await Booking2.aggregate([
              { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: "$tour", revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
              { $sort: { revenue: -1 } },
              { $limit: 5 },
              { $lookup: { from: "tours", localField: "_id", foreignField: "_id", as: "tour" } },
              { $unwind: "$tour" }
            ]);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: { revAgg, kpis, topTours } }));
          }
          if (url.startsWith("/api/admin/analytics/revenue")) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const destinationId = u.searchParams.get("destinationId");
            const partnerId = u.searchParams.get("partnerId");
            const pipeline = [{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }];
            if (destinationId) pipeline.push({ $lookup: { from: "tours", localField: "tour", foreignField: "_id", as: "tour" } }, { $unwind: "$tour" }, { $match: { "tour.destination": (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.Types.ObjectId.createFromHexString(destinationId) } });
            if (partnerId) pipeline.push({ $lookup: { from: "tours", localField: "tour", foreignField: "_id", as: "tour" } }, { $unwind: "$tour" }, { $match: { "tour.owner": (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.Types.ObjectId.createFromHexString(partnerId) } });
            pipeline.push({ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalRevenue: { $sum: "$totalPrice" }, bookingFees: { $sum: { $multiply: ["$totalPrice", 0.05] } }, refunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$totalPrice", 0] } } } }, { $sort: { _id: 1 } });
            const rows = await Booking2.aggregate(pipeline);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url.startsWith("/api/admin/analytics/product-performance")) {
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const tours = await Tour2.find({}).select("title averageRating owner").lean();
            const byTour = await Booking2.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: "$tour", bookings: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } }]);
            const map = {};
            byTour.forEach((b) => map[String(b._id)] = b);
            const rows = tours.map((t) => ({ tourId: String(t._id), name: t.title, pageViews: Math.floor(Math.random() * 5e3) + 500, bookings: map[String(t._id)]?.bookings || 0, conversionRate: (map[String(t._id)]?.bookings || 0) / Math.max(1, Math.floor(Math.random() * 5e3) + 500) * 100, avgRating: t.averageRating || 0, totalRevenue: map[String(t._id)]?.revenue || 0 }));
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url.startsWith("/api/admin/analytics/customer-segments")) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const segment = u.searchParams.get("segment") || "vip";
            if (segment === "vip") {
              const agg = await Booking2.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: "$user", totalSpend: { $sum: "$totalPrice" } } }, { $sort: { totalSpend: -1 } }, { $limit: 100 }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } }, { $unwind: "$user" }]);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: true, data: agg }));
            }
            if (segment === "new") {
              const agg = await User2.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $project: { name: 1, email: 1, createdAt: 1 } }]);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: true, data: agg }));
            }
            if (segment === "at_risk") {
              const cutoff = new Date(endDate);
              cutoff.setMonth(cutoff.getMonth() - 6);
              const active = await Booking2.distinct("user", { createdAt: { $gte: cutoff, $lte: endDate } });
              const agg = await User2.find({ _id: { $nin: active } }).select("name email createdAt").lean();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: true, data: agg }));
            }
          }
          if (url.startsWith("/api/admin/analytics/coupon-performance")) {
            const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
            const { default: Coupon2 } = await Promise.resolve().then(() => (init_Coupon(), Coupon_exports));
            const rows = await Coupon2.find({}).select("code usedCount").lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/dashboard")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        if (!payload || !["admin", "staff"].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        const u = new URL(req.originalUrl || url, "http://localhost");
        const from = u.searchParams.get("from");
        const to = u.searchParams.get("to");
        const now = /* @__PURE__ */ new Date();
        const startDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const durationMs = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - durationMs);
        const prevEndDate = new Date(startDate.getTime() - 1);
        try {
          const { default: Booking2 } = await Promise.resolve().then(() => (init_Booking(), Booking_exports));
          const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
          const { default: Review2 } = await Promise.resolve().then(() => (init_Review(), Review_exports));
          const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
          const mainAggregation = await Booking2.aggregate([
            {
              $match: {
                createdAt: { $gte: startDate, $lte: endDate }
              }
            },
            {
              $facet: {
                // KPI Metrics - all calculations in parallel
                kpiMetrics: [
                  {
                    $group: {
                      _id: null,
                      totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, "$totalPrice", 0] } },
                      totalBookings: { $sum: 1 },
                      confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
                      pendingBookings: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                      cancelledBookings: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                      refundedBookings: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] } },
                      avgBookingValue: { $avg: "$totalPrice" }
                    }
                  }
                ],
                // Revenue over time for charts
                revenueOverTime: [
                  {
                    $match: { status: "confirmed" }
                  },
                  {
                    $group: {
                      _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                      },
                      revenue: { $sum: "$totalPrice" },
                      bookings: { $sum: 1 }
                    }
                  },
                  {
                    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                  },
                  {
                    $project: {
                      _id: 0,
                      date: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: {
                            $dateFromParts: {
                              year: "$_id.year",
                              month: "$_id.month",
                              day: "$_id.day"
                            }
                          }
                        }
                      },
                      revenue: 1,
                      bookings: 1
                    }
                  }
                ],
                // Top performing tours
                topTours: [
                  {
                    $match: { status: "confirmed" }
                  },
                  {
                    $group: {
                      _id: "$tour",
                      revenue: { $sum: "$totalPrice" },
                      bookings: { $sum: 1 },
                      avgRating: { $avg: "$tourInfo.averageRating" }
                    }
                  },
                  {
                    $sort: { revenue: -1 }
                  },
                  {
                    $limit: 10
                  },
                  {
                    $lookup: {
                      from: "tours",
                      localField: "_id",
                      foreignField: "_id",
                      as: "tourDetails"
                    }
                  },
                  {
                    $unwind: "$tourDetails"
                  },
                  {
                    $project: {
                      _id: 0,
                      tourId: "$_id",
                      title: "$tourDetails.title",
                      revenue: 1,
                      bookings: 1,
                      avgRating: 1,
                      price: "$tourDetails.price"
                    }
                  }
                ],
                // Recent bookings for activity feed
                recentBookings: [
                  {
                    $sort: { createdAt: -1 }
                  },
                  {
                    $limit: 10
                  },
                  {
                    $lookup: {
                      from: "users",
                      localField: "user",
                      foreignField: "_id",
                      as: "userDetails"
                    }
                  },
                  {
                    $lookup: {
                      from: "tours",
                      localField: "tour",
                      foreignField: "_id",
                      as: "tourDetails"
                    }
                  },
                  {
                    $unwind: "$userDetails"
                  },
                  {
                    $unwind: "$tourDetails"
                  },
                  {
                    $project: {
                      _id: 1,
                      bookingId: { $toString: "$_id" },
                      user: "$userDetails.name",
                      tour: "$tourDetails.title",
                      totalPrice: 1,
                      status: 1,
                      participants: 1,
                      bookingDate: 1,
                      createdAt: 1
                    }
                  }
                ]
              }
            }
          ]);
          const prevPeriodAggregation = await Booking2.aggregate([
            {
              $match: {
                createdAt: { $gte: prevStartDate, $lte: prevEndDate },
                status: "confirmed"
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" },
                totalBookings: { $sum: 1 }
              }
            }
          ]);
          const [
            newUsersCount,
            newUsersPrevCount,
            pendingReviewsCount,
            totalToursCount,
            activeToursCount
          ] = await Promise.all([
            User2.countDocuments({
              createdAt: { $gte: startDate, $lte: endDate },
              role: "user"
            }),
            User2.countDocuments({
              createdAt: { $gte: prevStartDate, $lte: prevEndDate },
              role: "user"
            }),
            Review2.countDocuments({ status: "pending" }),
            Tour2.countDocuments({}),
            Tour2.countDocuments({ status: "published" })
          ]);
          const kpiMetrics = mainAggregation[0]?.kpiMetrics[0] || {
            totalRevenue: 0,
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            refundedBookings: 0,
            avgBookingValue: 0
          };
          const revenueOverTime = mainAggregation[0]?.revenueOverTime || [];
          const topTours = mainAggregation[0]?.topTours || [];
          const recentBookings = mainAggregation[0]?.recentBookings || [];
          const prevPeriodMetrics = prevPeriodAggregation[0] || { totalRevenue: 0, totalBookings: 0 };
          const revenueComparison = prevPeriodMetrics.totalRevenue === 0 ? 100 : Math.round((kpiMetrics.totalRevenue - prevPeriodMetrics.totalRevenue) / prevPeriodMetrics.totalRevenue * 100);
          const bookingsComparison = prevPeriodMetrics.totalBookings === 0 ? 100 : Math.round((kpiMetrics.confirmedBookings - prevPeriodMetrics.totalBookings) / prevPeriodMetrics.totalBookings * 100);
          const usersComparison = newUsersPrevCount === 0 ? 100 : Math.round((newUsersCount - newUsersPrevCount) / newUsersPrevCount * 100);
          const conversionRate = totalToursCount > 0 ? Math.round(kpiMetrics.confirmedBookings / totalToursCount * 100) : 0;
          const chartData = revenueOverTime.map((item) => ({
            date: item.date,
            revenue: item.revenue,
            bookings: item.bookings
          }));
          const formattedTopTours = topTours.map((tour) => ({
            tourId: tour.tourId,
            title: tour.title,
            revenue: tour.revenue,
            bookings: tour.bookings,
            avgRating: tour.avgRating || 0,
            price: tour.price
          }));
          const formattedRecentBookings = recentBookings.map((booking) => ({
            id: booking.bookingId,
            user: booking.user,
            tour: booking.tour,
            total: booking.totalPrice,
            status: booking.status,
            participants: booking.participants,
            bookingDate: booking.bookingDate,
            createdAt: booking.createdAt
          }));
          const response = {
            success: true,
            data: {
              // KPI Cards Data
              kpiCards: {
                monthlyRevenue: {
                  value: kpiMetrics.totalRevenue,
                  comparison: revenueComparison,
                  isPositive: revenueComparison >= 0
                },
                newBookings: {
                  value: kpiMetrics.confirmedBookings,
                  comparison: bookingsComparison,
                  isPositive: bookingsComparison >= 0
                },
                newUsers: {
                  value: newUsersCount,
                  comparison: usersComparison,
                  isPositive: usersComparison >= 0
                },
                conversionRate: {
                  value: conversionRate,
                  comparison: null,
                  isPositive: conversionRate > 0
                },
                pendingReviews: {
                  value: pendingReviewsCount,
                  comparison: null,
                  isPositive: false
                }
              },
              // Chart Data
              revenueChartData: chartData,
              // Top Performing Data
              topTours: formattedTopTours,
              // Activity Data
              recentBookings: formattedRecentBookings,
              // Additional Metrics
              additionalMetrics: {
                totalTours: totalToursCount,
                activeTours: activeToursCount,
                avgBookingValue: kpiMetrics.avgBookingValue,
                bookingStatusBreakdown: {
                  confirmed: kpiMetrics.confirmedBookings,
                  pending: kpiMetrics.pendingBookings,
                  cancelled: kpiMetrics.cancelledBookings,
                  refunded: kpiMetrics.refundedBookings
                }
              },
              // Date range info
              dateRange: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
                period: `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
              }
            }
          };
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify(response));
        } catch (error) {
          console.error("Dashboard API Error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({
            success: false,
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : "Unknown error"
          }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/destinations") && !url.startsWith("/api/ai/generate-text")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        if (!payload || !["admin", "staff"].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        const u = new URL(req.originalUrl || url, "http://localhost");
        try {
          if (url.startsWith("/api/admin/destinations") && req.method === "GET" && (url === "/api/admin/destinations" || url.startsWith("/api/admin/destinations?"))) {
            const { default: Destination2 } = await Promise.resolve().then(() => (init_Destination(), Destination_exports));
            const search = (u.searchParams.get("search") || "").trim();
            const page = Math.max(1, parseInt(u.searchParams.get("page") || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(u.searchParams.get("limit") || "20", 10)));
            const match = {};
            if (search) match.name = { $regex: search, $options: "i" };
            const pipeline = [
              { $match: match },
              { $lookup: { from: "tours", localField: "_id", foreignField: "destination", as: "tours" } },
              { $lookup: { from: "bookings", localField: "tours._id", foreignField: "tour", as: "bookings" } },
              { $addFields: { tourCount: { $size: "$tours" }, totalBookings: { $size: "$bookings" }, totalRevenue: { $sum: "$bookings.totalPrice" } } },
              { $project: { bookings: 0 } },
              { $sort: { updatedAt: -1 } },
              { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: "count" }] } }
            ];
            const agg = await (await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js")).default.connection.collection("destinations").aggregate(pipeline).toArray();
            const total = agg[0]?.total?.[0]?.count || 0;
            const rows = agg[0]?.rows || [];
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: { total, page, limit, rows } }));
          }
          const idMatch = url.match(/^\/api\/admin\/destinations\/([^/]+)$/);
          if (idMatch && req.method === "GET") {
            const { default: Destination2 } = await Promise.resolve().then(() => (init_Destination(), Destination_exports));
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            const id = idMatch[1];
            const doc = await Destination2.findById(id).lean();
            if (!doc) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Not found" }));
            }
            const tours = await Tour2.find({ destination: id }).select("_id title").lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: { ...doc, tours } }));
          }
          if (url === "/api/admin/destinations" && req.method === "POST") {
            const { default: Destination2 } = await Promise.resolve().then(() => (init_Destination(), Destination_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            if (!body.name || !body.slug) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Name and slug are required" }));
            }
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            if (!slugRegex.test(body.slug)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" }));
            }
            const existingDestination = await Destination2.findOne({ slug: body.slug });
            if (existingDestination) {
              res.statusCode = 409;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "A destination with this slug already exists" }));
            }
            const destinationData = {
              name: body.name.trim(),
              slug: body.slug.toLowerCase(),
              description: body.description?.trim(),
              history: body.history?.trim(),
              culture: body.culture?.trim(),
              geography: body.geography?.trim(),
              mainImage: body.mainImage?.trim(),
              imageGallery: Array.isArray(body.imageGallery) ? body.imageGallery : [],
              bestTimeToVisit: body.bestTimeToVisit?.trim(),
              essentialTips: Array.isArray(body.essentialTips) ? body.essentialTips : [],
              status: body.status || "draft"
            };
            const created = await Destination2.create(destinationData);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          if (idMatch && req.method === "PUT") {
            const { default: Destination2 } = await Promise.resolve().then(() => (init_Destination(), Destination_exports));
            const id = idMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const updated = await Destination2.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (idMatch && req.method === "DELETE") {
            const { default: Destination2 } = await Promise.resolve().then(() => (init_Destination(), Destination_exports));
            const id = idMatch[1];
            await Destination2.findByIdAndDelete(id);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/ai/generate-text" && req.method === "POST") {
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { prompt } = body || {};
            const text = `Generated content for prompt: "${prompt || ""}"...

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: text }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/settings") && !url.startsWith("/api/admin/roles") && !url.startsWith("/api/admin/notifications/send-test")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        if (!payload || payload.role !== "admin") {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        try {
          if (url === "/api/admin/settings" && req.method === "GET") {
            const { default: Settings2 } = await Promise.resolve().then(() => (init_Settings(), Settings_exports));
            const doc = await Settings2.findOne({}).lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          if (url === "/api/admin/settings" && req.method === "PUT") {
            const { default: Settings2 } = await Promise.resolve().then(() => (init_Settings(), Settings_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            let doc = await Settings2.findOne({});
            if (!doc) doc = new (await Promise.resolve().then(() => (init_Settings(), Settings_exports))).default();
            Object.assign(doc, body);
            await doc.save();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          if (url === "/api/admin/roles" && req.method === "GET") {
            const { default: Role2 } = await Promise.resolve().then(() => (init_Role(), Role_exports));
            const rows = await Role2.find({}).lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: rows }));
          }
          if (url === "/api/admin/roles" && req.method === "POST") {
            const { default: Role2 } = await Promise.resolve().then(() => (init_Role(), Role_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const created = await Role2.create(body);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: created }));
          }
          const roleMatch = url.match(/^\/api\/admin\/roles\/([^/]+)$/);
          if (roleMatch && req.method === "PUT") {
            const { default: Role2 } = await Promise.resolve().then(() => (init_Role(), Role_exports));
            const id = roleMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const updated = await Role2.findByIdAndUpdate(id, body, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: updated }));
          }
          if (roleMatch && req.method === "DELETE") {
            const { default: Role2 } = await Promise.resolve().then(() => (init_Role(), Role_exports));
            const id = roleMatch[1];
            await Role2.findByIdAndDelete(id);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (url === "/api/admin/notifications/send-test" && req.method === "POST") {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, message: "Test email sent (stub)" }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/users")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        const payload = token ? verifyJwt2(token) : null;
        if (!payload) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
        }
        await dbConnect();
        const isAdmin = payload.role === "admin";
        const isStaff = ["admin", "staff"].includes(payload.role);
        const full = new URL(req.originalUrl || url, "http://localhost");
        try {
          if (req.method === "GET" && (url === "/api/admin/users" || url.startsWith("/api/admin/users?"))) {
            if (!isStaff) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const page = Math.max(1, parseInt(full.searchParams.get("page") || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(full.searchParams.get("limit") || "15", 10)));
            const role = full.searchParams.get("role") || "";
            const status = full.searchParams.get("status") || "";
            const search = (full.searchParams.get("search") || "").trim();
            const match = {};
            if (role === "user") match.role = "user";
            else if (role === "partner") match.role = "partner";
            else if (role === "staff") match.role = { $in: ["staff", "admin"] };
            if (status) match.status = status;
            const searchStage = search ? [{ $match: { $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } }
            ] } }] : [];
            const pipeline = [
              { $match: match },
              ...searchStage,
              { $lookup: { from: "bookings", localField: "_id", foreignField: "user", as: "bookings" } },
              { $lookup: { from: "tours", localField: "_id", foreignField: "owner", as: "tours" } },
              { $addFields: {
                totalBookings: { $size: "$bookings" },
                totalSpend: { $sum: "$bookings.totalPrice" },
                tourCount: { $size: "$tours" },
                avgRating: { $literal: 0 }
              } },
              { $project: { password: 0, bookings: 0, tours: 0 } },
              { $sort: { createdAt: -1 } },
              { $facet: {
                users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: "count" }]
              } }
            ];
            const mongooseMod = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/mongoose/index.js");
            const agg = await mongooseMod.default.connection.collection("users").aggregate(pipeline).toArray();
            const users = agg[0]?.users || [];
            const totalUsers = agg[0]?.total?.[0]?.count || 0;
            const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: { users, pagination: { currentPage: page, totalPages, totalUsers } } }));
          }
          if (req.method === "POST" && url === "/api/admin/staff") {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { name, email, password, role } = body || {};
            if (!name || !email || !password) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "All fields are required" }));
            }
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const existing = await User2.findOne({ email: String(email).toLowerCase() });
            if (existing) {
              res.statusCode = 409;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "User already exists" }));
            }
            const user = await User2.create({ name: name.trim(), email: String(email).toLowerCase(), password, role: role === "admin" ? "admin" : "staff", status: "active" });
            const safe = user.toObject();
            delete safe.password;
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: safe }));
          }
          const userIdPut = url.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (req.method === "PUT" && userIdPut) {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = userIdPut[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const allowed = {};
            if (body.name !== void 0) allowed.name = body.name;
            if (body.email !== void 0) allowed.email = String(body.email).toLowerCase();
            if (body.role !== void 0) allowed.role = body.role;
            if (body.status !== void 0) allowed.status = body.status;
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const updated = await User2.findByIdAndUpdate(id, allowed, { new: true }).lean();
            if (!updated) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "User not found" }));
            }
            const safe = updated;
            delete safe.password;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: safe }));
          }
          const userStatusMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
          if (req.method === "PUT" && userStatusMatch) {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = userStatusMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { status } = body || {};
            if (!["active", "suspended", "pending_approval"].includes(status)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid status" }));
            }
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const updated = await User2.findByIdAndUpdate(id, { status }, { new: true }).lean();
            if (!updated) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "User not found" }));
            }
            const safe = updated;
            delete safe.password;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: safe }));
          }
          const userRoleMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
          if (req.method === "PUT" && userRoleMatch) {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = userRoleMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { role } = body || {};
            if (!["user", "partner", "staff", "admin"].includes(role)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid role" }));
            }
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const updated = await User2.findByIdAndUpdate(id, { role }, { new: true }).lean();
            if (!updated) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "User not found" }));
            }
            const safe = updated;
            delete safe.password;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: safe }));
          }
          const userIdDel = url.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (req.method === "DELETE" && userIdDel) {
            if (!isAdmin) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
            }
            const id = userIdDel[1];
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const deleted = await User2.findByIdAndDelete(id);
            if (!deleted) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "User not found" }));
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/reviews") && !url.startsWith("/api/admin/stories")) return next();
        const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
        const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
        const cookies = parse2(req.headers.cookie || "");
        const token = cookies["auth_token"];
        if (!token) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
        }
        const payload = verifyJwt2(token);
        if (!payload || !["admin", "staff"].includes(payload.role)) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
        }
        await dbConnect();
        const method = req.method;
        try {
          if (method === "GET" && url.startsWith("/api/admin/reviews")) {
            const { default: Review2 } = await Promise.resolve().then(() => (init_Review(), Review_exports));
            const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
            const { default: Tour2 } = await Promise.resolve().then(() => (init_Tour(), Tour_exports));
            const u = new URL(url, "http://localhost");
            const status = u.searchParams.get("status") || "pending";
            const page = Number(u.searchParams.get("page") || "1");
            const limit = Number(u.searchParams.get("limit") || "20");
            const docs = await Review2.find({ status }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name avatar contributionScore").populate("tour", "title").lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: docs, total: docs.length }));
          }
          if (method === "GET" && url.startsWith("/api/admin/stories")) {
            const { default: Story2 } = await Promise.resolve().then(() => (init_Story(), Story_exports));
            const u = new URL(url, "http://localhost");
            const status = u.searchParams.get("status") || "pending";
            const page = Number(u.searchParams.get("page") || "1");
            const limit = Number(u.searchParams.get("limit") || "20");
            const docs = await Story2.find({ status }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("author", "name avatar contributionScore").populate("destination", "name slug").lean();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: docs, total: docs.length }));
          }
          if (method === "PUT" && url.startsWith("/api/admin/reviews/bulk-update")) {
            const { default: Review2 } = await Promise.resolve().then(() => (init_Review(), Review_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { action, ids, reason } = body || {};
            if (!Array.isArray(ids) || !ids.length) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "ids required" }));
            }
            if (action === "approve") {
              await Review2.updateMany({ _id: { $in: ids } }, { $set: { status: "approved", rejectionReason: void 0 } });
            } else if (action === "reject") {
              await Review2.updateMany({ _id: { $in: ids } }, { $set: { status: "rejected", rejectionReason: reason || "" } });
            } else {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid action" }));
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          if (method === "PUT" && url.startsWith("/api/admin/stories/bulk-update")) {
            const { default: Story2 } = await Promise.resolve().then(() => (init_Story(), Story_exports));
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { action, ids, reason } = body || {};
            if (!Array.isArray(ids) || !ids.length) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "ids required" }));
            }
            if (action === "approve") {
              await Story2.updateMany({ _id: { $in: ids } }, { $set: { status: "approved", rejectionReason: void 0 } });
            } else if (action === "reject") {
              await Story2.updateMany({ _id: { $in: ids } }, { $set: { status: "rejected", rejectionReason: reason || "" } });
            } else {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ success: false, error: "Invalid action" }));
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true }));
          }
          const reviewMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)$/);
          if (method === "PUT" && reviewMatch) {
            const { default: Review2 } = await Promise.resolve().then(() => (init_Review(), Review_exports));
            const id = reviewMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { content, action } = body || {};
            const update = {};
            if (typeof content === "string") update.comment = content;
            if (action === "approve") update.status = "approved";
            const doc = await Review2.findByIdAndUpdate(id, update, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          const storyMatch = url.match(/^\/api\/admin\/stories\/([^/]+)$/);
          if (method === "PUT" && storyMatch) {
            const { default: Story2 } = await Promise.resolve().then(() => (init_Story(), Story_exports));
            const id = storyMatch[1];
            const body = await new Promise((resolve, reject) => {
              let b = "";
              req.on("data", (c) => b += c);
              req.on("end", () => {
                try {
                  resolve(JSON.parse(b || "{}"));
                } catch (e) {
                  reject(e);
                }
              });
              req.on("error", reject);
            });
            const { content, action, title } = body || {};
            const update = {};
            if (typeof title === "string") update.title = title;
            if (typeof content === "string") update.content = content;
            if (action === "approve") update.status = "approved";
            const doc = await Story2.findByIdAndUpdate(id, update, { new: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, data: doc }));
          }
          return next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/admin/tours")) return next();
        try {
          await dbConnect();
          const toursHandler = await Promise.resolve().then(() => (init_tours(), tours_exports));
          return toursHandler.default(req, res);
        } catch (err) {
          console.error("Tours API Error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use("/api/admin/users/pending-partners", async (req, res) => {
        if (req.method !== "GET") return;
        try {
          const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
          const cookies = parse2(req.headers.cookie || "");
          const token = cookies["auth_token"];
          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
          }
          const payload = verifyJwt2(token);
          if (!payload || !["admin", "staff"].includes(payload.role)) {
            res.statusCode = 403;
            return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
          }
          await dbConnect();
          const docs = await User_default.find({ status: "pending_approval" }).select("-password").lean();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: docs }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use("/api/admin/users/staff", async (req, res) => {
        try {
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
          }
          const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
          const cookies = parse2(req.headers.cookie || "");
          const token = cookies["auth_token"];
          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
          }
          const payload = verifyJwt2(token);
          if (!payload || payload.role !== "admin") {
            res.statusCode = 403;
            return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
          }
          const body = await new Promise((resolve, reject) => {
            let b = "";
            req.on("data", (c) => b += c.toString());
            req.on("end", () => {
              try {
                resolve(JSON.parse(b || "{}"));
              } catch (e) {
                reject(e);
              }
            });
            req.on("error", reject);
          });
          const { name, email, password } = body || {};
          if (!name || !email || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "All fields are required" }));
          }
          await dbConnect();
          const existing = await User_default.findOne({ email: String(email).toLowerCase() });
          if (existing) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ success: false, error: "User already exists" }));
          }
          const user = await User_default.create({ name: name.trim(), email: String(email).toLowerCase(), password, role: "staff", status: "active" });
          const safe = user.toObject();
          delete safe.password;
          res.statusCode = 201;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: safe }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const match = url.match(/^\/api\/admin\/users\/([^/]+)\/approve-partner$/);
        if (!match) return next();
        if (req.method !== "PUT") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
          const cookies = parse2(req.headers.cookie || "");
          const token = cookies["auth_token"];
          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Unauthorized" }));
          }
          const payload = verifyJwt2(token);
          if (!payload || !["admin", "staff"].includes(payload.role)) {
            res.statusCode = 403;
            return res.end(JSON.stringify({ success: false, error: "Forbidden" }));
          }
          const userId = match[1];
          await dbConnect();
          const user = await User_default.findById(userId);
          if (!user) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ success: false, error: "User not found" }));
          }
          user.role = "partner";
          user.status = "active";
          await user.save();
          const safe = user.toObject();
          delete safe.password;
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: safe }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use("/api/seed", async (req, res) => {
        if (req.method !== "POST") return;
        try {
          console.log("[VITE SERVER] POST /api/seed received. Triggering seeder...");
          await seedDatabase();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, message: "Database seeded successfully!" }));
        } catch (error) {
          console.error("[VITE SERVER] Seeding failed:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: `Seeding failed: ${error.message}` }));
        }
      });
    }
  };
}
function homeApiPlugin() {
  return {
    name: "vite-plugin-home-api",
    configureServer(server) {
      server.middlewares.use("/api/home/featured-destinations", async (req, res) => {
        if (req.method !== "GET") return;
        try {
          await dbConnect();
          const destinations = await Destination_default.find({}).sort({ createdAt: -1 }).limit(6).lean();
          console.log(`[VITE API] Featured Destinations count=${destinations.length}`);
          if (destinations[0]) {
            console.log("[VITE API] First Destination:", JSON.stringify(destinations[0], null, 2));
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: destinations }));
        } catch (error) {
          console.error("[VITE API] Featured Destinations Error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: "Failed to fetch featured destinations" }));
        }
      });
      server.middlewares.use("/api/home/featured-tours", async (req, res) => {
        if (req.method !== "GET") return;
        try {
          await dbConnect();
          const tours = await Tour_default.find({}).sort({ averageRating: -1, reviewCount: -1, createdAt: -1 }).limit(6).populate("destination", "name slug").lean();
          console.log(`[VITE API] Featured Tours count=${tours.length}`);
          if (tours[0]) {
            console.log("[VITE API] First Tour:", JSON.stringify(tours[0], null, 2));
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: tours }));
        } catch (error) {
          console.error("[VITE API] Featured Tours Error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: "Failed to fetch featured tours" }));
        }
      });
      server.middlewares.use("/api/destinations/lookup", async (req, res) => {
        if (req.method !== "GET") return;
        try {
          await dbConnect();
          const url = new URL(req.url || "", "http://localhost");
          const idsParam = url.searchParams.get("ids");
          const ids = (idsParam || "").split(",").map((s) => s.trim()).filter(Boolean);
          if (!ids.length) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, data: [] }));
            return;
          }
          const docs = await Destination_default.find({ _id: { $in: ids } }).lean();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, data: docs }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: error.message }));
        }
      });
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl || req.url || "";
        const method = req.method;
        if (url.startsWith("/api/media/upload") && method === "POST") {
          console.log(`[API ROUTER] Matched POST /api/media/upload. Forwarding to handler.`);
          console.log(`[VITE API] Content-Type: ${req.headers["content-type"]}`);
          console.log(`[VITE API] Content-Length: ${req.headers["content-length"]}`);
          try {
            const { handleImageUpload: handleImageUpload2 } = await Promise.resolve().then(() => (init_mediaHandler(), mediaHandler_exports));
            console.log(`[VITE API] Calling handleImageUpload...`);
            await handleImageUpload2(req, res);
            console.log(`[VITE API] handleImageUpload completed`);
            return;
          } catch (error) {
            console.error("[VITE API] Image upload error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: "L\u1ED7i server, vui l\xF2ng th\u1EED l\u1EA1i sau"
            }));
            return;
          }
        }
        next();
      });
      server.middlewares.use("/api/stories", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const { handleCreateStory: handleCreateStory2 } = await Promise.resolve().then(() => (init_storyHandler(), storyHandler_exports));
          await handleCreateStory2(req, res);
        } catch (error) {
          console.error("[VITE API] Create story error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: false,
            error: "L\u1ED7i server, vui l\xF2ng th\u1EED l\u1EA1i sau"
          }));
        }
      });
      server.middlewares.use("/api/destinations/search", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          await dbConnect();
          const url = new URL(req.url || "", "http://localhost");
          const query = url.searchParams.get("q");
          const limit = url.searchParams.get("limit") || "10";
          const limitNum = Math.min(parseInt(limit) || 10, 20);
          if (!query || query.trim().length === 0) {
            return res.end(JSON.stringify({
              success: true,
              data: [],
              total: 0
            }));
          }
          const searchQuery = query.trim();
          const destinations = await Destination_default.find({
            $and: [
              { status: "published" },
              // Only published destinations
              {
                $or: [
                  { name: { $regex: searchQuery, $options: "i" } },
                  { description: { $regex: searchQuery, $options: "i" } },
                  { location: { $regex: searchQuery, $options: "i" } }
                ]
              }
            ]
          }).select("name slug location image").limit(limitNum).lean();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: true,
            data: destinations,
            total: destinations.length
          }));
        } catch (error) {
          console.error("[VITE API] Destination search error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: false,
            error: "L\u1ED7i server, vui l\xF2ng th\u1EED l\u1EA1i sau"
          }));
        }
      });
      server.middlewares.use("/api/destinations/", async (req, res, next) => {
        try {
          if (req.method !== "GET") return next();
          const original = req.originalUrl || req.url || "";
          if (original.startsWith("/api/destinations/lookup")) return next();
          if (original.startsWith("/api/destinations/search")) return next();
          const slug = (req.url || "").replace(/^\/?/, "");
          if (!slug) return next();
          const { handleGetDestinationBySlug: handleGetDestinationBySlug2 } = await Promise.resolve().then(() => (init_destinationHandler(), destinationHandler_exports));
          console.log(`[VITE API] GET /api/destinations/${slug}`);
          await handleGetDestinationBySlug2(req, res, slug);
        } catch (error) {
          console.error("[VITE API] Destination by slug error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    }
  };
}
function authApiPlugin() {
  return {
    name: "vite-plugin-auth-api",
    configureServer(server) {
      function parseBody2(req) {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk) => body += chunk.toString());
          req.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(new Error("Invalid JSON"));
            }
          });
          req.on("error", (err) => reject(err));
        });
      }
      server.middlewares.use("/api/auth/register", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/register with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const { name, email, password, accountType } = await parseBody2(req);
          if (!name || !email || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "All fields are required." }));
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "Invalid email format." }));
          }
          if (password.length < 6) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "Password must be at least 6 characters." }));
          }
          const requestedType = accountType === "partner" ? "partner" : "user";
          if (!process.env.MONGODB_URI) {
            res.statusCode = 503;
            return res.end(JSON.stringify({
              success: false,
              error: "Database connection not configured. Please set MONGODB_URI environment variable."
            }));
          }
          await dbConnect();
          const existingUser = await User_default.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ success: false, error: "User with this email already exists." }));
          }
          const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password,
            role: "user",
            status: requestedType === "partner" ? "pending_approval" : "active"
          };
          const user = await User_default.create(userData);
          const userResponse = user.toObject();
          delete userResponse.password;
          console.log(`[VITE API] User created successfully: ${user.email} with role: ${user.role}`);
          res.statusCode = 201;
          res.end(JSON.stringify({ success: true, data: userResponse }));
        } catch (error) {
          console.error("[VITE API Register Error]", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: "An internal server error occurred." }));
        }
      });
      server.middlewares.use("/api/auth/login", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/login with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          await dbConnect();
          const { email, password } = await parseBody2(req);
          console.log(`[Login API] Attempting login for email: ${email}`);
          if (!email || !password) {
            console.log("[Login API] FAILED: Missing email or password");
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "Email and password are required." }));
          }
          const user = await User_default.findOne({ email: email.toLowerCase() }).select("+password");
          if (!user) {
            console.log(`[Login API] FAILED: User not found for email: ${email}`);
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Invalid credentials." }));
          }
          console.log(`[Login API] SUCCESS: User found. Stored hash: ${user.password}`);
          if (user.status === "pending_approval") {
            console.log(`[Login API] FAILED: User ${user.email} is pending approval`);
            res.statusCode = 403;
            return res.end(JSON.stringify({ success: false, error: "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111ang ch\u1EDD ph\xEA duy\u1EC7t." }));
          }
          console.log(`[Login API] Attempting password verification for user: ${user.email}`);
          const isValidPassword = await user.comparePassword(password);
          if (!isValidPassword) {
            console.log(`[Login API] FAILED: Password comparison returned false for user: ${user.email}`);
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Invalid credentials." }));
          }
          console.log(`[Login API] SUCCESS: Password matched for user: ${user.email}`);
          const { signJwt: signJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
          const token = signJwt2({ userId: String(user._id), role: user.role });
          const { serialize } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const cookie2 = serialize("auth_token", token, {
            httpOnly: true,
            secure: false,
            // Set to true in production with HTTPS
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
            // 7 days
          });
          const userResponse = user.toObject();
          delete userResponse.password;
          console.log(`[VITE API] User logged in successfully: ${user.email}`);
          res.statusCode = 200;
          res.setHeader("Set-Cookie", cookie2);
          res.end(JSON.stringify({ success: true, data: userResponse }));
        } catch (error) {
          console.error("[VITE API Login Error]", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: "An internal server error occurred." }));
        }
      });
      server.middlewares.use("/api/auth/logout", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/logout with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const { serialize } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const cookie2 = serialize("auth_token", "", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 0
          });
          res.statusCode = 200;
          res.setHeader("Set-Cookie", cookie2);
          res.end(JSON.stringify({ success: true, message: "Logged out successfully" }));
        } catch (error) {
          console.error("[VITE API Logout Error]", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: "An internal server error occurred." }));
        }
      });
      server.middlewares.use("/api/auth/me", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/me with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "GET") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const { parse: parse2 } = await import("file:///C:/viet-adventure-connect/viet-adventure-connect/node_modules/cookie/index.js");
          const { verifyJwt: verifyJwt2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
          const cookies = parse2(req.headers.cookie || "");
          const token = cookies["auth_token"];
          if (!token) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "No authentication token provided." }));
          }
          const payload = verifyJwt2(token);
          if (!payload) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: "Invalid authentication token." }));
          }
          await dbConnect();
          const user = await User_default.findById(payload.userId);
          if (!user) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ success: false, error: "User not found." }));
          }
          const userResponse = user.toObject();
          delete userResponse.password;
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, data: userResponse }));
        } catch (error) {
          console.error("[VITE API Me Error]", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: "An internal server error occurred." }));
        }
      });
      server.middlewares.use("/api/auth/test", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/test with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          message: "Auth API is working!",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          mongodb_uri: process.env.MONGODB_URI ? "Configured" : "Not configured"
        }));
      });
      server.middlewares.use("/api/auth/create-admin", async (req, res) => {
        console.log(`[VITE API] Received request on /api/auth/create-admin with method: ${req.method}`);
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          await dbConnect();
          const { name, email, password } = await parseBody2(req);
          if (!name || !email || !password) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: "All fields are required." }));
          }
          const existingAdmin = await User_default.findOne({ email: email.toLowerCase() });
          if (existingAdmin) {
            res.statusCode = 409;
            return res.end(JSON.stringify({ success: false, error: "Admin with this email already exists." }));
          }
          const adminData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password,
            role: "admin",
            status: "active"
          };
          const admin = new User_default(adminData);
          await admin.save();
          const adminResponse = admin.toObject();
          delete adminResponse.password;
          console.log(`[VITE API] Admin created successfully: ${admin.email} with role: ${admin.role}`);
          res.statusCode = 201;
          res.end(JSON.stringify({ success: true, data: adminResponse }));
        } catch (error) {
          console.error("[VITE API Create Admin Error]", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: "An internal server error occurred." }));
        }
      });
    }
  };
}
function publicToursApiPlugin() {
  return {
    name: "vite-plugin-public-tours-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/tours/search")) return next();
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          const handler3 = await Promise.resolve().then(() => (init_search(), search_exports));
          return handler3.default(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
      server.middlewares.use("/api/tours/", async (req, res, next) => {
        try {
          if (req.method !== "GET") return next();
          const seg = (req.url || "").replace(/^\/?/, "");
          if (!seg || seg.startsWith("search")) return next();
          const { handleGetTourById: handleGetTourById2 } = await Promise.resolve().then(() => (init_tourHandler(), tourHandler_exports));
          console.log(`[VITE API] GET /api/tours/${seg}`);
          await handleGetTourById2(req, res, seg);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
    }
  };
}
function userJourneysApiPlugin() {
  return {
    name: "vite-plugin-user-journeys-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/users/journeys")) return next();
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          console.log(`[VITE API] GET /api/users/journeys - Forwarding to handler`);
          const { handleGetUserJourneys: handleGetUserJourneys2 } = await Promise.resolve().then(() => (init_journeysHandler(), journeysHandler_exports));
          return await handleGetUserJourneys2(req, res);
        } catch (err) {
          console.error("[VITE API] User Journeys Error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: err.message || "Server error" }));
        }
      });
    }
  };
}
function communityHubApiPlugin() {
  return {
    name: "vite-plugin-community-hub-api",
    configureServer(server) {
      server.middlewares.use("/api/community/hub", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
        }
        try {
          console.log("[VITE API] GET /api/community/hub - Processing request...");
          const { default: dbConnect2 } = await Promise.resolve().then(() => (init_dbConnect(), dbConnect_exports));
          const { default: Story2 } = await Promise.resolve().then(() => (init_Story(), Story_exports));
          const { default: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
          await dbConnect2();
          const [
            featuredStory,
            latestStories,
            trendingTags,
            topAuthors,
            totalStories,
            totalMembers,
            storiesThisWeek
          ] = await Promise.all([
            // Featured Story: Get the story with highest likeCount that is approved
            Story2.findOne({ status: "approved" }).sort({ likeCount: -1 }).populate("author", "name avatar").lean(),
            // Latest Stories: Get 5 most recent stories (all statuses)
            Story2.find({}).sort({ createdAt: -1 }).limit(5).populate("author", "name avatar").lean(),
            // Trending Tags: MongoDB aggregation pipeline
            Story2.aggregate([
              { $unwind: "$tags" },
              { $group: { _id: "$tags", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 5 },
              { $project: { tag: "$_id", count: 1, _id: 0 } }
            ]),
            // Top Authors: Complex aggregation to get authors with most stories and likes
            Story2.aggregate([
              { $group: {
                _id: "$author",
                storyCount: { $sum: 1 },
                totalLikes: { $sum: "$likeCount" }
              } },
              { $sort: { totalLikes: -1, storyCount: -1 } },
              { $limit: 3 },
              { $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "authorInfo"
              } },
              { $unwind: "$authorInfo" },
              { $project: {
                _id: "$authorInfo._id",
                name: "$authorInfo.name",
                avatar: "$authorInfo.avatar",
                followerCount: { $ifNull: ["$authorInfo.contributionScore", 0] },
                storyCount: 1
              } }
            ]),
            // Community Stats: Total stories (true total count)
            Story2.estimatedDocumentCount(),
            // Community Stats: Total members (true total count)
            User2.estimatedDocumentCount(),
            // Community Stats: Stories this week
            Story2.countDocuments({
              status: "approved",
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)
              }
            })
          ]);
          const communityHubData = {
            featuredStory: featuredStory ? {
              _id: featuredStory._id.toString(),
              title: featuredStory.title,
              content: featuredStory.content,
              coverImage: featuredStory.coverImage,
              tags: featuredStory.tags,
              likeCount: featuredStory.likeCount,
              createdAt: featuredStory.createdAt.toISOString(),
              author: {
                _id: featuredStory.author._id.toString(),
                name: featuredStory.author.name,
                avatar: featuredStory.author.avatar
              }
            } : null,
            latestStories: latestStories.map((story) => ({
              _id: story._id.toString(),
              title: story.title,
              content: story.content,
              coverImage: story.coverImage,
              tags: story.tags,
              likeCount: story.likeCount,
              createdAt: story.createdAt.toISOString(),
              author: {
                _id: story.author._id.toString(),
                name: story.author.name,
                avatar: story.author.avatar
              }
            })),
            trendingTags: trendingTags.map((tag) => ({
              tag: tag.tag,
              count: tag.count
            })),
            topAuthors: topAuthors.map((author) => ({
              _id: author._id.toString(),
              name: author.name,
              avatar: author.avatar,
              followerCount: author.followerCount,
              storyCount: author.storyCount
            })),
            communityStats: {
              totalStories,
              totalMembers,
              storiesThisWeek
            }
          };
          console.log("[VITE API] Community hub data fetched successfully");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: true,
            data: communityHubData,
            cached: false
          }));
        } catch (error) {
          console.error("[VITE API] Community Hub error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: error.message || "Server error" }));
        }
      });
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.MONGODB_URI = env.MONGODB_URI;
  process.env.JWT_SECRET = env.JWT_SECRET;
  process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
  if (!process.env.JWT_SECRET) {
    console.warn("\u26A0\uFE0F WARNING: JWT_SECRET is not defined in your .env file. Authentication will fail.");
  }
  if (!process.env.MONGODB_URI && mode === "development") {
    console.warn("\u26A0\uFE0F WARNING: MONGODB_URI is not defined in your .env.local file. The seeding API will fail.");
  }
  return {
    plugins: [
      react(),
      // Conditionally enable the seeding API only in the 'development' environment.
      mode === "development" ? seedApiPlugin() : null,
      mode === "development" ? homeApiPlugin() : null,
      mode === "development" ? authApiPlugin() : null,
      mode === "development" ? publicToursApiPlugin() : null,
      mode === "development" ? userJourneysApiPlugin() : null,
      mode === "development" ? communityHubApiPlugin() : null
    ],
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2xpYi9kYkNvbm5lY3QudHMiLCAic3JjL21vZGVscy9Cb29raW5nLnRzIiwgInNyYy9tb2RlbHMvVG91ci50cyIsICJzcmMvbGliL2F1dGgvand0LnRzIiwgInNyYy9tb2RlbHMvRGVzdGluYXRpb24udHMiLCAic3JjL21vZGVscy9Vc2VyLnRzIiwgInNyYy9tb2RlbHMvQ291cG9uLnRzIiwgInNyYy9tb2RlbHMvQmFubmVyLnRzIiwgInNyYy9tb2RlbHMvQ29sbGVjdGlvbi50cyIsICJzcmMvbW9kZWxzL1NldHRpbmdzLnRzIiwgInNyYy9tb2RlbHMvUmV2aWV3LnRzIiwgInNyYy9tb2RlbHMvUm9sZS50cyIsICJzcmMvbW9kZWxzL1N0b3J5LnRzIiwgInNyYy9wYWdlcy9hcGkvYWRtaW4vdG91cnMvaW5kZXgudHMiLCAic3JjL2xpYi9hcGkvbWVkaWFIYW5kbGVyLnRzIiwgInNyYy9saWIvYXV0aC9nZXRBdXRoVXNlci50cyIsICJzcmMvbGliL2FwaS9zdG9yeUhhbmRsZXIudHMiLCAic3JjL2xpYi9hcGkvZGVzdGluYXRpb25IYW5kbGVyLnRzIiwgInNyYy9wYWdlcy9hcGkvdG91cnMvc2VhcmNoLnRzIiwgInNyYy9saWIvYXBpL3RvdXJIYW5kbGVyLnRzIiwgInNyYy91dGlscy9mb3JtYXQudHMiLCAic3JjL2xpYi9hcGkvam91cm5leXNIYW5kbGVyLnRzIiwgInZpdGUuY29uZmlnLnRzIiwgInNyYy9saWIvYXBpL2Jvb2tpbmdIYW5kbGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGRiQ29ubmVjdC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9saWIvZGJDb25uZWN0LnRzXCI7aW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcblxudHlwZSBHbG9iYWxXaXRoTW9uZ29vc2UgPSB0eXBlb2YgZ2xvYmFsVGhpcyAmIHtcbiAgbW9uZ29vc2VDb25uPzoge1xuICAgIGNvbm46IHR5cGVvZiBtb25nb29zZSB8IG51bGw7XG4gICAgcHJvbWlzZTogUHJvbWlzZTx0eXBlb2YgbW9uZ29vc2U+IHwgbnVsbDtcbiAgfTtcbn07XG5cbmNvbnN0IGdsb2JhbFdpdGhNb25nb29zZSA9IGdsb2JhbCBhcyBHbG9iYWxXaXRoTW9uZ29vc2U7XG5cbmlmICghZ2xvYmFsV2l0aE1vbmdvb3NlLm1vbmdvb3NlQ29ubikge1xuICBnbG9iYWxXaXRoTW9uZ29vc2UubW9uZ29vc2VDb25uID0geyBjb25uOiBudWxsLCBwcm9taXNlOiBudWxsIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGRiQ29ubmVjdCgpOiBQcm9taXNlPHR5cGVvZiBtb25nb29zZT4ge1xuICBjb25zdCBNT05HT0RCX1VSSSA9IHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJIHx8IHByb2Nlc3MuZW52LlZJVEVfTU9OR09EQl9VUkk7XG4gIGlmICghTU9OR09EQl9VUkkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgTU9OR09EQl9VUkkgKG9yIFZJVEVfTU9OR09EQl9VUkkpIGVudmlyb25tZW50IHZhcmlhYmxlJyk7XG4gIH1cbiAgY29uc3QgY2FjaGVkID0gZ2xvYmFsV2l0aE1vbmdvb3NlLm1vbmdvb3NlQ29ubiE7XG5cbiAgaWYgKGNhY2hlZC5jb25uKSB7XG4gICAgcmV0dXJuIGNhY2hlZC5jb25uO1xuICB9XG5cbiAgaWYgKCFjYWNoZWQucHJvbWlzZSkge1xuICAgIGNhY2hlZC5wcm9taXNlID0gbW9uZ29vc2UuY29ubmVjdChNT05HT0RCX1VSSSwge1xuICAgICAgLy8gS2VlcCBwb29sIHJlYXNvbmFibGUgZm9yIGxvY2FsIGRldlxuICAgICAgbWF4UG9vbFNpemU6IDUsXG4gICAgfSkudGhlbigobW9uZ29vc2VJbnN0YW5jZSkgPT4ge1xuICAgICAgcmV0dXJuIG1vbmdvb3NlSW5zdGFuY2U7XG4gICAgfSk7XG4gIH1cblxuICBjYWNoZWQuY29ubiA9IGF3YWl0IGNhY2hlZC5wcm9taXNlO1xuICByZXR1cm4gY2FjaGVkLmNvbm47XG59XG5cblxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcQm9va2luZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9tb2RlbHMvQm9va2luZy50c1wiO2ltcG9ydCBtb25nb29zZSwgeyBTY2hlbWEsIERvY3VtZW50LCBNb2RlbCwgVHlwZXMgfSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tpbmdUb3VyU25hcHNob3Qge1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgcHJpY2U6IG51bWJlcjtcclxuICBkdXJhdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tpbmdEb2N1bWVudCBleHRlbmRzIERvY3VtZW50IHtcclxuICB1c2VyOiBUeXBlcy5PYmplY3RJZDtcclxuICB0b3VyOiBUeXBlcy5PYmplY3RJZDtcclxuICB0b3VySW5mbzogQm9va2luZ1RvdXJTbmFwc2hvdDtcclxuICBib29raW5nRGF0ZTogRGF0ZTsgLy8gVGhlIGRhdGUgdGhlIGN1c3RvbWVyIHdpbGwgdGFrZSB0aGUgdG91ciAoXCJUb3VyIERhdGVcIilcclxuICBwYXJ0aWNpcGFudHM6IG51bWJlcjtcclxuICBwYXJ0aWNpcGFudHNCcmVha2Rvd24/OiB7IGFkdWx0cz86IG51bWJlcjsgY2hpbGRyZW4/OiBudW1iZXIgfTtcclxuICB0b3RhbFByaWNlOiBudW1iZXI7XHJcbiAgc3RhdHVzOiAncGVuZGluZycgfCAnY29uZmlybWVkJyB8ICdjYW5jZWxsZWQnIHwgJ3JlZnVuZGVkJztcclxuICBwYXltZW50SWQ/OiBzdHJpbmc7XHJcbiAgcGF5bWVudE1ldGhvZD86IHN0cmluZztcclxuICBwYXltZW50VHJhbnNhY3Rpb25JZD86IHN0cmluZztcclxuICBwcmljZUJyZWFrZG93bj86IHsgYmFzZVByaWNlPzogbnVtYmVyOyB0YXhlcz86IG51bWJlcjsgZmVlcz86IG51bWJlciB9O1xyXG4gIGhpc3Rvcnk/OiBBcnJheTx7IGF0OiBEYXRlOyBhY3Rpb246IHN0cmluZzsgYnk/OiBUeXBlcy5PYmplY3RJZDsgbm90ZT86IHN0cmluZyB9PjtcclxuICBjcmVhdGVkQXQ6IERhdGU7XHJcbiAgdXBkYXRlZEF0OiBEYXRlO1xyXG59XHJcblxyXG5jb25zdCBCb29raW5nU2NoZW1hID0gbmV3IFNjaGVtYTxCb29raW5nRG9jdW1lbnQ+KFxyXG4gIHtcclxuICAgIHVzZXI6IHsgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdVc2VyJywgcmVxdWlyZWQ6IHRydWUsIGluZGV4OiB0cnVlIH0sXHJcbiAgICB0b3VyOiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiAnVG91cicsIHJlcXVpcmVkOiB0cnVlLCBpbmRleDogdHJ1ZSB9LFxyXG4gICAgdG91ckluZm86IHtcclxuICAgICAgdGl0bGU6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICBwcmljZTogeyB0eXBlOiBOdW1iZXIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIGR1cmF0aW9uOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIH0sXHJcbiAgICBib29raW5nRGF0ZTogeyB0eXBlOiBEYXRlLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgcGFydGljaXBhbnRzOiB7IHR5cGU6IE51bWJlciwgcmVxdWlyZWQ6IHRydWUsIG1pbjogMSB9LFxyXG4gICAgcGFydGljaXBhbnRzQnJlYWtkb3duOiB7XHJcbiAgICAgIGFkdWx0czogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcclxuICAgICAgY2hpbGRyZW46IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXHJcbiAgICB9LFxyXG4gICAgdG90YWxQcmljZTogeyB0eXBlOiBOdW1iZXIsIHJlcXVpcmVkOiB0cnVlLCBtaW46IDAgfSxcclxuICAgIHN0YXR1czogeyB0eXBlOiBTdHJpbmcsIGVudW06IFsncGVuZGluZycsICdjb25maXJtZWQnLCAnY2FuY2VsbGVkJywgJ3JlZnVuZGVkJ10sIGRlZmF1bHQ6ICdwZW5kaW5nJyB9LFxyXG4gICAgcGF5bWVudElkOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gICAgcGF5bWVudE1ldGhvZDogeyB0eXBlOiBTdHJpbmcgfSxcclxuICAgIHBheW1lbnRUcmFuc2FjdGlvbklkOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gICAgcHJpY2VCcmVha2Rvd246IHtcclxuICAgICAgYmFzZVByaWNlOiB7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9LFxyXG4gICAgICB0YXhlczogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcclxuICAgICAgZmVlczogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcclxuICAgIH0sXHJcbiAgICBoaXN0b3J5OiBbXHJcbiAgICAgIHtcclxuICAgICAgICBhdDogeyB0eXBlOiBEYXRlLCBkZWZhdWx0OiAoKSA9PiBuZXcgRGF0ZSgpIH0sXHJcbiAgICAgICAgYWN0aW9uOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgICBieTogeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ1VzZXInIH0sXHJcbiAgICAgICAgbm90ZTogeyB0eXBlOiBTdHJpbmcgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7IHRpbWVzdGFtcHM6IHRydWUgfVxyXG4pO1xyXG5cclxuY29uc3QgQm9va2luZzogTW9kZWw8Qm9va2luZ0RvY3VtZW50PiA9IG1vbmdvb3NlLm1vZGVscy5Cb29raW5nIHx8IG1vbmdvb3NlLm1vZGVsPEJvb2tpbmdEb2N1bWVudD4oJ0Jvb2tpbmcnLCBCb29raW5nU2NoZW1hKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJvb2tpbmc7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbW9kZWxzXFxcXFRvdXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3QvdmlldC1hZHZlbnR1cmUtY29ubmVjdC9zcmMvbW9kZWxzL1RvdXIudHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwsIFR5cGVzIH0gZnJvbSAnbW9uZ29vc2UnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUb3VySXRpbmVyYXJ5SXRlbSB7XHJcbiAgZGF5OiBudW1iZXI7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRvdXJEb2N1bWVudCBleHRlbmRzIERvY3VtZW50IHtcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIHByaWNlOiBudW1iZXI7XHJcbiAgZHVyYXRpb246IHN0cmluZztcclxuICBtYXhHcm91cFNpemU/OiBudW1iZXI7XHJcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcbiAgaXRpbmVyYXJ5PzogVG91ckl0aW5lcmFyeUl0ZW1bXTtcclxuICBpbmNsdXNpb25zPzogc3RyaW5nW107XHJcbiAgZXhjbHVzaW9ucz86IHN0cmluZ1tdO1xyXG4gIGF2ZXJhZ2VSYXRpbmc/OiBudW1iZXI7XHJcbiAgcmV2aWV3Q291bnQ/OiBudW1iZXI7XHJcbiAgaXNTdXN0YWluYWJsZT86IGJvb2xlYW47XHJcbiAgZGVzdGluYXRpb246IFR5cGVzLk9iamVjdElkO1xyXG4gIG93bmVyOiBUeXBlcy5PYmplY3RJZDtcclxuICBzdGF0dXM6ICdkcmFmdCcgfCAncHVibGlzaGVkJyB8ICdhcmNoaXZlZCc7XHJcbiAgbWFpbkltYWdlPzogc3RyaW5nO1xyXG4gIGltYWdlR2FsbGVyeT86IHN0cmluZ1tdO1xyXG4gIGNyZWF0ZWRBdDogRGF0ZTtcclxuICB1cGRhdGVkQXQ6IERhdGU7XHJcbn1cclxuXHJcbmNvbnN0IFRvdXJTY2hlbWEgPSBuZXcgU2NoZW1hPFRvdXJEb2N1bWVudD4oXHJcbiAge1xyXG4gICAgdGl0bGU6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgcHJpY2U6IHsgdHlwZTogTnVtYmVyLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgZHVyYXRpb246IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgbWF4R3JvdXBTaXplOiB7IHR5cGU6IE51bWJlciB9LFxyXG4gICAgZGVzY3JpcHRpb246IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgICBpdGluZXJhcnk6IFtcclxuICAgICAge1xyXG4gICAgICAgIGRheTogeyB0eXBlOiBOdW1iZXIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgICAgdGl0bGU6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBpbmNsdXNpb25zOiBbeyB0eXBlOiBTdHJpbmcgfV0sXHJcbiAgICBleGNsdXNpb25zOiBbeyB0eXBlOiBTdHJpbmcgfV0sXHJcbiAgYXZlcmFnZVJhdGluZzogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAsIG1pbjogMCwgbWF4OiA1IH0sXHJcbiAgcmV2aWV3Q291bnQ6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwLCBtaW46IDAgfSxcclxuICAgIGlzU3VzdGFpbmFibGU6IHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogZmFsc2UgfSxcclxuICAgIGRlc3RpbmF0aW9uOiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiAnRGVzdGluYXRpb24nLCByZXF1aXJlZDogdHJ1ZSwgaW5kZXg6IHRydWUgfSxcclxuICAgIG93bmVyOiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiAnVXNlcicsIHJlcXVpcmVkOiB0cnVlLCBpbmRleDogdHJ1ZSB9LFxyXG4gICAgc3RhdHVzOiB7IHR5cGU6IFN0cmluZywgZW51bTogWydkcmFmdCcsICdwdWJsaXNoZWQnLCAnYXJjaGl2ZWQnXSwgZGVmYXVsdDogJ2RyYWZ0JywgaW5kZXg6IHRydWUgfSxcclxuICAgIG1haW5JbWFnZTogeyB0eXBlOiBTdHJpbmcgfSxcclxuICAgIGltYWdlR2FsbGVyeTogW3sgdHlwZTogU3RyaW5nIH1dLFxyXG4gIH0sXHJcbiAgeyB0aW1lc3RhbXBzOiB0cnVlIH1cclxuKTtcclxuXHJcbmNvbnN0IFRvdXI6IE1vZGVsPFRvdXJEb2N1bWVudD4gPVxyXG4gIG1vbmdvb3NlLm1vZGVscy5Ub3VyIHx8IG1vbmdvb3NlLm1vZGVsPFRvdXJEb2N1bWVudD4oJ1RvdXInLCBUb3VyU2NoZW1hKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFRvdXI7XHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXGxpYlxcXFxhdXRoXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXGxpYlxcXFxhdXRoXFxcXGp3dC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9saWIvYXV0aC9qd3QudHNcIjtpbXBvcnQgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSnd0UGF5bG9hZE1pbmltYWwge1xuICB1c2VySWQ6IHN0cmluZztcbiAgcm9sZTogJ3VzZXInIHwgJ3BhcnRuZXInIHwgJ2FkbWluJztcbn1cblxuY29uc3QgSldUX1NFQ1JFVCA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVQgfHwgJ2Rldl9zZWNyZXRfY2hhbmdlX21lJztcbmNvbnN0IEpXVF9FWFBJUkVTX0lOID0gcHJvY2Vzcy5lbnYuSldUX0VYUElSRVNfSU4gfHwgJzdkJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25Kd3QocGF5bG9hZDogSnd0UGF5bG9hZE1pbmltYWwpOiBzdHJpbmcge1xuICByZXR1cm4gand0LnNpZ24ocGF5bG9hZCwgSldUX1NFQ1JFVCwgeyBleHBpcmVzSW46IEpXVF9FWFBJUkVTX0lOIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmVyaWZ5Snd0KHRva2VuOiBzdHJpbmcpOiBKd3RQYXlsb2FkTWluaW1hbCB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKSBhcyBKd3RQYXlsb2FkTWluaW1hbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuXG5cblxuXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbW9kZWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1xcXFxEZXN0aW5hdGlvbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9tb2RlbHMvRGVzdGluYXRpb24udHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwgfSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc3RpbmF0aW9uRG9jdW1lbnQgZXh0ZW5kcyBEb2N1bWVudCB7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIHNsdWc6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbj86IHN0cmluZztcclxuICBoaXN0b3J5Pzogc3RyaW5nO1xyXG4gIGN1bHR1cmU/OiBzdHJpbmc7XHJcbiAgZ2VvZ3JhcGh5Pzogc3RyaW5nO1xyXG4gIG1haW5JbWFnZT86IHN0cmluZztcclxuICBpbWFnZUdhbGxlcnk/OiBzdHJpbmdbXTtcclxuICBiZXN0VGltZVRvVmlzaXQ/OiBzdHJpbmc7XHJcbiAgZXNzZW50aWFsVGlwcz86IHN0cmluZ1tdO1xyXG4gIHN0YXR1cz86ICdkcmFmdCcgfCAncHVibGlzaGVkJztcclxuICBjcmVhdGVkQXQ6IERhdGU7XHJcbiAgdXBkYXRlZEF0OiBEYXRlO1xyXG59XHJcblxyXG5jb25zdCBEZXN0aW5hdGlvblNjaGVtYSA9IG5ldyBTY2hlbWE8RGVzdGluYXRpb25Eb2N1bWVudD4oXHJcbiAge1xyXG4gICAgbmFtZTogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBzbHVnOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIHVuaXF1ZTogdHJ1ZSwgaW5kZXg6IHRydWUgfSxcclxuICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gICAgaGlzdG9yeTogeyB0eXBlOiBTdHJpbmcgfSxcclxuICAgIGN1bHR1cmU6IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgICBnZW9ncmFwaHk6IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgICBtYWluSW1hZ2U6IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgICBpbWFnZUdhbGxlcnk6IFt7IHR5cGU6IFN0cmluZyB9XSxcclxuICAgIGJlc3RUaW1lVG9WaXNpdDogeyB0eXBlOiBTdHJpbmcgfSxcclxuICAgIGVzc2VudGlhbFRpcHM6IFt7IHR5cGU6IFN0cmluZyB9XSxcclxuICAgIHN0YXR1czogeyB0eXBlOiBTdHJpbmcsIGVudW06IFsnZHJhZnQnLCdwdWJsaXNoZWQnXSwgZGVmYXVsdDogJ2RyYWZ0JywgaW5kZXg6IHRydWUgfSxcclxuICB9LFxyXG4gIHsgdGltZXN0YW1wczogdHJ1ZSB9XHJcbik7XHJcblxyXG5jb25zdCBEZXN0aW5hdGlvbjogTW9kZWw8RGVzdGluYXRpb25Eb2N1bWVudD4gPVxyXG4gIG1vbmdvb3NlLm1vZGVscy5EZXN0aW5hdGlvbiB8fCBtb25nb29zZS5tb2RlbDxEZXN0aW5hdGlvbkRvY3VtZW50PignRGVzdGluYXRpb24nLCBEZXN0aW5hdGlvblNjaGVtYSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBEZXN0aW5hdGlvbjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcVXNlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9tb2RlbHMvVXNlci50c1wiO2ltcG9ydCBtb25nb29zZSwgeyBTY2hlbWEsIERvY3VtZW50LCBNb2RlbCwgVHlwZXMgfSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdCc7XG5cbmV4cG9ydCB0eXBlIFVzZXJSb2xlID0gJ3VzZXInIHwgJ3BhcnRuZXInIHwgJ3N0YWZmJyB8ICdhZG1pbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlckRvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xuICBuYW1lOiBzdHJpbmc7XG4gIGVtYWlsOiBzdHJpbmc7XG4gIHBhc3N3b3JkOiBzdHJpbmc7XG4gIGF2YXRhcj86IHN0cmluZztcbiAgcm9sZTogVXNlclJvbGU7XG4gIHN0YXR1czogJ2FjdGl2ZScgfCAncGVuZGluZ19hcHByb3ZhbCcgfCAnc3VzcGVuZGVkJztcbiAgc2F2ZWRUb3VyczogVHlwZXMuT2JqZWN0SWRbXTtcbiAgc2F2ZWRTdG9yaWVzOiBUeXBlcy5PYmplY3RJZFtdO1xuICBjb250cmlidXRpb25TY29yZT86IG51bWJlcjtcbiAgY3JlYXRlZEF0OiBEYXRlO1xuICB1cGRhdGVkQXQ6IERhdGU7XG4gIGNvbXBhcmVQYXNzd29yZChjYW5kaWRhdGU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlck1vZGVsIGV4dGVuZHMgTW9kZWw8VXNlckRvY3VtZW50PiB7fVxuXG5jb25zdCBVc2VyU2NoZW1hID0gbmV3IFNjaGVtYTxVc2VyRG9jdW1lbnQ+KFxuICB7XG4gICAgbmFtZTogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCB0cmltOiB0cnVlIH0sXG4gICAgZW1haWw6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgdW5pcXVlOiB0cnVlLCBsb3dlcmNhc2U6IHRydWUsIGluZGV4OiB0cnVlIH0sXG4gICAgcGFzc3dvcmQ6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgbWlubGVuZ3RoOiA2IH0sXG4gICAgYXZhdGFyOiB7IHR5cGU6IFN0cmluZyB9LFxuICAgIHJvbGU6IHsgdHlwZTogU3RyaW5nLCBlbnVtOiBbJ3VzZXInLCAncGFydG5lcicsICdzdGFmZicsICdhZG1pbiddLCBkZWZhdWx0OiAndXNlcicgfSxcbiAgICBzdGF0dXM6IHsgdHlwZTogU3RyaW5nLCBlbnVtOiBbJ2FjdGl2ZScsICdwZW5kaW5nX2FwcHJvdmFsJywgJ3N1c3BlbmRlZCddLCBkZWZhdWx0OiAnYWN0aXZlJyB9LFxuICAgIHNhdmVkVG91cnM6IFt7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiAnVG91cicgfV0sXG4gICAgc2F2ZWRTdG9yaWVzOiBbeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ1N0b3J5JyB9XSxcbiAgICBjb250cmlidXRpb25TY29yZTogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcbiAgfSxcbiAgeyB0aW1lc3RhbXBzOiB0cnVlIH1cbik7XG5cbi8vIFBhc3N3b3JkIGhhc2hpbmdcblVzZXJTY2hlbWEucHJlKCdzYXZlJywgYXN5bmMgZnVuY3Rpb24gKG5leHQpIHtcbiAgY29uc3QgdXNlciA9IHRoaXMgYXMgVXNlckRvY3VtZW50O1xuICBcbiAgLy8gQWRkIGEgbG9nIHRvIGNvbmZpcm0gdGhlIGhvb2sgaXMgZmlyaW5nXG4gIGNvbnNvbGUubG9nKGBbVXNlciBNb2RlbF0gJ3ByZS1zYXZlJyBob29rIHRyaWdnZXJlZCBmb3IgdXNlcjogJHt1c2VyLmVtYWlsfWApO1xuICBcbiAgaWYgKCF1c2VyLmlzTW9kaWZpZWQoJ3Bhc3N3b3JkJykpIHtcbiAgICBjb25zb2xlLmxvZygnW1VzZXIgTW9kZWxdIFBhc3N3b3JkIG5vdCBtb2RpZmllZCwgc2tpcHBpbmcgaGFzaGluZy4nKTtcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG4gIFxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCdbVXNlciBNb2RlbF0gUGFzc3dvcmQgbW9kaWZpZWQuIEhhc2hpbmcgcGFzc3dvcmQuLi4nKTtcbiAgICBjb25zdCBzYWx0Um91bmRzID0gMTA7XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKHVzZXIucGFzc3dvcmQsIHNhbHRSb3VuZHMpO1xuICAgIHVzZXIucGFzc3dvcmQgPSBoYXNoO1xuICAgIGNvbnNvbGUubG9nKCdbVXNlciBNb2RlbF0gUGFzc3dvcmQgc3VjY2Vzc2Z1bGx5IGhhc2hlZC4nKTtcbiAgICBuZXh0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tVc2VyIE1vZGVsXSBFcnJvciBoYXNoaW5nIHBhc3N3b3JkOicsIGVycik7XG4gICAgbmV4dChlcnIgYXMgRXJyb3IpO1xuICB9XG59KTtcblxuVXNlclNjaGVtYS5tZXRob2RzLmNvbXBhcmVQYXNzd29yZCA9IGFzeW5jIGZ1bmN0aW9uIChjYW5kaWRhdGU6IHN0cmluZykge1xuICBjb25zb2xlLmxvZyhgW1VzZXIgTW9kZWxdIENvbXBhcmluZyBwYXNzd29yZCBmb3IgdXNlcjogJHt0aGlzLmVtYWlsfWApO1xuICBjb25zb2xlLmxvZyhgW1VzZXIgTW9kZWxdIFN0b3JlZCBoYXNoOiAke3RoaXMucGFzc3dvcmR9YCk7XG4gIGNvbnNvbGUubG9nKGBbVXNlciBNb2RlbF0gQ2FuZGlkYXRlIHBhc3N3b3JkOiAke2NhbmRpZGF0ZX1gKTtcbiAgXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKGNhbmRpZGF0ZSwgdGhpcy5wYXNzd29yZCk7XG4gIGNvbnNvbGUubG9nKGBbVXNlciBNb2RlbF0gUGFzc3dvcmQgY29tcGFyaXNvbiByZXN1bHQ6ICR7cmVzdWx0fWApO1xuICBcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmNvbnN0IFVzZXI6IFVzZXJNb2RlbCA9IG1vbmdvb3NlLm1vZGVscy5Vc2VyIHx8IG1vbmdvb3NlLm1vZGVsPFVzZXJEb2N1bWVudCwgVXNlck1vZGVsPignVXNlcicsIFVzZXJTY2hlbWEpO1xuXG5leHBvcnQgZGVmYXVsdCBVc2VyO1xuXG5cblxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcQ291cG9uLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL21vZGVscy9Db3Vwb24udHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwsIFR5cGVzIH0gZnJvbSAnbW9uZ29vc2UnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb3Vwb25SdWxlcyB7XHJcbiAgbWluaW11bVNwZW5kPzogbnVtYmVyO1xyXG4gIGFwcGxpY2FibGVUb0Rlc3RpbmF0aW9ucz86IFR5cGVzLk9iamVjdElkW107XHJcbiAgYXBwbGljYWJsZVRvUGFydG5lcnM/OiBUeXBlcy5PYmplY3RJZFtdO1xyXG4gIGFwcGxpY2FibGVUb1RvdXJzPzogVHlwZXMuT2JqZWN0SWRbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb3Vwb25MaW1pdHMge1xyXG4gIHRvdGFsVXNlcz86IG51bWJlcjtcclxuICB1c2VzUGVyQ3VzdG9tZXI/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvdXBvbkRvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xyXG4gIGNvZGU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbj86IHN0cmluZztcclxuICBkaXNjb3VudFR5cGU6ICdwZXJjZW50YWdlJyB8ICdmaXhlZF9hbW91bnQnO1xyXG4gIGRpc2NvdW50VmFsdWU6IG51bWJlcjtcclxuICBydWxlcz86IENvdXBvblJ1bGVzO1xyXG4gIGxpbWl0cz86IENvdXBvbkxpbWl0cztcclxuICBzdGFydERhdGU/OiBEYXRlO1xyXG4gIGVuZERhdGU/OiBEYXRlO1xyXG4gIGlzQWN0aXZlOiBib29sZWFuO1xyXG4gIHVzZWRDb3VudDogbnVtYmVyO1xyXG4gIHVzZWRCeTogVHlwZXMuT2JqZWN0SWRbXTtcclxuICBjcmVhdGVkQXQ6IERhdGU7XHJcbiAgdXBkYXRlZEF0OiBEYXRlO1xyXG59XHJcblxyXG5jb25zdCBDb3Vwb25TY2hlbWEgPSBuZXcgU2NoZW1hPENvdXBvbkRvY3VtZW50Pih7XHJcbiAgY29kZTogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCB1bmlxdWU6IHRydWUsIGluZGV4OiB0cnVlIH0sXHJcbiAgZGVzY3JpcHRpb246IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgZGlzY291bnRUeXBlOiB7IHR5cGU6IFN0cmluZywgZW51bTogWydwZXJjZW50YWdlJywgJ2ZpeGVkX2Ftb3VudCddLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gIGRpc2NvdW50VmFsdWU6IHsgdHlwZTogTnVtYmVyLCByZXF1aXJlZDogdHJ1ZSwgbWluOiAwIH0sXHJcbiAgcnVsZXM6IHtcclxuICAgIG1pbmltdW1TcGVuZDogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcclxuICAgIGFwcGxpY2FibGVUb0Rlc3RpbmF0aW9uczogW3sgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdEZXN0aW5hdGlvbicgfV0sXHJcbiAgICBhcHBsaWNhYmxlVG9QYXJ0bmVyczogW3sgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdVc2VyJyB9XSxcclxuICAgIGFwcGxpY2FibGVUb1RvdXJzOiBbeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ1RvdXInIH1dLFxyXG4gIH0sXHJcbiAgbGltaXRzOiB7XHJcbiAgICB0b3RhbFVzZXM6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXHJcbiAgICB1c2VzUGVyQ3VzdG9tZXI6IHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogZmFsc2UgfSxcclxuICB9LFxyXG4gIHN0YXJ0RGF0ZTogeyB0eXBlOiBEYXRlIH0sXHJcbiAgZW5kRGF0ZTogeyB0eXBlOiBEYXRlIH0sXHJcbiAgaXNBY3RpdmU6IHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogdHJ1ZSwgaW5kZXg6IHRydWUgfSxcclxuICB1c2VkQ291bnQ6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXHJcbiAgdXNlZEJ5OiBbeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ1VzZXInIH1dLFxyXG59LCB7IHRpbWVzdGFtcHM6IHRydWUgfSk7XHJcblxyXG5jb25zdCBDb3Vwb246IE1vZGVsPENvdXBvbkRvY3VtZW50PiA9IG1vbmdvb3NlLm1vZGVscy5Db3Vwb24gfHwgbW9uZ29vc2UubW9kZWw8Q291cG9uRG9jdW1lbnQ+KCdDb3Vwb24nLCBDb3Vwb25TY2hlbWEpO1xyXG5leHBvcnQgZGVmYXVsdCBDb3Vwb247XHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcQmFubmVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL21vZGVscy9CYW5uZXIudHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwgfSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJhbm5lckRvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xyXG4gIGltYWdlVXJsOiBzdHJpbmc7XHJcbiAgdGl0bGU/OiBzdHJpbmc7XHJcbiAgc3VidGl0bGU/OiBzdHJpbmc7XHJcbiAgbGlua1VybD86IHN0cmluZztcclxuICBpc0FjdGl2ZTogYm9vbGVhbjtcclxuICBkaXNwbGF5T3JkZXI6IG51bWJlcjtcclxuICBjcmVhdGVkQXQ6IERhdGU7XHJcbiAgdXBkYXRlZEF0OiBEYXRlO1xyXG59XHJcblxyXG5jb25zdCBCYW5uZXJTY2hlbWEgPSBuZXcgU2NoZW1hPEJhbm5lckRvY3VtZW50Pih7XHJcbiAgaW1hZ2VVcmw6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gIHRpdGxlOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gIHN1YnRpdGxlOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gIGxpbmtVcmw6IHsgdHlwZTogU3RyaW5nIH0sXHJcbiAgaXNBY3RpdmU6IHsgdHlwZTogQm9vbGVhbiwgZGVmYXVsdDogdHJ1ZSB9LFxyXG4gIGRpc3BsYXlPcmRlcjogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAsIGluZGV4OiB0cnVlIH0sXHJcbn0sIHsgdGltZXN0YW1wczogdHJ1ZSB9KTtcclxuXHJcbmNvbnN0IEJhbm5lcjogTW9kZWw8QmFubmVyRG9jdW1lbnQ+ID0gbW9uZ29vc2UubW9kZWxzLkJhbm5lciB8fCBtb25nb29zZS5tb2RlbDxCYW5uZXJEb2N1bWVudD4oJ0Jhbm5lcicsIEJhbm5lclNjaGVtYSk7XHJcbmV4cG9ydCBkZWZhdWx0IEJhbm5lcjtcclxuXHJcblxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbW9kZWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1xcXFxDb2xsZWN0aW9uLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL21vZGVscy9Db2xsZWN0aW9uLnRzXCI7aW1wb3J0IG1vbmdvb3NlLCB7IFNjaGVtYSwgRG9jdW1lbnQsIE1vZGVsLCBUeXBlcyB9IGZyb20gJ21vbmdvb3NlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29sbGVjdGlvbkRvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbj86IHN0cmluZztcclxuICB0b3VyczogVHlwZXMuT2JqZWN0SWRbXTtcclxuICBjcmVhdGVkQXQ6IERhdGU7XHJcbiAgdXBkYXRlZEF0OiBEYXRlO1xyXG59XHJcblxyXG5jb25zdCBDb2xsZWN0aW9uU2NoZW1hID0gbmV3IFNjaGVtYTxDb2xsZWN0aW9uRG9jdW1lbnQ+KHtcclxuICBuYW1lOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIHRyaW06IHRydWUgfSxcclxuICBkZXNjcmlwdGlvbjogeyB0eXBlOiBTdHJpbmcgfSxcclxuICB0b3VyczogW3sgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdUb3VyJyB9XSxcclxufSwgeyB0aW1lc3RhbXBzOiB0cnVlIH0pO1xyXG5cclxuY29uc3QgQ29sbGVjdGlvbjogTW9kZWw8Q29sbGVjdGlvbkRvY3VtZW50PiA9IG1vbmdvb3NlLm1vZGVscy5Db2xsZWN0aW9uIHx8IG1vbmdvb3NlLm1vZGVsPENvbGxlY3Rpb25Eb2N1bWVudD4oJ0NvbGxlY3Rpb24nLCBDb2xsZWN0aW9uU2NoZW1hKTtcclxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjtcclxuXHJcblxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbW9kZWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1xcXFxTZXR0aW5ncy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9tb2RlbHMvU2V0dGluZ3MudHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwgfSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlZmVycmFsUHJvZ3JhbVNldHRpbmdzIHtcclxuICByZXdhcmRBbW91bnQ6IG51bWJlcjtcclxuICBkaXNjb3VudFBlcmNlbnRhZ2U6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0RvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xyXG4gIHJlZmVycmFsUHJvZ3JhbTogUmVmZXJyYWxQcm9ncmFtU2V0dGluZ3M7XHJcbiAgY3JlYXRlZEF0OiBEYXRlO1xyXG4gIHVwZGF0ZWRBdDogRGF0ZTtcclxufVxyXG5cclxuY29uc3QgUmVmZXJyYWxQcm9ncmFtU2NoZW1hID0gbmV3IFNjaGVtYTxSZWZlcnJhbFByb2dyYW1TZXR0aW5ncz4oe1xyXG4gIHJld2FyZEFtb3VudDogeyBcclxuICAgIHR5cGU6IE51bWJlciwgXHJcbiAgICBkZWZhdWx0OiAwLCBcclxuICAgIG1pbjogMCxcclxuICAgIHJlcXVpcmVkOiB0cnVlIFxyXG4gIH0sXHJcbiAgZGlzY291bnRQZXJjZW50YWdlOiB7IFxyXG4gICAgdHlwZTogTnVtYmVyLCBcclxuICAgIGRlZmF1bHQ6IDEwLCBcclxuICAgIG1pbjogMCwgXHJcbiAgICBtYXg6IDEwMCxcclxuICAgIHJlcXVpcmVkOiB0cnVlIFxyXG4gIH0sXHJcbn0pO1xyXG5cclxuY29uc3QgU2V0dGluZ3NTY2hlbWEgPSBuZXcgU2NoZW1hPFNldHRpbmdzRG9jdW1lbnQ+KHtcclxuICByZWZlcnJhbFByb2dyYW06IHtcclxuICAgIHR5cGU6IFJlZmVycmFsUHJvZ3JhbVNjaGVtYSxcclxuICAgIGRlZmF1bHQ6ICgpID0+ICh7fSlcclxuICB9LFxyXG59LCB7IFxyXG4gIHRpbWVzdGFtcHM6IHRydWUsXHJcbiAgLy8gRW5zdXJlIG9ubHkgb25lIHNldHRpbmdzIGRvY3VtZW50IGV4aXN0c1xyXG4gIGNvbGxlY3Rpb246ICdzZXR0aW5ncydcclxufSk7XHJcblxyXG4vLyBDcmVhdGUgYSBjb21wb3VuZCBpbmRleCB0byBlbnN1cmUgdW5pcXVlbmVzc1xyXG5TZXR0aW5nc1NjaGVtYS5pbmRleCh7fSwgeyB1bmlxdWU6IHRydWUgfSk7XHJcblxyXG5jb25zdCBTZXR0aW5nczogTW9kZWw8U2V0dGluZ3NEb2N1bWVudD4gPSBtb25nb29zZS5tb2RlbHMuU2V0dGluZ3MgfHwgbW9uZ29vc2UubW9kZWw8U2V0dGluZ3NEb2N1bWVudD4oJ1NldHRpbmdzJywgU2V0dGluZ3NTY2hlbWEpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3M7XHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcUmV2aWV3LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL21vZGVscy9SZXZpZXcudHNcIjtpbXBvcnQgbW9uZ29vc2UsIHsgU2NoZW1hLCBEb2N1bWVudCwgTW9kZWwsIFR5cGVzIH0gZnJvbSAnbW9uZ29vc2UnO1xyXG5pbXBvcnQgVG91ciBmcm9tICcuL1RvdXInO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZXZpZXdEb2N1bWVudCBleHRlbmRzIERvY3VtZW50IHtcclxuICB1c2VyOiBUeXBlcy5PYmplY3RJZDtcclxuICB0b3VyOiBUeXBlcy5PYmplY3RJZDtcclxuICByYXRpbmc6IG51bWJlcjsgLy8gMS4uNVxyXG4gIGNvbW1lbnQ/OiBzdHJpbmc7XHJcbiAgc3RhdHVzPzogJ3BlbmRpbmcnIHwgJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCc7XHJcbiAgcmVqZWN0aW9uUmVhc29uPzogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogRGF0ZTtcclxuICB1cGRhdGVkQXQ6IERhdGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBSZXZpZXdNb2RlbCBleHRlbmRzIE1vZGVsPFJldmlld0RvY3VtZW50PiB7XHJcbiAgY2FsY3VsYXRlQXZlcmFnZVJhdGluZyh0b3VySWQ6IFR5cGVzLk9iamVjdElkKTogUHJvbWlzZTx2b2lkPjtcclxufVxyXG5cclxuY29uc3QgUmV2aWV3U2NoZW1hID0gbmV3IFNjaGVtYTxSZXZpZXdEb2N1bWVudCwgUmV2aWV3TW9kZWw+KFxyXG4gIHtcclxuICAgIHVzZXI6IHsgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdVc2VyJywgcmVxdWlyZWQ6IHRydWUsIGluZGV4OiB0cnVlIH0sXHJcbiAgICB0b3VyOiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiAnVG91cicsIHJlcXVpcmVkOiB0cnVlLCBpbmRleDogdHJ1ZSB9LFxyXG4gICAgcmF0aW5nOiB7IHR5cGU6IE51bWJlciwgcmVxdWlyZWQ6IHRydWUsIG1pbjogMSwgbWF4OiA1IH0sXHJcbiAgICBjb21tZW50OiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gICAgc3RhdHVzOiB7IHR5cGU6IFN0cmluZywgZW51bTogWydwZW5kaW5nJywgJ2FwcHJvdmVkJywgJ3JlamVjdGVkJ10sIGRlZmF1bHQ6ICdwZW5kaW5nJywgaW5kZXg6IHRydWUgfSxcclxuICAgIHJlamVjdGlvblJlYXNvbjogeyB0eXBlOiBTdHJpbmcgfSxcclxuICB9LFxyXG4gIHsgdGltZXN0YW1wczogdHJ1ZSB9XHJcbik7XHJcblxyXG4vLyBDb21wb3VuZCBpbmRleDogb25lIHJldmlldyBwZXIgdXNlciBwZXIgdG91clxyXG5SZXZpZXdTY2hlbWEuaW5kZXgoeyB0b3VyOiAxLCB1c2VyOiAxIH0sIHsgdW5pcXVlOiB0cnVlIH0pO1xyXG5cclxuUmV2aWV3U2NoZW1hLnN0YXRpY3MuY2FsY3VsYXRlQXZlcmFnZVJhdGluZyA9IGFzeW5jIGZ1bmN0aW9uICh0b3VySWQ6IFR5cGVzLk9iamVjdElkKSB7XHJcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCB0aGlzLmFnZ3JlZ2F0ZShbXHJcbiAgICB7ICRtYXRjaDogeyB0b3VyOiB0b3VySWQsIHN0YXR1czogJ2FwcHJvdmVkJyB9IH0sXHJcbiAgICB7XHJcbiAgICAgICRncm91cDoge1xyXG4gICAgICAgIF9pZDogJyR0b3VyJyxcclxuICAgICAgICBhdmVyYWdlUmF0aW5nOiB7ICRhdmc6ICckcmF0aW5nJyB9LFxyXG4gICAgICAgIHJldmlld0NvdW50OiB7ICRzdW06IDEgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSk7XHJcblxyXG4gIGNvbnN0IGF2ZXJhZ2VSYXRpbmcgPSBzdGF0c1swXT8uYXZlcmFnZVJhdGluZyA/PyAwO1xyXG4gIGNvbnN0IHJldmlld0NvdW50ID0gc3RhdHNbMF0/LnJldmlld0NvdW50ID8/IDA7XHJcbiAgYXdhaXQgVG91ci5maW5kQnlJZEFuZFVwZGF0ZSh0b3VySWQsIHsgYXZlcmFnZVJhdGluZywgcmV2aWV3Q291bnQgfSwgeyBuZXc6IHRydWUgfSkuZXhlYygpO1xyXG59O1xyXG5cclxuUmV2aWV3U2NoZW1hLnBvc3QoJ3NhdmUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgY29uc3QgcmV2aWV3ID0gdGhpcyBhcyBSZXZpZXdEb2N1bWVudDtcclxuICBhd2FpdCAocmV2aWV3LmNvbnN0cnVjdG9yIGFzIFJldmlld01vZGVsKS5jYWxjdWxhdGVBdmVyYWdlUmF0aW5nKHJldmlldy50b3VyKTtcclxufSk7XHJcblxyXG5SZXZpZXdTY2hlbWEucG9zdCgncmVtb3ZlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gIGNvbnN0IHJldmlldyA9IHRoaXMgYXMgUmV2aWV3RG9jdW1lbnQ7XHJcbiAgYXdhaXQgKHJldmlldy5jb25zdHJ1Y3RvciBhcyBSZXZpZXdNb2RlbCkuY2FsY3VsYXRlQXZlcmFnZVJhdGluZyhyZXZpZXcudG91cik7XHJcbn0pO1xyXG5cclxuY29uc3QgUmV2aWV3OiBSZXZpZXdNb2RlbCA9IG1vbmdvb3NlLm1vZGVscy5SZXZpZXcgfHwgbW9uZ29vc2UubW9kZWw8UmV2aWV3RG9jdW1lbnQsIFJldmlld01vZGVsPignUmV2aWV3JywgUmV2aWV3U2NoZW1hKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJldmlldztcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXG1vZGVsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcXFxcUm9sZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9tb2RlbHMvUm9sZS50c1wiO2ltcG9ydCBtb25nb29zZSwgeyBTY2hlbWEsIERvY3VtZW50LCBNb2RlbCB9IGZyb20gJ21vbmdvb3NlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUm9sZURvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBwZXJtaXNzaW9uczogc3RyaW5nW107XHJcbiAgY3JlYXRlZEF0OiBEYXRlO1xyXG4gIHVwZGF0ZWRBdDogRGF0ZTtcclxufVxyXG5cclxuY29uc3QgUm9sZVNjaGVtYSA9IG5ldyBTY2hlbWE8Um9sZURvY3VtZW50Pih7XHJcbiAgbmFtZTogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlLCB1bmlxdWU6IHRydWUgfSxcclxuICBwZXJtaXNzaW9uczogW3sgdHlwZTogU3RyaW5nIH1dLFxyXG59LCB7IHRpbWVzdGFtcHM6IHRydWUgfSk7XHJcblxyXG5jb25zdCBSb2xlOiBNb2RlbDxSb2xlRG9jdW1lbnQ+ID0gbW9uZ29vc2UubW9kZWxzLlJvbGUgfHwgbW9uZ29vc2UubW9kZWw8Um9sZURvY3VtZW50PignUm9sZScsIFJvbGVTY2hlbWEpO1xyXG5leHBvcnQgZGVmYXVsdCBSb2xlO1xyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxtb2RlbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbW9kZWxzXFxcXFN0b3J5LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL21vZGVscy9TdG9yeS50c1wiO2ltcG9ydCBtb25nb29zZSwgeyBTY2hlbWEsIERvY3VtZW50LCBNb2RlbCwgVHlwZXMgfSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0b3J5RG9jdW1lbnQgZXh0ZW5kcyBEb2N1bWVudCB7XHJcbiAgYXV0aG9yOiBUeXBlcy5PYmplY3RJZDtcclxuICBkZXN0aW5hdGlvbj86IFR5cGVzLk9iamVjdElkO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgY29udGVudDogc3RyaW5nO1xyXG4gIGNvdmVySW1hZ2U/OiBzdHJpbmc7XHJcbiAgdGFnczogc3RyaW5nW107XHJcbiAgbGlrZXM6IFR5cGVzLk9iamVjdElkW107XHJcbiAgbGlrZUNvdW50OiBudW1iZXI7XHJcbiAgc3RhdHVzPzogJ3BlbmRpbmcnIHwgJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCc7XHJcbiAgcmVqZWN0aW9uUmVhc29uPzogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogRGF0ZTtcclxuICB1cGRhdGVkQXQ6IERhdGU7XHJcbn1cclxuXHJcbmNvbnN0IFN0b3J5U2NoZW1hID0gbmV3IFNjaGVtYTxTdG9yeURvY3VtZW50PihcclxuICB7XHJcbiAgICBhdXRob3I6IHsgdHlwZTogU2NoZW1hLlR5cGVzLk9iamVjdElkLCByZWY6ICdVc2VyJywgcmVxdWlyZWQ6IHRydWUsIGluZGV4OiB0cnVlIH0sXHJcbiAgICBkZXN0aW5hdGlvbjogeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ0Rlc3RpbmF0aW9uJyB9LFxyXG4gICAgdGl0bGU6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgdHJpbTogdHJ1ZSB9LFxyXG4gICAgY29udGVudDogeyB0eXBlOiBTdHJpbmcsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBjb3ZlckltYWdlOiB7IHR5cGU6IFN0cmluZyB9LFxyXG4gICAgdGFnczogW3sgdHlwZTogU3RyaW5nLCBpbmRleDogdHJ1ZSB9XSxcclxuICAgIGxpa2VzOiBbeyB0eXBlOiBTY2hlbWEuVHlwZXMuT2JqZWN0SWQsIHJlZjogJ1VzZXInIH1dLFxyXG4gICAgbGlrZUNvdW50OiB7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9LFxyXG4gICAgc3RhdHVzOiB7IHR5cGU6IFN0cmluZywgZW51bTogWydwZW5kaW5nJywgJ2FwcHJvdmVkJywgJ3JlamVjdGVkJ10sIGRlZmF1bHQ6ICdwZW5kaW5nJywgaW5kZXg6IHRydWUgfSxcclxuICAgIHJlamVjdGlvblJlYXNvbjogeyB0eXBlOiBTdHJpbmcgfSxcclxuICB9LFxyXG4gIHsgdGltZXN0YW1wczogdHJ1ZSB9XHJcbik7XHJcblxyXG4vLyBNYWludGFpbiBsaWtlQ291bnQgZGVyaXZlZCBmcm9tIGxpa2VzIGFycmF5IGxlbmd0aFxyXG5TdG9yeVNjaGVtYS5wcmUoJ3NhdmUnLCBmdW5jdGlvbiAobmV4dCkge1xyXG4gIGNvbnN0IHN0b3J5ID0gdGhpcyBhcyBTdG9yeURvY3VtZW50O1xyXG4gIGlmIChzdG9yeS5pc01vZGlmaWVkKCdsaWtlcycpKSB7XHJcbiAgICBzdG9yeS5saWtlQ291bnQgPSBzdG9yeS5saWtlcy5sZW5ndGg7XHJcbiAgfVxyXG4gIG5leHQoKTtcclxufSk7XHJcblxyXG5jb25zdCBTdG9yeTogTW9kZWw8U3RvcnlEb2N1bWVudD4gPSBtb25nb29zZS5tb2RlbHMuU3RvcnkgfHwgbW9uZ29vc2UubW9kZWw8U3RvcnlEb2N1bWVudD4oJ1N0b3J5JywgU3RvcnlTY2hlbWEpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU3Rvcnk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxwYWdlc1xcXFxhcGlcXFxcYWRtaW5cXFxcdG91cnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxccGFnZXNcXFxcYXBpXFxcXGFkbWluXFxcXHRvdXJzXFxcXGluZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL3BhZ2VzL2FwaS9hZG1pbi90b3Vycy9pbmRleC50c1wiOy8vIFRoZSBmaW5hbCwgY29ycmVjdCwgYW5kIGhhcmRlbmVkIGNvbnRlbnQgZm9yOiBzcmMvcGFnZXMvYXBpL2FkbWluL3RvdXJzL2luZGV4LnRzXHJcbmltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gJ2h0dHAnO1xyXG5pbXBvcnQgZGJDb25uZWN0IGZyb20gJy4uLy4uLy4uLy4uL2xpYi9kYkNvbm5lY3QnO1xyXG5pbXBvcnQgVG91ciBmcm9tICcuLi8uLi8uLi8uLi9tb2RlbHMvVG91cic7XHJcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5mdW5jdGlvbiBzZW5kKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiB1bmtub3duKSB7XHJcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XHJcbiAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSkge1xyXG4gIGNvbnN0IGhhbmRsZXJOYW1lID0gJy9hcGkvYWRtaW4vdG91cnMnO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBTdGFydGluZyByZXF1ZXN0IHByb2Nlc3NpbmcuLi5gKTtcclxuICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xyXG4gICAgY29uc29sZS5sb2coYFske2hhbmRsZXJOYW1lfV0gRGF0YWJhc2UgY29ubmVjdGVkIHN1Y2Nlc3NmdWxseS5gKTtcclxuXHJcbiAgICBzd2l0Y2ggKHJlcS5tZXRob2QpIHtcclxuICAgICAgY2FzZSAnR0VUJzpcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBSZWNlaXZlZCBHRVQgcmVxdWVzdC5gKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgJycsICdodHRwOi8vbG9jYWxob3N0Jyk7XHJcbiAgICAgICAgY29uc3Qge1xyXG4gICAgICAgICAgcGFnZSA9ICcxJyxcclxuICAgICAgICAgIGxpbWl0ID0gJzEwJyxcclxuICAgICAgICAgIHN0YXR1cyxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uSWQsXHJcbiAgICAgICAgICBvd25lcklkLFxyXG4gICAgICAgICAgc2VhcmNoLFxyXG4gICAgICAgIH0gPSBPYmplY3QuZnJvbUVudHJpZXModXJsLnNlYXJjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhZ2VOdW0gPSBwYXJzZUludChwYWdlLCAxMCk7XHJcbiAgICAgICAgY29uc3QgbGltaXROdW0gPSBwYXJzZUludChsaW1pdCwgMTApO1xyXG4gICAgICAgIGNvbnN0IHNraXAgPSAocGFnZU51bSAtIDEpICogbGltaXROdW07XHJcblxyXG4gICAgICAgIGNvbnN0IG1hdGNoU3RhZ2U6IGFueSA9IHt9O1xyXG4gICAgICAgIGlmIChzdGF0dXMpIG1hdGNoU3RhZ2Uuc3RhdHVzID0gc3RhdHVzO1xyXG4gICAgICAgIGlmIChkZXN0aW5hdGlvbklkKSBtYXRjaFN0YWdlLmRlc3RpbmF0aW9uID0gbmV3IG1vbmdvb3NlLlR5cGVzLk9iamVjdElkKGRlc3RpbmF0aW9uSWQpO1xyXG4gICAgICAgIGlmIChvd25lcklkKSBtYXRjaFN0YWdlLm93bmVyID0gbmV3IG1vbmdvb3NlLlR5cGVzLk9iamVjdElkKG93bmVySWQpO1xyXG4gICAgICAgIGlmIChzZWFyY2gpIG1hdGNoU3RhZ2UudGl0bGUgPSB7ICRyZWdleDogc2VhcmNoLCAkb3B0aW9uczogJ2knIH07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEV4ZWN1dGluZyBhZ2dyZWdhdGlvbiB3aXRoIG1hdGNoIHN0YWdlOmAsIG1hdGNoU3RhZ2UpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIFBhZ2luYXRpb246IHBhZ2U9JHtwYWdlTnVtfSwgbGltaXQ9JHtsaW1pdE51bX0sIHNraXA9JHtza2lwfWApO1xyXG5cclxuICAgICAgICBjb25zdCBwaXBlbGluZTogbW9uZ29vc2UuUGlwZWxpbmVTdGFnZVtdID0gW1xyXG4gICAgICAgICAgeyAkbWF0Y2g6IG1hdGNoU3RhZ2UgfSxcclxuICAgICAgICAgIHsgJHNvcnQ6IHsgY3JlYXRlZEF0OiAtMSB9IH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICRmYWNldDoge1xyXG4gICAgICAgICAgICAgIG1ldGFkYXRhOiBbeyAkY291bnQ6ICd0b3RhbCcgfV0sXHJcbiAgICAgICAgICAgICAgZGF0YTogW1xyXG4gICAgICAgICAgICAgICAgeyAkc2tpcDogc2tpcCB9LFxyXG4gICAgICAgICAgICAgICAgeyAkbGltaXQ6IGxpbWl0TnVtIH0sXHJcbiAgICAgICAgICAgICAgICB7ICRsb29rdXA6IHsgZnJvbTogJ3VzZXJzJywgbG9jYWxGaWVsZDogJ293bmVyJywgZm9yZWlnbkZpZWxkOiAnX2lkJywgYXM6ICdvd25lckluZm8nIH0gfSxcclxuICAgICAgICAgICAgICAgIHsgJGxvb2t1cDogeyBmcm9tOiAnZGVzdGluYXRpb25zJywgbG9jYWxGaWVsZDogJ2Rlc3RpbmF0aW9uJywgZm9yZWlnbkZpZWxkOiAnX2lkJywgYXM6ICdkZXN0aW5hdGlvbkluZm8nIH0gfSxcclxuICAgICAgICAgICAgICAgIHsgJGxvb2t1cDogeyBmcm9tOiAnYm9va2luZ3MnLCBsb2NhbEZpZWxkOiAnX2lkJywgZm9yZWlnbkZpZWxkOiAndG91cicsIGFzOiAnYm9va2luZ3MnIH0gfSxcclxuICAgICAgICAgICAgICAgIC8vIFVud2luZCBvd25lciBhbmQgZGVzdGluYXRpb24gdG8gaGFuZGxlIGNhc2VzIHdoZXJlIGxvb2t1cCBtaWdodCBiZSBlbXB0eVxyXG4gICAgICAgICAgICAgICAgeyAkdW53aW5kOiB7IHBhdGg6IFwiJG93bmVySW5mb1wiLCBwcmVzZXJ2ZU51bGxBbmRFbXB0eUFycmF5czogdHJ1ZSB9IH0sXHJcbiAgICAgICAgICAgICAgICB7ICR1bndpbmQ6IHsgcGF0aDogXCIkZGVzdGluYXRpb25JbmZvXCIsIHByZXNlcnZlTnVsbEFuZEVtcHR5QXJyYXlzOiB0cnVlIH0gfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgJHByb2plY3Q6IHtcclxuICAgICAgICAgICAgICAgICAgICBfaWQ6IDEsIFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAxLCBcclxuICAgICAgICAgICAgICAgICAgICBtYWluSW1hZ2U6IDEsIFxyXG4gICAgICAgICAgICAgICAgICAgIHByaWNlOiAxLCBcclxuICAgICAgICAgICAgICAgICAgICBhdmVyYWdlUmF0aW5nOiAxLCBcclxuICAgICAgICAgICAgICAgICAgICByZXZpZXdDb3VudDogMSwgXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSAkaWZOdWxsIHRvIHByZXZlbnQgZXJyb3JzIGlmIGEgcmVsYXRpb25zaGlwIGlzIG1pc3NpbmdcclxuICAgICAgICAgICAgICAgICAgICBvd25lcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgX2lkOiB7ICRpZk51bGw6IFtcIiRvd25lckluZm8uX2lkXCIsIG51bGxdIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7ICRpZk51bGw6IFtcIiRvd25lckluZm8ubmFtZVwiLCBcIk4vQVwiXSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgX2lkOiB7ICRpZk51bGw6IFtcIiRkZXN0aW5hdGlvbkluZm8uX2lkXCIsIG51bGxdIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7ICRpZk51bGw6IFtcIiRkZXN0aW5hdGlvbkluZm8ubmFtZVwiLCBcIk4vQVwiXSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBib29raW5nQ291bnQ6IHsgJHNpemU6IFwiJGJvb2tpbmdzXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbFJldmVudWU6IHsgJHN1bTogXCIkYm9va2luZ3MudG90YWxQcmljZVwiIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEV4ZWN1dGluZyBhZ2dyZWdhdGlvbiBwaXBlbGluZS4uLmApO1xyXG4gICAgICAgIGNvbnN0IFtyZXN1bHRzXSA9IGF3YWl0IFRvdXIuYWdncmVnYXRlKHBpcGVsaW5lKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBBZ2dyZWdhdGlvbiBjb21wbGV0ZWQuIFJhdyByZXN1bHRzOmAsIEpTT04uc3RyaW5naWZ5KHJlc3VsdHMsIG51bGwsIDIpKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCB0b3VycyA9IHJlc3VsdHMuZGF0YSB8fCBbXTtcclxuICAgICAgICBjb25zdCB0b3RhbFRvdXJzID0gcmVzdWx0cy5tZXRhZGF0YVswXT8udG90YWwgfHwgMDtcclxuICAgICAgICBjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5jZWlsKHRvdGFsVG91cnMgLyBsaW1pdE51bSk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEFnZ3JlZ2F0aW9uIHN1Y2Nlc3NmdWwuIEZvdW5kICR7dG90YWxUb3Vyc30gdG90YWwgdG91cnMsIHJldHVybmluZyAke3RvdXJzLmxlbmd0aH0uYCk7XHJcblxyXG4gICAgICAgIHJldHVybiBzZW5kKHJlcywgMjAwLCB7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICB0b3VycyxcclxuICAgICAgICAgICAgcGFnaW5hdGlvbjoge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBwYWdlTnVtLFxyXG4gICAgICAgICAgICAgIHRvdGFsUGFnZXMsXHJcbiAgICAgICAgICAgICAgdG90YWxUb3VycyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICBjYXNlICdQT1NUJzpcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBSZWNlaXZlZCBQT1NUIHJlcXVlc3QuYCk7XHJcbiAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4geyBcclxuICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuazogYW55KSA9PiBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCkpOyBcclxuICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4gcmVzb2x2ZSgpKTsgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBDcmVhdGluZyB0b3VyIHdpdGggcGF5bG9hZDpgLCBwYXlsb2FkKTtcclxuICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgVG91ci5jcmVhdGUocGF5bG9hZCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFske2hhbmRsZXJOYW1lfV0gVG91ciBjcmVhdGVkIHN1Y2Nlc3NmdWxseTpgLCBjcmVhdGVkLl9pZCk7XHJcbiAgICAgICAgcmV0dXJuIHNlbmQocmVzLCAyMDEsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY3JlYXRlZCB9KTtcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc29sZS5sb2coYFske2hhbmRsZXJOYW1lfV0gTWV0aG9kICR7cmVxLm1ldGhvZH0gbm90IGFsbG93ZWQuYCk7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQWxsb3cnLCBbJ0dFVCcsICdQT1NUJ10pO1xyXG4gICAgICAgIHJldHVybiBzZW5kKHJlcywgNDA1LCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE1ldGhvZCAke3JlcS5tZXRob2R9IE5vdCBBbGxvd2VkYCB9KTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGBbRVJST1IgaW4gJHtoYW5kbGVyTmFtZX1dYCwgZXJyb3IpO1xyXG4gICAgY29uc29sZS5lcnJvcihgW0VSUk9SIGluICR7aGFuZGxlck5hbWV9XSBTdGFjayB0cmFjZTpgLCBlcnJvci5zdGFjayk7XHJcbiAgICByZXR1cm4gc2VuZChyZXMsIDUwMCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBTZXJ2ZXIgRXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGFuZGxlcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXBpXFxcXG1lZGlhSGFuZGxlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9saWIvYXBpL21lZGlhSGFuZGxlci50c1wiOy8vIHNyYy9saWIvYXBpL21lZGlhSGFuZGxlci50c1xyXG5pbXBvcnQgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCc7XHJcbmltcG9ydCBmb3JtaWRhYmxlLCB7IEZpbGUgfSBmcm9tICdmb3JtaWRhYmxlJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG4vLyBUaGlzIGNvbmZpZyBpcyBmb3IgTmV4dC5qcyBhbmQgaXMgTk9UIG5lZWRlZCBpbiBWaXRlLiBXZSBoYW5kbGUgdGhpcyBtYW51YWxseS5cclxuLy8gZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHsgYXBpOiB7IGJvZHlQYXJzZXI6IGZhbHNlIH0gfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVJbWFnZVVwbG9hZChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCB1cGxvYWREaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYycsICd1cGxvYWRzJywgJ2ltYWdlcycpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHVwbG9hZERpcikpIHtcclxuICAgICAgZnMubWtkaXJTeW5jKHVwbG9hZERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybSA9IGZvcm1pZGFibGUoe1xyXG4gICAgICB1cGxvYWREaXIsXHJcbiAgICAgIGtlZXBFeHRlbnNpb25zOiB0cnVlLFxyXG4gICAgICBtYXhGaWxlczogMSxcclxuICAgICAgbWF4RmlsZVNpemU6IDEwICogMTAyNCAqIDEwMjQsIC8vIDEwTUJcclxuICAgIH0pO1xyXG5cclxuICAgIGZvcm0ucGFyc2UocmVxLCAoZXJyLCBmaWVsZHMsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbRk9STUlEQUJMRSBFUlJPUl0nLCBlcnIpO1xyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYEZpbGUgcGFyc2luZyBlcnJvcjogJHtlcnIubWVzc2FnZX1gIH0pKTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyAtLS0gVEhFIERFRklOSVRJVkUgRklYIC0tLVxyXG4gICAgICAvLyBSYXRpb25hbGU6IEZvcm1pZGFibGUgd3JhcHMgc2luZ2xlIGZpbGUgdXBsb2FkcyBpbiBhbiBhcnJheS4gV2UgbXVzdCBleHBlY3QgYW4gYXJyYXkuXHJcbiAgICAgIGNvbnN0IGZpbGVzQXJyYXkgPSBmaWxlcy5maWxlO1xyXG5cclxuICAgICAgLy8gMS4gQ2hlY2sgaWYgdGhlIGFycmF5IGV4aXN0cyBhbmQgaXMgbm90IGVtcHR5LlxyXG4gICAgICBpZiAoIWZpbGVzQXJyYXkgfHwgZmlsZXNBcnJheS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbTUVESUEgSEFORExFUl0gVGhlIFwiZmlsZVwiIGFycmF5IGlzIG1pc3Npbmcgb3IgZW1wdHkuJyk7XHJcbiAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnS2hcdTAwRjRuZyBjXHUwMEYzIGZpbGUgblx1MDBFMG8gXHUwMTExXHUwMUIwXHUxRUUzYyB0XHUxRUEzaSBsXHUwMEVBbi4nIH0pKTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyAyLiBBY2Nlc3MgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGFycmF5LlxyXG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBmaWxlc0FycmF5WzBdO1xyXG4gICAgICAvLyAtLS0gRU5EIERFRklOSVRJVkUgRklYIC0tLVxyXG5cclxuICAgICAgaWYgKCF1cGxvYWRlZEZpbGUpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgZmFsbGJhY2ssIGJ1dCB0aGUgY2hlY2sgYWJvdmUgc2hvdWxkIGNhdGNoIGl0LlxyXG4gICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZpbGUgdFx1MUVBM2kgbFx1MDBFQW4ga2hcdTAwRjRuZyBoXHUxRUUzcCBsXHUxRUM3LicgfSkpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHB1YmxpY1VybCA9IGAvdXBsb2Fkcy9pbWFnZXMvJHtwYXRoLmJhc2VuYW1lKHVwbG9hZGVkRmlsZS5maWxlcGF0aCl9YDtcclxuICAgICAgY29uc29sZS5sb2coYFtNRURJQSBIQU5ETEVSXSBGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseS4gUHVibGljIFVSTDogJHtwdWJsaWNVcmx9YCk7XHJcblxyXG4gICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMTtcclxuICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgdXJsOiBwdWJsaWNVcmwgfSB9KSk7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXV0aFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXV0aFxcXFxnZXRBdXRoVXNlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9saWIvYXV0aC9nZXRBdXRoVXNlci50c1wiOy8vIHNyYy9saWIvYXV0aC9nZXRBdXRoVXNlci50c1xuaW1wb3J0IHsgSW5jb21pbmdNZXNzYWdlIH0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7IC8vIDEuIEltcG9ydCB0aGUgZW50aXJlIG1vZHVsZSBhcyBhIGRlZmF1bHQgZXhwb3J0XG5pbXBvcnQgY29va2llIGZyb20gJ2Nvb2tpZSc7ICAgLy8gICAgQXBwbHkgdGhlIHNhbWUgcGF0dGVybiB0byB0aGUgJ2Nvb2tpZScgbGlicmFyeSBmb3IgY29uc2lzdGVuY3lcblxuLy8gMi4gVXNlIEphdmFTY3JpcHQgZGVzdHJ1Y3R1cmluZyB0byBnZXQgdGhlIGZ1bmN0aW9ucyB3ZSBuZWVkLlxuY29uc3QgeyB2ZXJpZnkgfSA9IGp3dDtcbmNvbnN0IHsgcGFyc2UgfSA9IGNvb2tpZTtcblxuaW50ZXJmYWNlIEF1dGhlbnRpY2F0ZWRVc2VyIHtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIHJvbGU6IHN0cmluZztcbiAgLy8gQWRkIGFueSBvdGhlciBmaWVsZHMgeW91IHB1dCBpbiB5b3VyIEpXVCBwYXlsb2FkXG59XG5cbi8qKlxuICogQSByb2J1c3QsIHNlcnZlci1zaWRlIHV0aWxpdHkgdG8gcGFyc2UgYW5kIHZlcmlmeSBhIEpXVCBmcm9tIGEgcmVxdWVzdCdzIGNvb2tpZS5cbiAqIEBwYXJhbSByZXEgVGhlIGluY29taW5nIEhUVFAgcmVxdWVzdCBvYmplY3QuXG4gKiBAcmV0dXJucyBUaGUgZGVjb2RlZCB1c2VyIHBheWxvYWQgaWYgdGhlIHRva2VuIGlzIHZhbGlkLCBvdGhlcndpc2UgbnVsbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEF1dGhVc2VyKHJlcTogSW5jb21pbmdNZXNzYWdlKTogQXV0aGVudGljYXRlZFVzZXIgfCBudWxsIHtcbiAgY29uc3QgaGFuZGxlck5hbWUgPSAnZ2V0QXV0aFVzZXInO1xuICB0cnkge1xuICAgIC8vIDEuIENoZWNrIGlmIGNvb2tpZXMgZXhpc3Qgb24gdGhlIHJlcXVlc3QgYXQgYWxsLlxuICAgIGlmICghcmVxLmhlYWRlcnMuY29va2llKSB7XG4gICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBObyBjb29raWVzIGZvdW5kIG9uIHRoZSByZXF1ZXN0LmApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gMi4gUGFyc2UgdGhlIGNvb2tpZSBzdHJpbmcgaW50byBhbiBvYmplY3QuXG4gICAgY29uc3QgY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSk7XG4gICAgXG4gICAgLy8gMy4gR2V0IHRoZSBzcGVjaWZpYyBhdXRoZW50aWNhdGlvbiB0b2tlbi4gVGhlIG5hbWUgJ2F1dGhfdG9rZW4nIE1VU1QgbWF0Y2hcbiAgICAvLyB0aGUgbmFtZSB5b3UgdXNlZCB3aGVuIHNldHRpbmcgdGhlIGNvb2tpZSBpbiB5b3VyIGxvZ2luIEFQSS5cbiAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXMuYXV0aF90b2tlbjtcblxuICAgIGlmICghdG9rZW4pIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dICdhdXRoX3Rva2VuJyBjb29raWUgbm90IGZvdW5kLmApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gNC4gVmVyaWZ5IHRoZSB0b2tlbiB1c2luZyB0aGUgc2VjcmV0IGtleSBmcm9tIHlvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgdG9rZW4gaXMgaW52YWxpZCBvciBleHBpcmVkLlxuICAgIGNvbnN0IGRlY29kZWQgPSB2ZXJpZnkodG9rZW4sIHByb2Nlc3MuZW52LkpXVF9TRUNSRVQhKSBhcyBBdXRoZW50aWNhdGVkVXNlcjtcblxuICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIFRva2VuIHN1Y2Nlc3NmdWxseSB2ZXJpZmllZCBmb3IgdXNlciBJRDogJHtkZWNvZGVkLnVzZXJJZH1gKTtcbiAgICBcbiAgICAvLyA1LiBSZXR1cm4gdGhlIGRlY29kZWQgcGF5bG9hZC5cbiAgICByZXR1cm4gZGVjb2RlZDtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIFRoaXMgYmxvY2sgd2lsbCBjYXRjaCBlcnJvcnMgZnJvbSBgdmVyaWZ5YCAoZS5nLiwgVG9rZW5FeHBpcmVkRXJyb3IsIEpzb25XZWJUb2tlbkVycm9yKS5cbiAgICBjb25zb2xlLmVycm9yKGBbJHtoYW5kbGVyTmFtZX1dIFRva2VuIHZlcmlmaWNhdGlvbiBmYWlsZWQ6YCwgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXBpXFxcXHN0b3J5SGFuZGxlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9saWIvYXBpL3N0b3J5SGFuZGxlci50c1wiO2ltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gJ2h0dHAnO1xyXG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcclxuaW1wb3J0IGRiQ29ubmVjdCBmcm9tICcuLi8uLi9saWIvZGJDb25uZWN0JztcclxuaW1wb3J0IHsgd2l0aEF1dGgsIEF1dGhlZFJlcXVlc3QgfSBmcm9tICcuLi8uLi9saWIvYXV0aC93aXRoQXV0aCc7XHJcbmltcG9ydCB7IGdldEF1dGhVc2VyIH0gZnJvbSAnLi4vLi4vbGliL2F1dGgvZ2V0QXV0aFVzZXInO1xyXG5pbXBvcnQgU3RvcnkgZnJvbSAnLi4vLi4vbW9kZWxzL1N0b3J5JztcclxuXHJcbi8vIC0tLSBUSEUgREVGSU5JVElWRSBGSVggSVMgSEVSRSAtLS1cclxuLy8gVmFsaWRhdGlvbiBzY2hlbWEgZm9yIHN0b3J5IGNyZWF0aW9uXHJcbmNvbnN0IENyZWF0ZVN0b3J5U2NoZW1hID0gei5vYmplY3Qoe1xyXG4gIHRpdGxlOiB6LnN0cmluZygpLm1pbigxLCAnVGlcdTAwRUF1IFx1MDExMVx1MUVDMSBraFx1MDBGNG5nIFx1MDExMVx1MDFCMFx1MUVFM2MgXHUwMTExXHUxRUMzIHRyXHUxRUQxbmcnKS5tYXgoMjAwLCAnVGlcdTAwRUF1IFx1MDExMVx1MUVDMSBraFx1MDBGNG5nIFx1MDExMVx1MDFCMFx1MUVFM2Mgdlx1MDFCMFx1MUVFM3QgcXVcdTAwRTEgMjAwIGtcdTAwRkQgdFx1MUVGMScpLFxyXG4gIGNvbnRlbnQ6IHouc3RyaW5nKCkubWluKDEwLCAnTlx1MUVEOWkgZHVuZyBwaFx1MUVBM2kgY1x1MDBGMyBcdTAwRUR0IG5oXHUxRUE1dCAxMCBrXHUwMEZEIHRcdTFFRjEnKSxcclxuICBjb3ZlckltYWdlVXJsOiB6LnN0cmluZygpLm1pbigxLCAnVnVpIGxcdTAwRjJuZyB0XHUxRUEzaSBsXHUwMEVBbiBtXHUxRUQ5dCBcdTFFQTNuaCBiXHUwMEVDYS4nKSxcclxuICB0YWdzOiB6LmFycmF5KHouc3RyaW5nKCkubWluKDEsICdUYWcga2hcdTAwRjRuZyBcdTAxMTFcdTAxQjBcdTFFRTNjIFx1MDExMVx1MUVDMyB0clx1MUVEMW5nJykpLm1heCgxMCwgJ0toXHUwMEY0bmcgXHUwMTExXHUwMUIwXHUxRUUzYyB2XHUwMUIwXHUxRUUzdCBxdVx1MDBFMSAxMCB0YWdzJyksXHJcbiAgZGVzdGluYXRpb25JZDogei5zdHJpbmcoKS5vcHRpb25hbCgpXHJcbn0pO1xyXG4vLyAtLS0gRU5EIERFRklOSVRJVkUgRklYIC0tLVxyXG5cclxudHlwZSBDcmVhdGVTdG9yeURhdGEgPSB6LmluZmVyPHR5cGVvZiBDcmVhdGVTdG9yeVNjaGVtYT47XHJcblxyXG5mdW5jdGlvbiBzZW5kKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiB1bmtub3duKSB7XHJcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XHJcbiAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNyZWF0ZVN0b3J5KHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEdldCBhdXRoZW50aWNhdGVkIHVzZXIgZnJvbSBKV1QgdG9rZW5cclxuICAgIGNvbnN0IGF1dGhVc2VyID0gZ2V0QXV0aFVzZXIocmVxKTtcclxuICAgIFxyXG4gICAgaWYgKCFhdXRoVXNlcikge1xyXG4gICAgICByZXR1cm4gc2VuZChyZXMsIDQwMSwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdLaFx1MDBGNG5nIFx1MDExMVx1MDFCMFx1MUVFM2MgcGhcdTAwRTlwIHRydXkgY1x1MUVBRHAnIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xyXG5cclxuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keVxyXG4gICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xyXG4gICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIGNodW5rcy5wdXNoKGNodW5rIGFzIEJ1ZmZlcik7XHJcbiAgICBjb25zdCBib2R5U3RyaW5nID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCd1dGY4Jyk7XHJcbiAgICBjb25zdCBib2R5ID0gYm9keVN0cmluZyA/IEpTT04ucGFyc2UoYm9keVN0cmluZykgOiB7fTtcclxuXHJcbiAgICAvLyAtLS0gQkFDS0VORCBESUFHTk9TVElDIExPRyAtLS1cclxuICAgIGNvbnNvbGUubG9nKCctLS0gQmFja2VuZCBSZWNlaXZlZCBTdG9yeSBEYXRhIC0tLScpO1xyXG4gICAgY29uc29sZS5sb2coJ1JhdyBib2R5IHN0cmluZzonLCBib2R5U3RyaW5nKTtcclxuICAgIGNvbnNvbGUubG9nKCdQYXJzZWQgYm9keTonLCBib2R5KTtcclxuICAgIGNvbnNvbGUubG9nKCdCb2R5IHR5cGU6JywgdHlwZW9mIGJvZHkpO1xyXG4gICAgY29uc29sZS5sb2coJ0JvZHkga2V5czonLCBPYmplY3Qua2V5cyhib2R5KSk7XHJcbiAgICBjb25zb2xlLmxvZygnQm9keSB2YWx1ZXM6JywgT2JqZWN0LnZhbHVlcyhib2R5KSk7XHJcbiAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRlZCB1c2VyIElEOicsIGF1dGhVc2VyLnVzZXJJZCk7XHJcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgcmVxdWVzdCBib2R5IHVzaW5nIFpvZFxyXG4gICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IENyZWF0ZVN0b3J5U2NoZW1hLnNhZmVQYXJzZShib2R5KTtcclxuICAgIFxyXG4gICAgLy8gLS0tIFZBTElEQVRJT04gUkVTVUxUIExPRyAtLS1cclxuICAgIGNvbnNvbGUubG9nKCctLS0gVmFsaWRhdGlvbiBSZXN1bHQgLS0tJyk7XHJcbiAgICBjb25zb2xlLmxvZygnVmFsaWRhdGlvbiBzdWNjZXNzOicsIHZhbGlkYXRpb25SZXN1bHQuc3VjY2Vzcyk7XHJcbiAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICBjb25zb2xlLmxvZygnVmFsaWRhdGlvbiBlcnJvcnM6JywgdmFsaWRhdGlvblJlc3VsdC5lcnJvci5lcnJvcnMpO1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xyXG4gICAgXHJcbiAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0aW9uUmVzdWx0LmVycm9yLmVycm9ycy5tYXAoZXJyID0+IGAke2Vyci5wYXRoLmpvaW4oJy4nKX06ICR7ZXJyLm1lc3NhZ2V9YCk7XHJcbiAgICAgIHJldHVybiBzZW5kKHJlcywgNDAwLCB7IFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICBlcnJvcjogJ0RcdTFFRUYgbGlcdTFFQzd1IGtoXHUwMEY0bmcgaFx1MUVFM3AgbFx1MUVDNycsXHJcbiAgICAgICAgZGV0YWlsczogZXJyb3JzIFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdG9yeURhdGE6IENyZWF0ZVN0b3J5RGF0YSA9IHZhbGlkYXRpb25SZXN1bHQuZGF0YTtcclxuICAgIFxyXG4gICAgLy8gVXNlIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIncyBJRCBmcm9tIEpXVCB0b2tlblxyXG4gICAgY29uc3QgdXNlcklkID0gYXV0aFVzZXIudXNlcklkO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgc3RvcnkgZG9jdW1lbnRcclxuICAgIGNvbnN0IHN0b3J5ID0gYXdhaXQgU3RvcnkuY3JlYXRlKHtcclxuICAgICAgYXV0aG9yOiB1c2VySWQsXHJcbiAgICAgIHRpdGxlOiBzdG9yeURhdGEudGl0bGUsXHJcbiAgICAgIGNvbnRlbnQ6IHN0b3J5RGF0YS5jb250ZW50LFxyXG4gICAgICBjb3ZlckltYWdlOiBzdG9yeURhdGEuY292ZXJJbWFnZVVybCxcclxuICAgICAgdGFnczogc3RvcnlEYXRhLnRhZ3MsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBzdG9yeURhdGEuZGVzdGluYXRpb25JZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgIHN0YXR1czogJ3BlbmRpbmcnLCAvLyBEZWZhdWx0IHN0YXR1cyBmb3IgbW9kZXJhdGlvblxyXG4gICAgICBsaWtlczogW10sXHJcbiAgICAgIGxpa2VDb3VudDogMFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHNlbmQocmVzLCAyMDEsIHsgXHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsIFxyXG4gICAgICBkYXRhOiBzdG9yeSxcclxuICAgICAgbWVzc2FnZTogJ0JcdTAwRTBpIHZpXHUxRUJGdCBcdTAxMTFcdTAwRTMgXHUwMTExXHUwMUIwXHUxRUUzYyB0XHUxRUExbyB0aFx1MDBFMG5oIGNcdTAwRjRuZyB2XHUwMEUwIFx1MDExMWFuZyBjaFx1MUVERCBraVx1MUVDM20gZHV5XHUxRUM3dCdcclxuICAgIH0pO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgc3RvcnkgZXJyb3I6JywgZXJyb3IpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGUgTW9uZ29EQiB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRpb25FcnJvcnMgPSBPYmplY3QudmFsdWVzKGVycm9yLmVycm9ycykubWFwKChlcnI6IGFueSkgPT4gZXJyLm1lc3NhZ2UpO1xyXG4gICAgICByZXR1cm4gc2VuZChyZXMsIDQwMCwgeyBcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgICAgZXJyb3I6ICdEXHUxRUVGIGxpXHUxRUM3dSBraFx1MDBGNG5nIGhcdTFFRTNwIGxcdTFFQzcnLFxyXG4gICAgICAgIGRldGFpbHM6IHZhbGlkYXRpb25FcnJvcnMgXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZSBkdXBsaWNhdGUga2V5IGVycm9yc1xyXG4gICAgaWYgKGVycm9yLmNvZGUgPT09IDExMDAwKSB7XHJcbiAgICAgIHJldHVybiBzZW5kKHJlcywgNDAwLCB7IFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICBlcnJvcjogJ0JcdTAwRTBpIHZpXHUxRUJGdCB2XHUxRURCaSB0aVx1MDBFQXUgXHUwMTExXHUxRUMxIG5cdTAwRTB5IFx1MDExMVx1MDBFMyB0XHUxRUQzbiB0XHUxRUExaScgXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzZW5kKHJlcywgNTAwLCB7IFxyXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgIGVycm9yOiAnTFx1MUVEN2kgc2VydmVyLCB2dWkgbFx1MDBGMm5nIHRoXHUxRUVEIGxcdTFFQTFpIHNhdScgXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXGxpYlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGFwaVxcXFxkZXN0aW5hdGlvbkhhbmRsZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3QvdmlldC1hZHZlbnR1cmUtY29ubmVjdC9zcmMvbGliL2FwaS9kZXN0aW5hdGlvbkhhbmRsZXIudHNcIjtpbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJztcclxuaW1wb3J0IGRiQ29ubmVjdCBmcm9tICcuLi9kYkNvbm5lY3QnO1xyXG5pbXBvcnQgRGVzdGluYXRpb24gZnJvbSAnLi4vLi4vbW9kZWxzL0Rlc3RpbmF0aW9uJztcclxuaW1wb3J0IFRvdXIgZnJvbSAnLi4vLi4vbW9kZWxzL1RvdXInO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUdldERlc3RpbmF0aW9uQnlTbHVnKFxyXG4gIHJlcTogSW5jb21pbmdNZXNzYWdlLFxyXG4gIHJlczogU2VydmVyUmVzcG9uc2UsXHJcbiAgc2x1Zzogc3RyaW5nXHJcbikge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBkYkNvbm5lY3QoKTtcclxuXHJcbiAgICBjb25zdCBkZXN0aW5hdGlvbiA9IGF3YWl0IERlc3RpbmF0aW9uLmZpbmRPbmUoeyBzbHVnLCBzdGF0dXM6ICdwdWJsaXNoZWQnIH0pLmxlYW4oKTtcclxuICAgIGlmICghZGVzdGluYXRpb24pIHtcclxuICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XHJcbiAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnRGVzdGluYXRpb24gbm90IGZvdW5kLicgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFzc29jaWF0ZWRUb3VycyA9IGF3YWl0IFRvdXIuZmluZCh7IGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbi5faWQsIHN0YXR1czogJ3B1Ymxpc2hlZCcgfSlcclxuICAgICAgLnNlbGVjdCh7XHJcbiAgICAgICAgdGl0bGU6IDEsXHJcbiAgICAgICAgcHJpY2U6IDEsXHJcbiAgICAgICAgZHVyYXRpb246IDEsXHJcbiAgICAgICAgYXZlcmFnZVJhdGluZzogMSxcclxuICAgICAgICByZXZpZXdDb3VudDogMSxcclxuICAgICAgICBpc1N1c3RhaW5hYmxlOiAxLFxyXG4gICAgICAgIG1haW5JbWFnZTogMSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogMSxcclxuICAgICAgfSlcclxuICAgICAgLnBvcHVsYXRlKHsgcGF0aDogJ2Rlc3RpbmF0aW9uJywgc2VsZWN0OiB7IG5hbWU6IDEgfSB9KVxyXG4gICAgICAubGVhbigpO1xyXG5cclxuICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xyXG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgZGVzdGluYXRpb246IHsgLi4uZGVzdGluYXRpb24sIF9pZDogU3RyaW5nKGRlc3RpbmF0aW9uLl9pZCkgfSxcclxuICAgICAgICBhc3NvY2lhdGVkVG91cnM6IGFzc29jaWF0ZWRUb3Vycy5tYXAoKHQ6IGFueSkgPT4gKHsgLi4udCwgX2lkOiBTdHJpbmcodC5faWQpIH0pKSxcclxuICAgICAgfSxcclxuICAgIH0pKTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGBbQVBJIEhhbmRsZXIgRXJyb3JdIC9hcGkvZGVzdGluYXRpb25zLyR7c2x1Z306YCwgZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFNlcnZlciBFcnJvcjogJHtlcnJvci5tZXNzYWdlfWAgfSkpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxwYWdlc1xcXFxhcGlcXFxcdG91cnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxccGFnZXNcXFxcYXBpXFxcXHRvdXJzXFxcXHNlYXJjaC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovdmlldC1hZHZlbnR1cmUtY29ubmVjdC92aWV0LWFkdmVudHVyZS1jb25uZWN0L3NyYy9wYWdlcy9hcGkvdG91cnMvc2VhcmNoLnRzXCI7aW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCc7XHJcbmltcG9ydCBkYkNvbm5lY3QgZnJvbSAnLi4vLi4vLi4vbGliL2RiQ29ubmVjdCc7XHJcbmltcG9ydCBUb3VyIGZyb20gJy4uLy4uLy4uL21vZGVscy9Ub3VyJztcclxuaW1wb3J0IERlc3RpbmF0aW9uIGZyb20gJy4uLy4uLy4uL21vZGVscy9EZXN0aW5hdGlvbic7XHJcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5mdW5jdGlvbiBzZW5kKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiB1bmtub3duKSB7XHJcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XHJcbiAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFNlYXJjaFF1ZXJ5UGFyYW1zIHtcclxuICBkZXN0aW5hdGlvblNsdWc/OiBzdHJpbmc7XHJcbiAgc3RhcnREYXRlPzogc3RyaW5nO1xyXG4gIGFkdWx0cz86IHN0cmluZztcclxuICBtaW5QcmljZT86IHN0cmluZztcclxuICBtYXhQcmljZT86IHN0cmluZztcclxuICBtaW5SYXRpbmc/OiBzdHJpbmc7XHJcbiAgZHVyYXRpb24/OiBzdHJpbmc7XHJcbiAgc29ydEJ5PzogJ3JlbGV2YW5jZScgfCAncHJpY2VfYXNjJyB8ICdwcmljZV9kZXNjJyB8ICdyYXRpbmdfZGVzYyc7XHJcbiAgcGFnZT86IHN0cmluZztcclxuICBsaW1pdD86IHN0cmluZztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSkge1xyXG4gIGNvbnN0IGhhbmRsZXJOYW1lID0gJy9hcGkvdG91cnMvc2VhcmNoJztcclxuICBcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coYFske2hhbmRsZXJOYW1lfV0gU3RhcnRpbmcgcmVxdWVzdCBwcm9jZXNzaW5nLi4uYCk7XHJcbiAgICBcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xyXG4gICAgICByZXMuc2V0SGVhZGVyKCdBbGxvdycsIFsnR0VUJ10pO1xyXG4gICAgICByZXR1cm4gc2VuZChyZXMsIDQwNSwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBNZXRob2QgJHtyZXEubWV0aG9kfSBOb3QgQWxsb3dlZGAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgZGJDb25uZWN0KCk7XHJcbiAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBEYXRhYmFzZSBjb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5LmApO1xyXG5cclxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCB8fCAnJywgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcclxuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiBTZWFyY2hRdWVyeVBhcmFtcyA9IE9iamVjdC5mcm9tRW50cmllcyh1cmwuc2VhcmNoUGFyYW1zKTtcclxuXHJcbiAgICAvLyBQYXJzZSBhbmQgdmFsaWRhdGUgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBkZXN0aW5hdGlvblNsdWcsXHJcbiAgICAgIHN0YXJ0RGF0ZSxcclxuICAgICAgYWR1bHRzLFxyXG4gICAgICBtaW5QcmljZSxcclxuICAgICAgbWF4UHJpY2UsXHJcbiAgICAgIG1pblJhdGluZyxcclxuICAgICAgZHVyYXRpb24sXHJcbiAgICAgIHNvcnRCeSA9ICdyZWxldmFuY2UnLFxyXG4gICAgICBwYWdlID0gJzEnLFxyXG4gICAgICBsaW1pdCA9ICcxMidcclxuICAgIH0gPSBxdWVyeVBhcmFtcztcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBSYXcgcXVlcnkgcGFyYW1zOmAsIHtcclxuICAgICAgZGVzdGluYXRpb25TbHVnLFxyXG4gICAgICBzdGFydERhdGUsXHJcbiAgICAgIGFkdWx0cyxcclxuICAgICAgbWluUHJpY2UsXHJcbiAgICAgIG1heFByaWNlLFxyXG4gICAgICBtaW5SYXRpbmcsXHJcbiAgICAgIGR1cmF0aW9uLFxyXG4gICAgICBzb3J0QnksXHJcbiAgICAgIHBhZ2UsXHJcbiAgICAgIGxpbWl0LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcGFnZU51bSA9IHBhcnNlSW50KHBhZ2UsIDEwKTtcclxuICAgIGNvbnN0IGxpbWl0TnVtID0gcGFyc2VJbnQobGltaXQsIDEwKTtcclxuICAgIGNvbnN0IHNraXAgPSAocGFnZU51bSAtIDEpICogbGltaXROdW07XHJcbiAgICBjb25zdCBtaW5SYXRpbmdOdW0gPSBtaW5SYXRpbmcgPyBwYXJzZUZsb2F0KG1pblJhdGluZykgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQnVpbGQgdGhlIGFnZ3JlZ2F0aW9uIHBpcGVsaW5lXHJcbiAgICBjb25zdCBwaXBlbGluZTogbW9uZ29vc2UuUGlwZWxpbmVTdGFnZVtdID0gW107XHJcblxyXG4gICAgLy8gU3RhZ2UgMTogSW5pdGlhbCBkZXN0aW5hdGlvbiBsb29rdXAgaWYgZGVzdGluYXRpb25TbHVnIGlzIHByb3ZpZGVkXHJcbiAgICBpZiAoZGVzdGluYXRpb25TbHVnKSB7XHJcbiAgICAgIGNvbnN0IGlucHV0U2x1ZyA9IFN0cmluZyhkZXN0aW5hdGlvblNsdWcpLnRyaW0oKTtcclxuICAgICAgY29uc3Qgbm9ybWFsaXplU2x1ZyA9IChzOiBzdHJpbmcpID0+IHNcclxuICAgICAgICAudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIC5ub3JtYWxpemUoJ05GRCcpLnJlcGxhY2UoL1xccHtEaWFjcml0aWN9L2d1LCAnJylcclxuICAgICAgICAucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpXHJcbiAgICAgICAgLnJlcGxhY2UoL14tK3wtKyQvZywgJycpO1xyXG4gICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU2x1ZyhpbnB1dFNsdWcpO1xyXG4gICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBSZWNlaXZlZCBkZXN0aW5hdGlvblNsdWc9XCIke2lucHV0U2x1Z31cIiwgbm9ybWFsaXplZD1cIiR7bm9ybWFsaXplZH1cImApO1xyXG5cclxuICAgICAgLy8gVHJ5IGV4YWN0IHNsdWcgbWF0Y2ggZmlyc3RcclxuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gYXdhaXQgRGVzdGluYXRpb24uZmluZE9uZSh7IHNsdWc6IGlucHV0U2x1Zywgc3RhdHVzOiAncHVibGlzaGVkJyB9KS5sZWFuKCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIERlc3RpbmF0aW9uIGV4YWN0IGxvb2t1cCByZXN1bHQ6YCwgZGVzdGluYXRpb24/Ll9pZCB8fCBudWxsKTtcclxuXHJcbiAgICAgIC8vIFRyeSBub3JtYWxpemVkIGV4YWN0IHNsdWcgaWYgbm90IGZvdW5kIGFuZCBkaWZmZXJlbnRcclxuICAgICAgaWYgKCFkZXN0aW5hdGlvbiAmJiBub3JtYWxpemVkICYmIG5vcm1hbGl6ZWQgIT09IGlucHV0U2x1Zykge1xyXG4gICAgICAgIGRlc3RpbmF0aW9uID0gYXdhaXQgRGVzdGluYXRpb24uZmluZE9uZSh7IHNsdWc6IG5vcm1hbGl6ZWQsIHN0YXR1czogJ3B1Ymxpc2hlZCcgfSkubGVhbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIERlc3RpbmF0aW9uIG5vcm1hbGl6ZWQgbG9va3VwIHJlc3VsdDpgLCBkZXN0aW5hdGlvbj8uX2lkIHx8IG51bGwpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUcnkgcmVnZXggY29udGFpbnMgb24gc2x1ZyBhcyBhIHJlc2lsaWVudCBmYWxsYmFjayAocHJlZml4L2NvbnRhaW5zKVxyXG4gICAgICBpZiAoIWRlc3RpbmF0aW9uICYmIG5vcm1hbGl6ZWQpIHtcclxuICAgICAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAobm9ybWFsaXplZC5yZXBsYWNlKC9bLV0rL2csICdbLV0qJyksICdpJyk7XHJcbiAgICAgICAgZGVzdGluYXRpb24gPSBhd2FpdCBEZXN0aW5hdGlvbi5maW5kT25lKHsgc2x1ZzogeyAkcmVnZXg6IHJlZ2V4IH0sIHN0YXR1czogJ3B1Ymxpc2hlZCcgfSkubGVhbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIERlc3RpbmF0aW9uIHJlZ2V4IGxvb2t1cCByZXN1bHQ6YCwgZGVzdGluYXRpb24/Ll9pZCB8fCBudWxsLCBgIHJlZ2V4PS8ke3JlZ2V4LnNvdXJjZX0vaWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWRlc3RpbmF0aW9uKSB7XHJcbiAgICAgICAgLy8gSGFyZGVuZWQgYmVoYXZpb3I6IGRlc3RpbmF0aW9uIG5vdCBmb3VuZCBzaG91bGQgeWllbGQgZW1wdHkgc3VjY2Vzc2Z1bCByZXN1bHRcclxuICAgICAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBObyBkZXN0aW5hdGlvbiBtYXRjaGVkIGZvciBzbHVnLiBSZXR1cm5pbmcgZW1wdHkgc3VjY2Vzc2Z1bCByZXNwb25zZS5gKTtcclxuICAgICAgICByZXR1cm4gc2VuZChyZXMsIDIwMCwge1xyXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgdG91cnM6IFtdLFxyXG4gICAgICAgICAgICBwYWdpbmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgY3VycmVudFBhZ2U6IHBhZ2VOdW0sXHJcbiAgICAgICAgICAgICAgdG90YWxQYWdlczogMCxcclxuICAgICAgICAgICAgICB0b3RhbFRvdXJzOiAwLFxyXG4gICAgICAgICAgICAgIGhhc05leHRQYWdlOiBmYWxzZSxcclxuICAgICAgICAgICAgICBoYXNQcmV2UGFnZTogcGFnZU51bSA+IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZmlsdGVyczoge1xyXG4gICAgICAgICAgICAgIGFwcGxpZWQ6IHtcclxuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uU2x1ZyxcclxuICAgICAgICAgICAgICAgIG1pblByaWNlOiBtaW5QcmljZSA/IHBhcnNlSW50KG1pblByaWNlLCAxMCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBtYXhQcmljZTogbWF4UHJpY2UgPyBwYXJzZUludChtYXhQcmljZSwgMTApIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgbWluUmF0aW5nOiBtaW5SYXRpbmcgPyBwYXJzZUZsb2F0KG1pblJhdGluZykgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24gPyBkdXJhdGlvbi5zcGxpdCgnLCcpIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgc29ydEJ5XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1hdGNoU3RhZ2U6IGFueSA9IHsgXHJcbiAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLl9pZCxcclxuICAgICAgICBzdGF0dXM6ICdwdWJsaXNoZWQnXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEZpbmFsICRtYXRjaCAoZGVzdGluYXRpb24gKyBzdGF0dXMpOmAsIG1hdGNoU3RhZ2UpO1xyXG5cclxuICAgICAgLy8gQWRkIGRlc3RpbmF0aW9uIGZpbHRlciB0byB0aGUgcGlwZWxpbmVcclxuICAgICAgcGlwZWxpbmUucHVzaCh7ICRtYXRjaDogbWF0Y2hTdGFnZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIElmIG5vIGRlc3RpbmF0aW9uIHNwZWNpZmllZCwgb25seSBzaG93IHB1Ymxpc2hlZCB0b3Vyc1xyXG4gICAgICBwaXBlbGluZS5wdXNoKHtcclxuICAgICAgICAkbWF0Y2g6IHsgc3RhdHVzOiAncHVibGlzaGVkJyB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0YWdlIDI6IEFkZGl0aW9uYWwgZmlsdGVyc1xyXG4gICAgY29uc3QgYWRkaXRpb25hbEZpbHRlcnM6IGFueSA9IHt9O1xyXG4gICAgXHJcbiAgICBpZiAobWluUHJpY2UgfHwgbWF4UHJpY2UpIHtcclxuICAgICAgYWRkaXRpb25hbEZpbHRlcnMucHJpY2UgPSB7fTtcclxuICAgICAgaWYgKG1pblByaWNlKSBhZGRpdGlvbmFsRmlsdGVycy5wcmljZS4kZ3RlID0gcGFyc2VJbnQobWluUHJpY2UsIDEwKTtcclxuICAgICAgaWYgKG1heFByaWNlKSBhZGRpdGlvbmFsRmlsdGVycy5wcmljZS4kbHRlID0gcGFyc2VJbnQobWF4UHJpY2UsIDEwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3RlOiByYXRpbmcgZmlsdGVyIChtaW5SYXRpbmcpIGlzIGludGVudGlvbmFsbHkgZXhjbHVkZWQgZnJvbSBhZGRpdGlvbmFsRmlsdGVyc1xyXG4gICAgLy8gc28gdGhhdCBmaWx0ZXJDb3VudHMgYXJlIGNvbXB1dGVkIGFjcm9zcyBvdGhlciBhY3RpdmUgZmlsdGVycy4gVGhlIHJhdGluZyBmaWx0ZXJcclxuICAgIC8vIHdpbGwgYmUgYXBwbGllZCBpbnNpZGUgdGhlIHBhZ2luYXRlZFJlc3VsdHMgYW5kIG1ldGFkYXRhIGZhY2V0cyBvbmx5LlxyXG5cclxuICAgIGlmIChkdXJhdGlvbikge1xyXG4gICAgICAvLyBIYW5kbGUgYm90aCBzaW5nbGUgZHVyYXRpb24gYW5kIGFycmF5IG9mIGR1cmF0aW9uc1xyXG4gICAgICBjb25zdCBkdXJhdGlvblZhbHVlcyA9IGR1cmF0aW9uLmluY2x1ZGVzKCcsJykgPyBkdXJhdGlvbi5zcGxpdCgnLCcpIDogW2R1cmF0aW9uXTtcclxuICAgICAgYWRkaXRpb25hbEZpbHRlcnMuZHVyYXRpb24gPSB7ICRpbjogZHVyYXRpb25WYWx1ZXMgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgYWRkaXRpb25hbCBmaWx0ZXJzIGlmIGFueSBleGlzdFxyXG4gICAgaWYgKE9iamVjdC5rZXlzKGFkZGl0aW9uYWxGaWx0ZXJzKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEFkZGl0aW9uYWwgZmlsdGVycyB0byBhcHBseTpgLCBhZGRpdGlvbmFsRmlsdGVycyk7XHJcbiAgICAgIHBpcGVsaW5lLnB1c2goeyAkbWF0Y2g6IGFkZGl0aW9uYWxGaWx0ZXJzIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0YWdlIDM6IExvb2t1cCByZWxhdGVkIGRhdGFcclxuICAgIHBpcGVsaW5lLnB1c2goXHJcbiAgICAgIHtcclxuICAgICAgICAkbG9va3VwOiB7XHJcbiAgICAgICAgICBmcm9tOiAnZGVzdGluYXRpb25zJyxcclxuICAgICAgICAgIGxvY2FsRmllbGQ6ICdkZXN0aW5hdGlvbicsXHJcbiAgICAgICAgICBmb3JlaWduRmllbGQ6ICdfaWQnLFxyXG4gICAgICAgICAgYXM6ICdkZXN0aW5hdGlvbkluZm8nXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJGxvb2t1cDoge1xyXG4gICAgICAgICAgZnJvbTogJ3VzZXJzJyxcclxuICAgICAgICAgIGxvY2FsRmllbGQ6ICdvd25lcicsXHJcbiAgICAgICAgICBmb3JlaWduRmllbGQ6ICdfaWQnLFxyXG4gICAgICAgICAgYXM6ICdvd25lckluZm8nXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJGxvb2t1cDoge1xyXG4gICAgICAgICAgZnJvbTogJ3Jldmlld3MnLFxyXG4gICAgICAgICAgbG9jYWxGaWVsZDogJ19pZCcsXHJcbiAgICAgICAgICBmb3JlaWduRmllbGQ6ICd0b3VyJyxcclxuICAgICAgICAgIGFzOiAncmV2aWV3cydcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gU3RhZ2UgNDogVW53aW5kIGFuZCBwcm9qZWN0XHJcbiAgICBwaXBlbGluZS5wdXNoKFxyXG4gICAgICB7XHJcbiAgICAgICAgJHVud2luZDoge1xyXG4gICAgICAgICAgcGF0aDogXCIkZGVzdGluYXRpb25JbmZvXCIsXHJcbiAgICAgICAgICBwcmVzZXJ2ZU51bGxBbmRFbXB0eUFycmF5czogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgICR1bndpbmQ6IHtcclxuICAgICAgICAgIHBhdGg6IFwiJG93bmVySW5mb1wiLFxyXG4gICAgICAgICAgcHJlc2VydmVOdWxsQW5kRW1wdHlBcnJheXM6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICAkYWRkRmllbGRzOiB7XHJcbiAgICAgICAgICByZXZpZXdDb3VudDogeyAkc2l6ZTogXCIkcmV2aWV3c1wiIH0sXHJcbiAgICAgICAgICBhdmVyYWdlUmF0aW5nOiB7XHJcbiAgICAgICAgICAgICRjb25kOiB7XHJcbiAgICAgICAgICAgICAgaWY6IHsgJGd0OiBbeyAkc2l6ZTogXCIkcmV2aWV3c1wiIH0sIDBdIH0sXHJcbiAgICAgICAgICAgICAgdGhlbjogeyAkYXZnOiBcIiRyZXZpZXdzLnJhdGluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgZWxzZTogMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgJHByb2plY3Q6IHtcclxuICAgICAgICAgIF9pZDogMSxcclxuICAgICAgICAgIHRpdGxlOiAxLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IDEsXHJcbiAgICAgICAgICBwcmljZTogMSxcclxuICAgICAgICAgIGR1cmF0aW9uOiAxLFxyXG4gICAgICAgICAgbWF4R3JvdXBTaXplOiAxLFxyXG4gICAgICAgICAgbWFpbkltYWdlOiAxLFxyXG4gICAgICAgICAgaW1hZ2VHYWxsZXJ5OiAxLFxyXG4gICAgICAgICAgaXNTdXN0YWluYWJsZTogMSxcclxuICAgICAgICAgIGl0aW5lcmFyeTogMSxcclxuICAgICAgICAgIGluY2x1c2lvbnM6IDEsXHJcbiAgICAgICAgICBleGNsdXNpb25zOiAxLFxyXG4gICAgICAgICAgYXZlcmFnZVJhdGluZzogMSxcclxuICAgICAgICAgIHJldmlld0NvdW50OiAxLFxyXG4gICAgICAgICAgY3JlYXRlZEF0OiAxLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHtcclxuICAgICAgICAgICAgX2lkOiBcIiRkZXN0aW5hdGlvbkluZm8uX2lkXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiJGRlc3RpbmF0aW9uSW5mby5uYW1lXCIsXHJcbiAgICAgICAgICAgIHNsdWc6IFwiJGRlc3RpbmF0aW9uSW5mby5zbHVnXCIsXHJcbiAgICAgICAgICAgIG1haW5JbWFnZTogXCIkZGVzdGluYXRpb25JbmZvLm1haW5JbWFnZVwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgb3duZXI6IHtcclxuICAgICAgICAgICAgX2lkOiBcIiRvd25lckluZm8uX2lkXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiJG93bmVySW5mby5uYW1lXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gU3RhZ2UgNTogU29ydCBiYXNlZCBvbiBzb3J0QnkgcGFyYW1ldGVyXHJcbiAgICBsZXQgc29ydFN0YWdlOiBhbnkgPSB7fTtcclxuICAgIHN3aXRjaCAoc29ydEJ5KSB7XHJcbiAgICAgIGNhc2UgJ3ByaWNlX2FzYyc6XHJcbiAgICAgICAgc29ydFN0YWdlID0geyBwcmljZTogMSB9O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdwcmljZV9kZXNjJzpcclxuICAgICAgICBzb3J0U3RhZ2UgPSB7IHByaWNlOiAtMSB9O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdyYXRpbmdfZGVzYyc6XHJcbiAgICAgICAgc29ydFN0YWdlID0geyBhdmVyYWdlUmF0aW5nOiAtMSB9O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdyZWxldmFuY2UnOlxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIC8vIFJlbGV2YW5jZTogY29tYmluYXRpb24gb2YgcmF0aW5nIGFuZCByZXZpZXcgY291bnRcclxuICAgICAgICBzb3J0U3RhZ2UgPSB7IFxyXG4gICAgICAgICAgYXZlcmFnZVJhdGluZzogLTEsIFxyXG4gICAgICAgICAgcmV2aWV3Q291bnQ6IC0xIFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICAvLyBTdGFnZSA1ICYgNjogRmFjZXQgdG8gY29tcHV0ZSBwYWdpbmF0ZWQgcmVzdWx0cywgdG90YWwgY291bnQsIGFuZCBmaWx0ZXIgY291bnRzIGluIG9uZSBwYXNzXHJcbiAgICBwaXBlbGluZS5wdXNoKHtcclxuICAgICAgJGZhY2V0OiB7XHJcbiAgICAgICAgcGFnaW5hdGVkUmVzdWx0czogW1xyXG4gICAgICAgICAgLi4uKG1pblJhdGluZ051bSA/IFt7ICRtYXRjaDogeyBhdmVyYWdlUmF0aW5nOiB7ICRndGU6IG1pblJhdGluZ051bSB9IH0gfV0gOiBbXSksXHJcbiAgICAgICAgICB7ICRzb3J0OiBzb3J0U3RhZ2UgfSxcclxuICAgICAgICAgIHsgJHNraXA6IHNraXAgfSxcclxuICAgICAgICAgIHsgJGxpbWl0OiBsaW1pdE51bSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBtZXRhZGF0YTogW1xyXG4gICAgICAgICAgLi4uKG1pblJhdGluZ051bSA/IFt7ICRtYXRjaDogeyBhdmVyYWdlUmF0aW5nOiB7ICRndGU6IG1pblJhdGluZ051bSB9IH0gfV0gOiBbXSksXHJcbiAgICAgICAgICB7ICRjb3VudDogJ3RvdGFsJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBmaWx0ZXJDb3VudHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgJGdyb3VwOiB7XHJcbiAgICAgICAgICAgICAgX2lkOiBudWxsLFxyXG4gICAgICAgICAgICAgIHJhdGluZ181OiB7ICRzdW06IHsgJGNvbmQ6IFt7ICRndGU6IFtcIiRhdmVyYWdlUmF0aW5nXCIsIDVdIH0sIDEsIDBdIH0gfSxcclxuICAgICAgICAgICAgICByYXRpbmdfNDogeyAkc3VtOiB7ICRjb25kOiBbeyAkZ3RlOiBbXCIkYXZlcmFnZVJhdGluZ1wiLCA0XSB9LCAxLCAwXSB9IH0sXHJcbiAgICAgICAgICAgICAgcmF0aW5nXzM6IHsgJHN1bTogeyAkY29uZDogW3sgJGd0ZTogW1wiJGF2ZXJhZ2VSYXRpbmdcIiwgM10gfSwgMSwgMF0gfSB9LFxyXG4gICAgICAgICAgICAgIHJhdGluZ18yOiB7ICRzdW06IHsgJGNvbmQ6IFt7ICRndGU6IFtcIiRhdmVyYWdlUmF0aW5nXCIsIDJdIH0sIDEsIDBdIH0gfSxcclxuICAgICAgICAgICAgICByYXRpbmdfMTogeyAkc3VtOiB7ICRjb25kOiBbeyAkZ3RlOiBbXCIkYXZlcmFnZVJhdGluZ1wiLCAxXSB9LCAxLCAwXSB9IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc29sZS5sb2coYFske2hhbmRsZXJOYW1lfV0gRXhlY3V0aW5nIGFnZ3JlZ2F0aW9uIHBpcGVsaW5lIHdpdGggcGFyYW1zOmAsIHtcclxuICAgICAgZGVzdGluYXRpb25TbHVnLFxyXG4gICAgICBtaW5QcmljZSxcclxuICAgICAgbWF4UHJpY2UsXHJcbiAgICAgIG1pblJhdGluZyxcclxuICAgICAgZHVyYXRpb24sXHJcbiAgICAgIHNvcnRCeSxcclxuICAgICAgcGFnZTogcGFnZU51bSxcclxuICAgICAgbGltaXQ6IGxpbWl0TnVtXHJcbiAgICB9KTtcclxuICAgIGNvbnNvbGUubG9nKGBbJHtoYW5kbGVyTmFtZX1dIEFnZ3JlZ2F0aW9uIHBpcGVsaW5lIChzdGFnZXMpOmAsIEpTT04uc3RyaW5naWZ5KHBpcGVsaW5lLCBudWxsLCAyKSk7XHJcblxyXG4gICAgY29uc3QgW3Jlc3VsdHNdID0gYXdhaXQgVG91ci5hZ2dyZWdhdGUocGlwZWxpbmUpO1xyXG4gICAgXHJcbiAgICAvLyBIYXJkZW5lZCByZXN1bHQgaGFuZGxpbmc6IGd1YXJkIGFnYWluc3QgZW1wdHkgYWdncmVnYXRpb24gcmVzdWx0XHJcbiAgICBjb25zdCB0b3VycyA9IHJlc3VsdHM/LnBhZ2luYXRlZFJlc3VsdHMgfHwgW107XHJcbiAgICBjb25zdCB0b3RhbFRvdXJzID0gcmVzdWx0cz8ubWV0YWRhdGE/LlswXT8udG90YWwgfHwgMDtcclxuICAgIGNvbnN0IHJhdGluZ3NGYWNldCA9IHJlc3VsdHM/LmZpbHRlckNvdW50cz8uWzBdIHx8IHt9IGFzIGFueTtcclxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLmNlaWwodG90YWxUb3VycyAvIGxpbWl0TnVtKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgWyR7aGFuZGxlck5hbWV9XSBTZWFyY2ggY29tcGxldGVkLiBGb3VuZCAke3RvdGFsVG91cnN9IHRvdGFsIHRvdXJzLCByZXR1cm5pbmcgJHt0b3Vycy5sZW5ndGh9LmApO1xyXG5cclxuICAgIHJldHVybiBzZW5kKHJlcywgMjAwLCB7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICB0b3VycyxcclxuICAgICAgICBwYWdpbmF0aW9uOiB7XHJcbiAgICAgICAgICBjdXJyZW50UGFnZTogcGFnZU51bSxcclxuICAgICAgICAgIHRvdGFsUGFnZXMsXHJcbiAgICAgICAgICB0b3RhbFRvdXJzLFxyXG4gICAgICAgICAgaGFzTmV4dFBhZ2U6IHBhZ2VOdW0gPCB0b3RhbFBhZ2VzLFxyXG4gICAgICAgICAgaGFzUHJldlBhZ2U6IHBhZ2VOdW0gPiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmaWx0ZXJDb3VudHM6IHtcclxuICAgICAgICAgIHJhdGluZ3M6IHtcclxuICAgICAgICAgICAgXCI1XCI6IHJhdGluZ3NGYWNldD8ucmF0aW5nXzUgfHwgMCxcclxuICAgICAgICAgICAgXCI0XCI6IHJhdGluZ3NGYWNldD8ucmF0aW5nXzQgfHwgMCxcclxuICAgICAgICAgICAgXCIzXCI6IHJhdGluZ3NGYWNldD8ucmF0aW5nXzMgfHwgMCxcclxuICAgICAgICAgICAgXCIyXCI6IHJhdGluZ3NGYWNldD8ucmF0aW5nXzIgfHwgMCxcclxuICAgICAgICAgICAgXCIxXCI6IHJhdGluZ3NGYWNldD8ucmF0aW5nXzEgfHwgMFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZmlsdGVyczoge1xyXG4gICAgICAgICAgYXBwbGllZDoge1xyXG4gICAgICAgICAgICBkZXN0aW5hdGlvblNsdWcsXHJcbiAgICAgICAgICAgIG1pblByaWNlOiBtaW5QcmljZSA/IHBhcnNlSW50KG1pblByaWNlLCAxMCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIG1heFByaWNlOiBtYXhQcmljZSA/IHBhcnNlSW50KG1heFByaWNlLCAxMCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIG1pblJhdGluZzogbWluUmF0aW5nID8gcGFyc2VGbG9hdChtaW5SYXRpbmcpIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24gPyBkdXJhdGlvbi5zcGxpdCgnLCcpIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzb3J0QnlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGBbRVJST1IgaW4gJHtoYW5kbGVyTmFtZX1dYCwgZXJyb3IpO1xyXG4gICAgY29uc29sZS5lcnJvcihgW0VSUk9SIGluICR7aGFuZGxlck5hbWV9XSBTdGFjayB0cmFjZTpgLCBlcnJvci5zdGFjayk7XHJcbiAgICByZXR1cm4gc2VuZChyZXMsIDUwMCwgeyBcclxuICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICBlcnJvcjogYFNlcnZlciBFcnJvcjogJHtlcnJvci5tZXNzYWdlfWAgXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhhbmRsZXI7XHJcblxyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXGxpYlxcXFxhcGlcXFxcdG91ckhhbmRsZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3QvdmlldC1hZHZlbnR1cmUtY29ubmVjdC9zcmMvbGliL2FwaS90b3VySGFuZGxlci50c1wiO2ltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gJ2h0dHAnO1xyXG5pbXBvcnQgZGJDb25uZWN0IGZyb20gJy4uL2RiQ29ubmVjdCc7XHJcbmltcG9ydCBUb3VyIGZyb20gJy4uLy4uL21vZGVscy9Ub3VyJztcclxuaW1wb3J0IFJldmlldyBmcm9tICcuLi8uLi9tb2RlbHMvUmV2aWV3JztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHZXRUb3VyQnlJZChcclxuICByZXE6IEluY29taW5nTWVzc2FnZSxcclxuICByZXM6IFNlcnZlclJlc3BvbnNlLFxyXG4gIGlkOiBzdHJpbmdcclxuKSB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xyXG5cclxuICAgIGNvbnN0IHRvdXIgPSBhd2FpdCBUb3VyLmZpbmRCeUlkKGlkKVxyXG4gICAgICAucG9wdWxhdGUoeyBwYXRoOiAnZGVzdGluYXRpb24nLCBzZWxlY3Q6ICduYW1lIHNsdWcnIH0pXHJcbiAgICAgIC5wb3B1bGF0ZSh7IHBhdGg6ICdvd25lcicsIHNlbGVjdDogJ25hbWUgYXZhdGFyJyB9KVxyXG4gICAgICAubGVhbigpO1xyXG5cclxuICAgIGlmICghdG91cikge1xyXG4gICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDtcclxuICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdUb3VyIG5vdCBmb3VuZC4nIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXZpZXdzID0gYXdhaXQgUmV2aWV3LmZpbmQoeyB0b3VyOiB0b3VyLl9pZCwgc3RhdHVzOiAnYXBwcm92ZWQnIH0pXHJcbiAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxyXG4gICAgICAubGltaXQoNSlcclxuICAgICAgLnBvcHVsYXRlKHsgcGF0aDogJ3VzZXInLCBzZWxlY3Q6ICduYW1lIGF2YXRhcicgfSlcclxuICAgICAgLmxlYW4oKTtcclxuXHJcbiAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcclxuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHRvdXI6IHsgLi4udG91ciwgX2lkOiBTdHJpbmcodG91ci5faWQpIH0sXHJcbiAgICAgICAgcmV2aWV3czogcmV2aWV3cy5tYXAoKHI6IGFueSkgPT4gKHsgLi4uciwgX2lkOiBTdHJpbmcoci5faWQpIH0pKSxcclxuICAgICAgfSxcclxuICAgIH0pKTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAvLyBIYW5kbGUgaW52YWxpZCBPYmplY3RJZCBhbmQgb3RoZXIgZXJyb3JzIHVuaWZvcm1seVxyXG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yPy5tZXNzYWdlIHx8ICdTZXJ2ZXIgRXJyb3InO1xyXG4gICAgY29uc3QgaXNDYXN0RXJyb3IgPSAvQ2FzdCB0byBPYmplY3RJZCBmYWlsZWQvLnRlc3QobWVzc2FnZSk7XHJcbiAgICByZXMuc3RhdHVzQ29kZSA9IGlzQ2FzdEVycm9yID8gNDAwIDogNTAwO1xyXG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGlzQ2FzdEVycm9yID8gJ0ludmFsaWQgdG91ciBpZC4nIDogYFNlcnZlciBFcnJvcjogJHttZXNzYWdlfWAgfSkpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFx1dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFx1dGlsc1xcXFxmb3JtYXQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3QvdmlldC1hZHZlbnR1cmUtY29ubmVjdC9zcmMvdXRpbHMvZm9ybWF0LnRzXCI7aW1wb3J0IHsgZm9ybWF0IH0gZnJvbSAnZGF0ZS1mbnMnO1xyXG5pbXBvcnQgeyB2aSB9IGZyb20gJ2RhdGUtZm5zL2xvY2FsZSc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlOiBzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgbnVsbCB8IHVuZGVmaW5lZCwgcGF0dGVybiA9IFwiZCAndGhcdTAwRTFuZycgTSwgeXl5eVwiKSB7XHJcbiAgaWYgKCFkYXRlKSByZXR1cm4gJyc7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGQgPSB0eXBlb2YgZGF0ZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIGRhdGUgPT09ICdudW1iZXInID8gbmV3IERhdGUoZGF0ZSkgOiBkYXRlO1xyXG4gICAgcmV0dXJuIGZvcm1hdChkIGFzIERhdGUsIHBhdHRlcm4sIHsgbG9jYWxlOiB2aSB9KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiAnJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDdXJyZW5jeVZORChhbW91bnQ6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuICByZXR1cm4gbmV3IEludGwuTnVtYmVyRm9ybWF0KCd2aS1WTicsIHsgc3R5bGU6ICdjdXJyZW5jeScsIGN1cnJlbmN5OiAnVk5EJyB9KS5mb3JtYXQoYW1vdW50IHx8IDApO1xyXG59XHJcblxyXG5cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcc3JjXFxcXGxpYlxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGFwaVxcXFxqb3VybmV5c0hhbmRsZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3QvdmlldC1hZHZlbnR1cmUtY29ubmVjdC9zcmMvbGliL2FwaS9qb3VybmV5c0hhbmRsZXIudHNcIjtpbXBvcnQgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlR2V0VXNlckpvdXJuZXlzKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIER5bmFtaWMgaW1wb3J0cyB0byBhdm9pZCBwYXRoIHJlc29sdXRpb24gaXNzdWVzIHdoZW4gaW1wb3J0ZWQgYnkgdml0ZS5jb25maWcudHNcclxuICAgIGNvbnN0IGRiQ29ubmVjdCA9IChhd2FpdCBpbXBvcnQoJy4uL2RiQ29ubmVjdCcpKS5kZWZhdWx0O1xyXG4gICAgY29uc3QgQm9va2luZyA9IChhd2FpdCBpbXBvcnQoJy4uLy4uL21vZGVscy9Cb29raW5nJykpLmRlZmF1bHQ7XHJcbiAgICBjb25zdCB7IGZvcm1hdERhdGUgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vdXRpbHMvZm9ybWF0Jyk7XHJcbiAgICBcclxuICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xyXG4gICAgXHJcbiAgICAvLyAxLiBBdXRoZW50aWNhdGUgdXNlciBmcm9tIGNvb2tpZXNcclxuICAgIGNvbnN0IHsgcGFyc2UgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XHJcbiAgICBjb25zdCB7IHZlcmlmeUp3dCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hdXRoL2p3dCcpO1xyXG4gICAgXHJcbiAgICBjb25zdCBjb29raWVzID0gcGFyc2UocmVxLmhlYWRlcnMuY29va2llIHx8ICcnKTtcclxuICAgIGNvbnN0IHRva2VuID0gY29va2llc1snYXV0aF90b2tlbiddO1xyXG4gICAgXHJcbiAgICBpZiAoIXRva2VuKSB7XHJcbiAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAxO1xyXG4gICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkLicgfSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zdCBwYXlsb2FkID0gdmVyaWZ5Snd0KHRva2VuKTtcclxuICAgIGlmICghcGF5bG9hZCkge1xyXG4gICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMTtcclxuICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIG9yIGV4cGlyZWQgdG9rZW4uJyB9KSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHsgdXNlcklkIH0gPSBwYXlsb2FkO1xyXG5cclxuICAgIC8vIDIuIEZldGNoIHVzZXIncyBjb21wbGV0ZWQgYm9va2luZ3Mgd2l0aCB0b3VyIGluZm9ybWF0aW9uIGluIGEgc2luZ2xlIG9wdGltaXplZCBxdWVyeVxyXG4gICAgY29uc3QgdXNlckJvb2tpbmdzID0gYXdhaXQgQm9va2luZy5maW5kKHsgXHJcbiAgICAgIHVzZXI6IHVzZXJJZCwgXHJcbiAgICAgIHN0YXR1czogJ2NvbmZpcm1lZCcgLy8gVXNpbmcgJ2NvbmZpcm1lZCcgYXMgY29tcGxldGVkIHN0YXR1cyBzaW5jZSB0aGUgbW9kZWwgZG9lc24ndCBoYXZlICdjb21wbGV0ZWQnXHJcbiAgICB9KVxyXG4gICAgLnNvcnQoeyBib29raW5nRGF0ZTogLTEgfSkgLy8gU2hvdyB0aGUgbW9zdCByZWNlbnQgam91cm5leXMgZmlyc3RcclxuICAgIC5wb3B1bGF0ZSh7XHJcbiAgICAgIHBhdGg6ICd0b3VyJyxcclxuICAgICAgc2VsZWN0OiAndGl0bGUgZHVyYXRpb24nIC8vIE9ubHkgc2VsZWN0IHRoZSBmaWVsZHMgd2UgYWJzb2x1dGVseSBuZWVkXHJcbiAgICB9KVxyXG4gICAgLmxlYW4oKTsgLy8gVXNlIGxlYW4oKSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlIHNpbmNlIHdlIGRvbid0IG5lZWQgTW9uZ29vc2UgZG9jdW1lbnRzXHJcblxyXG4gICAgLy8gMy4gVHJhbnNmb3JtIHRoZSBkYXRhIGludG8gdGhlIGNsZWFuIGZvcm1hdCB0aGUgZnJvbnRlbmQgbmVlZHNcclxuICAgIGNvbnN0IGpvdXJuZXlzID0gdXNlckJvb2tpbmdzLm1hcChib29raW5nID0+ICh7XHJcbiAgICAgIGlkOiBib29raW5nLl9pZC50b1N0cmluZygpLFxyXG4gICAgICB0aXRsZTogYm9va2luZy50b3VyPy50aXRsZSB8fCBib29raW5nLnRvdXJJbmZvPy50aXRsZSB8fCAnVG91ciBraFx1MDBGNG5nIHhcdTAwRTFjIFx1MDExMVx1MUVDQm5oJyxcclxuICAgICAgZGF0ZVJhbmdlOiBmb3JtYXREYXRlKGJvb2tpbmcuYm9va2luZ0RhdGUsIFwiZGQvTU0veXl5eVwiKSxcclxuICAgICAgc3RhdHVzOiAnXHUwMTEwXHUwMEUzIGhvXHUwMEUwbiB0aFx1MDBFMG5oJyxcclxuICAgICAgcGFydGljaXBhbnRzOiBib29raW5nLnBhcnRpY2lwYW50cyxcclxuICAgICAgdG90YWxQcmljZTogYm9va2luZy50b3RhbFByaWNlXHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gNC4gU2VuZCBzdWNjZXNzZnVsIHJlc3BvbnNlXHJcbiAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcclxuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsIFxyXG4gICAgICBkYXRhOiBqb3VybmV5cyBcclxuICAgIH0pKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tBUEkgSGFuZGxlciBFcnJvcl0gR0VUIC9hcGkvdXNlcnMvam91cm5leXM6JywgZXJyb3IpO1xyXG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnU2VydmVyIGVycm9yJztcclxuICAgIFxyXG4gICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxyXG4gICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgIGVycm9yOiBgU2VydmVyIEVycm9yOiAke2Vycm9yTWVzc2FnZX1gIFxyXG4gICAgfSkpO1xyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvdml0ZS5jb25maWcudHNcIjsvLyB2aXRlLmNvbmZpZy50cyAoVGhlIEZpbmFsLCBDb3JyZWN0LCBhbmQgUmVmYWN0b3JlZCBWZXJzaW9uKVxuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIHR5cGUgVml0ZURldlNlcnZlciB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgeyBoYW5kbGVDcmVhdGVCb29raW5nIH0gZnJvbSAnLi9zcmMvbGliL2FwaS9ib29raW5nSGFuZGxlcic7XG5cbi8vIEltcG9ydCBNb25nb29zZSBtb2RlbHMgYW5kIHRoZSBEQiBjb25uZWN0aW9uIHV0aWxpdHlcbmltcG9ydCBEZXN0aW5hdGlvbiBmcm9tICcuL3NyYy9tb2RlbHMvRGVzdGluYXRpb24nO1xuaW1wb3J0IFRvdXIgZnJvbSAnLi9zcmMvbW9kZWxzL1RvdXInO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9zcmMvbW9kZWxzL1VzZXInO1xuaW1wb3J0IGRiQ29ubmVjdCBmcm9tICcuL3NyYy9saWIvZGJDb25uZWN0JztcblxuLy8gLS0tIERhdGEgRGVmaW5pdGlvbnMgKEtlcHQgc2VwYXJhdGUgZm9yIGNsYXJpdHkpIC0tLVxuY29uc3QgaGFMb25nQmF5RGF0YSA9IHsgXG4gIG5hbWU6ICdWXHUxRUNCbmggSFx1MUVBMSBMb25nJywgXG4gIHNsdWc6ICdoYS1sb25nLWJheScsIFxuICBkZXNjcmlwdGlvbjogJ1ZcdTFFQ0JuaCBIXHUxRUExIExvbmcgLSBtXHUxRUQ5dCB0cm9uZyBiXHUxRUEzeSBrXHUxRUYzIHF1YW4gdGhpXHUwMEVBbiBuaGlcdTAwRUFuIG1cdTFFREJpIGNcdTFFRTdhIHRoXHUxRUJGIGdpXHUxRURCaS4uLicsIFxuICBoaXN0b3J5OiAnLi4uJywgXG4gIGN1bHR1cmU6ICcuLi4nLCBcbiAgZ2VvZ3JhcGh5OiAnLi4uJywgXG4gIG1haW5JbWFnZTogJ2h0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNTkwMjM3NzM5ODE0LWEwODlmNjQ4MzY1NicsIFxuICBpbWFnZUdhbGxlcnk6IFsnLi4uJ10sIFxuICBiZXN0VGltZVRvVmlzaXQ6ICcuLi4nLCBcbiAgZXNzZW50aWFsVGlwczogWycuLi4nXSxcbiAgc3RhdHVzOiAncHVibGlzaGVkJ1xufTtcbmNvbnN0IHRvdXJzRm9ySGFMb25nID0gW3sgdGl0bGU6ICdEdSB0aHV5XHUxRUMxbiAyIG5nXHUwMEUweSAxIFx1MDExMVx1MDBFQW0uLi4nLCBwcmljZTogMjUwMDAwMCwgZHVyYXRpb246ICcyIG5nXHUwMEUweSAxIFx1MDExMVx1MDBFQW0nLCBtYXhHcm91cFNpemU6IDIwLCBkZXNjcmlwdGlvbjogJy4uLicsIGl0aW5lcmFyeTogW10sIGluY2x1c2lvbnM6IFtdLCBleGNsdXNpb25zOiBbXSwgaXNTdXN0YWluYWJsZTogdHJ1ZSB9LCB7IHRpdGxlOiAnVG91ciB0cm9uZyBuZ1x1MDBFMHkuLi4nLCBwcmljZTogODUwMDAwLCBkdXJhdGlvbjogJzEgbmdcdTAwRTB5JywgbWF4R3JvdXBTaXplOiA0MCwgZGVzY3JpcHRpb246ICcuLi4nLCBpdGluZXJhcnk6IFtdLCBpbmNsdXNpb25zOiBbXSwgZXhjbHVzaW9uczogW10gfV07XG5cbi8qKlxuICogQSBzZWxmLWNvbnRhaW5lZCBmdW5jdGlvbiB0byBoYW5kbGUgdGhlIGVudGlyZSBkYXRhYmFzZSBzZWVkaW5nIHByb2Nlc3MuXG4gKiBUaGlzIGltcHJvdmVzIHJlYWRhYmlsaXR5IGFuZCBzZXBhcmF0ZXMgY29uY2VybnMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNlZWREYXRhYmFzZSgpIHtcbiAgY29uc29sZS5sb2coJ1tTRUVERVJdIENvbm5lY3RpbmcgdG8gZGF0YWJhc2UuLi4nKTtcbiAgYXdhaXQgZGJDb25uZWN0KCk7XG4gIFxuICBjb25zb2xlLmxvZygnW1NFRURFUl0gQ2xlYW5pbmcgb2xkIGRhdGEgdG8gZW5zdXJlIGlkZW1wb3RlbmN5Li4uJyk7XG4gIGNvbnN0IG9sZERlc3RpbmF0aW9uID0gYXdhaXQgRGVzdGluYXRpb24uZmluZE9uZSh7IHNsdWc6ICdoYS1sb25nLWJheScgfSk7XG4gIGlmIChvbGREZXN0aW5hdGlvbikge1xuICAgIGF3YWl0IFRvdXIuZGVsZXRlTWFueSh7IGRlc3RpbmF0aW9uOiBvbGREZXN0aW5hdGlvbi5faWQgfSk7XG4gICAgYXdhaXQgRGVzdGluYXRpb24uZGVsZXRlT25lKHsgX2lkOiBvbGREZXN0aW5hdGlvbi5faWQgfSk7XG4gIH1cblxuICBjb25zb2xlLmxvZygnW1NFRURFUl0gQ3JlYXRpbmcgbmV3IGRhdGEuLi4nKTtcbiAgY29uc3QgY3JlYXRlZERlc3RpbmF0aW9uID0gYXdhaXQgRGVzdGluYXRpb24uY3JlYXRlKHtcbiAgICAuLi5oYUxvbmdCYXlEYXRhLFxuICAgIHN0YXR1czogJ3B1Ymxpc2hlZCcgLy8gU2V0IHN0YXR1cyB0byBwdWJsaXNoZWQgc28gaXQncyBzZWFyY2hhYmxlXG4gIH0pO1xuICAvLyBFbnN1cmUgdGhlcmUgaXMgYW4gb3duZXIgKHByZWZlciBhIHBhcnRuZXIsIGZhbGxiYWNrIHRvIGFkbWluKVxuICBsZXQgb3duZXJVc2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgcm9sZTogJ3BhcnRuZXInIH0pO1xuICBpZiAoIW93bmVyVXNlcikge1xuICAgIG93bmVyVXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IHJvbGU6ICdhZG1pbicgfSk7XG4gICAgaWYgKCFvd25lclVzZXIpIHtcbiAgICAgIG93bmVyVXNlciA9IGF3YWl0IFVzZXIuY3JlYXRlKHsgbmFtZTogJ1NlZWQgQWRtaW4nLCBlbWFpbDogJ3NlZWQtYWRtaW5AZXhhbXBsZS5jb20nLCBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsIHJvbGU6ICdhZG1pbicgfSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHRvdXJzV2l0aERlc3RpbmF0aW9uSWQgPSB0b3Vyc0ZvckhhTG9uZy5tYXAodG91ciA9PiAoeyAuLi50b3VyLCBkZXN0aW5hdGlvbjogY3JlYXRlZERlc3RpbmF0aW9uLl9pZCwgb3duZXI6IG93bmVyVXNlciEuX2lkIH0pKTtcbiAgYXdhaXQgVG91ci5pbnNlcnRNYW55KHRvdXJzV2l0aERlc3RpbmF0aW9uSWQpO1xuICBjb25zb2xlLmxvZygnW1NFRURFUl0gU2VlZGluZyBjb21wbGV0ZSEnKTtcblxuICAvLyBWZXJpZmljYXRpb24gbG9nc1xuICBjb25zdCBzYW1wbGVUb3VycyA9IGF3YWl0IFRvdXIuZmluZCgpLmxpbWl0KDUpLmxlYW4oKTtcbiAgY29uc3Qgc2FtcGxlRGVzdGluYXRpb25zID0gYXdhaXQgRGVzdGluYXRpb24uZmluZCgpLmxpbWl0KDUpLmxlYW4oKTtcbiAgY29uc29sZS5sb2coJy0tLSBEQVRBQkFTRSBWRVJJRklDQVRJT04gKFZpdGUgU2VlZGVyKSAtLS0nKTtcbiAgY29uc29sZS5sb2coJ1NhbXBsZSBUb3VycyBmcm9tIERCOicsIEpTT04uc3RyaW5naWZ5KHNhbXBsZVRvdXJzLCBudWxsLCAyKSk7XG4gIGNvbnNvbGUubG9nKCdTYW1wbGUgRGVzdGluYXRpb25zIGZyb20gREI6JywgSlNPTi5zdHJpbmdpZnkoc2FtcGxlRGVzdGluYXRpb25zLCBudWxsLCAyKSk7XG59XG5cbi8qKlxuICogQSBjdXN0b20gVml0ZSBwbHVnaW4gdG8gY3JlYXRlIGEgZGV2LW9ubHkgQVBJIGVuZHBvaW50IGZvciBzZWVkaW5nLlxuICogVGhpcyBpcyB0aGUgc3RhbmRhcmQgd2F5IHRvIGFkZCBzZXJ2ZXIgbWlkZGxld2FyZSBpbiBWaXRlLlxuICovXG5mdW5jdGlvbiBzZWVkQXBpUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2aXRlLXBsdWdpbi1zZWVkLWVuZHBvaW50JyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyAtLS0gUHVibGljIEJvb2tpbmdzIEFQSSAoY3JlYXRlIGJvb2tpbmcpIC0tLVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLm9yaWdpbmFsVXJsIHx8IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gICAgICAgIGlmIChtZXRob2QgPT09ICdQT1NUJyAmJiB1cmwuc3RhcnRzV2l0aCgnL2FwaS9ib29raW5ncycpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBUEkgUk9VVEVSXSBIYW5kbGluZyBQT1NUIC9hcGkvYm9va2luZ3MnKTtcbiAgICAgICAgICByZXR1cm4gaGFuZGxlQ3JlYXRlQm9va2luZyhyZXEsIHJlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH0pO1xuICAgICAgLy8gLS0tIEFkbWluIFVzZXIgTWFuYWdlbWVudCBBUElzIC0tLVxuICAgICAgLy8gLS0tIEJvb2tpbmcgQWRtaW4gQVBJcyAoYWRtaW4sIHN0YWZmKSAtLS1cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYm9va2luZ3MnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgaWYgKCF0b2tlbikgeyByZXMuc3RhdHVzQ29kZSA9IDQwMTsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidVbmF1dGhvcml6ZWQnfSkpOyB9XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJpZnlKd3QodG9rZW4pO1xuICAgICAgICBpZiAoIXBheWxvYWQgfHwgIVsnYWRtaW4nLCdzdGFmZiddLmluY2x1ZGVzKHBheWxvYWQucm9sZSkpIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBHRVQgbGlzdCB3aXRoIGZpbHRlcnMsIHNlYXJjaCwgcGFnaW5hdGlvblxuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdHRVQnICYmIHVybCA9PT0gJy9hcGkvYWRtaW4vYm9va2luZ3MnKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJvb2tpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jvb2tpbmcnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogVXNlciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvVXNlcicpO1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBUb3VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Ub3VyJyk7XG4gICAgICAgICAgICBjb25zdCB1ID0gbmV3IFVSTCh1cmwsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgICAvLyBOb3RlOiB2aXRlJ3Mgc2VydmVyIGdpdmVzIG9ubHkgcGF0aCwgc28gZmFsbCBiYWNrIHRvIHJlcS5vcmlnaW5hbFVybCBpZiBwcmVzZW50XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdHRVQnICYmIHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL2Jvb2tpbmdzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQm9va2luZyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQm9va2luZycpO1xuICAgICAgICAgICAgY29uc3QgZnVsbFVybCA9IG5ldyBVUkwocmVxLm9yaWdpbmFsVXJsIHx8IHVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2UgPSBOdW1iZXIoZnVsbFVybC5zZWFyY2hQYXJhbXMuZ2V0KCdwYWdlJykgfHwgJzEnKTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oMTAwLCBOdW1iZXIoZnVsbFVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsaW1pdCcpIHx8ICcyMCcpKTtcbiAgICAgICAgICAgIGNvbnN0IHEgPSAoZnVsbFVybC5zZWFyY2hQYXJhbXMuZ2V0KCdxJykgfHwgJycpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1c1N0ciA9IGZ1bGxVcmwuc2VhcmNoUGFyYW1zLmdldCgnc3RhdHVzJykgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBvd25lcklkID0gZnVsbFVybC5zZWFyY2hQYXJhbXMuZ2V0KCdvd25lcklkJykgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBkYXRlRnJvbSA9IGZ1bGxVcmwuc2VhcmNoUGFyYW1zLmdldCgnZnJvbScpO1xuICAgICAgICAgICAgY29uc3QgZGF0ZVRvID0gZnVsbFVybC5zZWFyY2hQYXJhbXMuZ2V0KCd0bycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCdWlsZCB0aGUgJG1hdGNoIHN0YWdlIERZTkFNSUNBTExZIGFuZCBzZWN1cmVseVxuICAgICAgICAgICAgY29uc3QgbWF0Y2hTdGFnZTogYW55ID0ge307XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE9ubHkgYWRkIHRoZSAnc3RhdHVzJyBmaWVsZCB0byB0aGUgbWF0Y2ggaWYgYSBzcGVjaWZpYyBzdGF0dXMgaXMgcmVxdWVzdGVkXG4gICAgICAgICAgICBpZiAoc3RhdHVzU3RyICYmIHR5cGVvZiBzdGF0dXNTdHIgPT09ICdzdHJpbmcnICYmIHN0YXR1c1N0ciAhPT0gJ2FsbCcpIHtcbiAgICAgICAgICAgICAgLy8gQWRkIGEgd2hpdGVsaXN0IGNoZWNrIGZvciBleHRyYSBzZWN1cml0eVxuICAgICAgICAgICAgICBjb25zdCBhbGxvd2VkU3RhdHVzZXMgPSBbJ3BlbmRpbmcnLCAnY29uZmlybWVkJywgJ2NvbXBsZXRlZCcsICdjYW5jZWxsZWQnLCAncmVmdW5kZWQnXTtcbiAgICAgICAgICAgICAgaWYgKGFsbG93ZWRTdGF0dXNlcy5pbmNsdWRlcyhzdGF0dXNTdHIpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hTdGFnZS5zdGF0dXMgPSBzdGF0dXNTdHI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWRkIGRhdGUgZmlsdGVycyBpZiBwcm92aWRlZFxuICAgICAgICAgICAgaWYgKGRhdGVGcm9tIHx8IGRhdGVUbykge1xuICAgICAgICAgICAgICBtYXRjaFN0YWdlLmJvb2tpbmdEYXRlID0ge307XG4gICAgICAgICAgICAgIGlmIChkYXRlRnJvbSkgbWF0Y2hTdGFnZS5ib29raW5nRGF0ZS4kZ3RlID0gbmV3IERhdGUoZGF0ZUZyb20pO1xuICAgICAgICAgICAgICBpZiAoZGF0ZVRvKSBtYXRjaFN0YWdlLmJvb2tpbmdEYXRlLiRsdGUgPSBuZXcgRGF0ZShkYXRlVG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBZGQgb3duZXIgZmlsdGVyIGlmIHByb3ZpZGVkICh0aGlzIHdpbGwgYmUgaGFuZGxlZCBhZnRlciBsb29rdXApXG4gICAgICAgICAgICBpZiAob3duZXJJZCkge1xuICAgICAgICAgICAgICBtYXRjaFN0YWdlWyd0b3VyLm93bmVyJ10gPSBuZXcgKGF3YWl0IGltcG9ydCgnbW9uZ29vc2UnKSkuZGVmYXVsdC5UeXBlcy5PYmplY3RJZChvd25lcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtCT09LSU5HUyBBUEldIE1hdGNoIHN0YWdlOmAsIEpTT04uc3RyaW5naWZ5KG1hdGNoU3RhZ2UsIG51bGwsIDIpKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQk9PS0lOR1MgQVBJXSBRdWVyeSBwYXJhbXM6IHN0YXR1cz0ke3N0YXR1c1N0cn0sIHNlYXJjaD0ke3F9LCBvd25lcklkPSR7b3duZXJJZH0sIHBhZ2U9JHtwYWdlfSwgbGltaXQ9JHtsaW1pdH1gKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgcGlwZWxpbmU6IGFueVtdID0gW1xuICAgICAgICAgICAgICAvLyBGaXJzdCBzdGFnZTogQXBwbHkgZmlsdGVycyB0byB0aGUgbWFpbiBib29raW5nIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgeyAkbWF0Y2g6IG1hdGNoU3RhZ2UgfSxcbiAgICAgICAgICAgICAgeyAkc29ydDogeyBjcmVhdGVkQXQ6IC0xIH0gfSxcbiAgICAgICAgICAgICAgLy8gTG9va3VwIHJlbGF0ZWQgZGF0YVxuICAgICAgICAgICAgICB7ICRsb29rdXA6IHsgZnJvbTogJ3VzZXJzJywgbG9jYWxGaWVsZDogJ3VzZXInLCBmb3JlaWduRmllbGQ6ICdfaWQnLCBhczogJ3VzZXInIH0gfSxcbiAgICAgICAgICAgICAgeyAkdW53aW5kOiB7IHBhdGg6ICckdXNlcicsIHByZXNlcnZlTnVsbEFuZEVtcHR5QXJyYXlzOiB0cnVlIH0gfSxcbiAgICAgICAgICAgICAgeyAkbG9va3VwOiB7IGZyb206ICd0b3VycycsIGxvY2FsRmllbGQ6ICd0b3VyJywgZm9yZWlnbkZpZWxkOiAnX2lkJywgYXM6ICd0b3VyJyB9IH0sXG4gICAgICAgICAgICAgIHsgJHVud2luZDogeyBwYXRoOiAnJHRvdXInLCBwcmVzZXJ2ZU51bGxBbmRFbXB0eUFycmF5czogdHJ1ZSB9IH0sXG4gICAgICAgICAgICAgIHsgJGxvb2t1cDogeyBmcm9tOiAndXNlcnMnLCBsb2NhbEZpZWxkOiAndG91ci5vd25lcicsIGZvcmVpZ25GaWVsZDogJ19pZCcsIGFzOiAnb3duZXInIH0gfSxcbiAgICAgICAgICAgICAgeyAkdW53aW5kOiB7IHBhdGg6ICckb3duZXInLCBwcmVzZXJ2ZU51bGxBbmRFbXB0eUFycmF5czogdHJ1ZSB9IH0sXG4gICAgICAgICAgICAgIC8vIEFwcGx5IHNlYXJjaCBmaWx0ZXIgYWZ0ZXIgbG9va3VwcyAoaWYgc2VhcmNoIHF1ZXJ5IHByb3ZpZGVkKVxuICAgICAgICAgICAgICAuLi4ocSA/IFt7XG4gICAgICAgICAgICAgICAgJG1hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBfaWQ6IHsgJHJlZ2V4OiBxLCAkb3B0aW9uczogJ2knIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgeyAndG91ci50aXRsZSc6IHsgJHJlZ2V4OiBxLCAkb3B0aW9uczogJ2knIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgeyAndXNlci5uYW1lJzogeyAkcmVnZXg6IHEsICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7ICd1c2VyLmVtYWlsJzogeyAkcmVnZXg6IHEsICRvcHRpb25zOiAnaScgfSB9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XSA6IFtdKSxcbiAgICAgICAgICAgICAgLy8gUGFnaW5hdGlvblxuICAgICAgICAgICAgICB7ICRza2lwOiAocGFnZSAtIDEpICogbGltaXQgfSxcbiAgICAgICAgICAgICAgeyAkbGltaXQ6IGxpbWl0IH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IFtyb3dzLCB0b3RhbEFycl0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgIChhd2FpdCBpbXBvcnQoJ21vbmdvb3NlJykpLmRlZmF1bHQuY29ubmVjdGlvbi5jb2xsZWN0aW9uKCdib29raW5ncycpLmFnZ3JlZ2F0ZShwaXBlbGluZSkudG9BcnJheSgpLFxuICAgICAgICAgICAgICAvLyBDb3VudCB0b3RhbCBkb2N1bWVudHMgd2l0aCB0aGUgc2FtZSBmaWx0ZXJzIChleGNsdWRpbmcgc2VhcmNoIGFuZCBwYWdpbmF0aW9uKVxuICAgICAgICAgICAgICAoYXdhaXQgaW1wb3J0KCdtb25nb29zZScpKS5kZWZhdWx0LmNvbm5lY3Rpb24uY29sbGVjdGlvbignYm9va2luZ3MnKS5jb3VudERvY3VtZW50cyhtYXRjaFN0YWdlKSxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiByb3dzLCB0b3RhbDogdG90YWxBcnIgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBHRVQgc2luZ2xlIGJvb2tpbmcgYnkgaWQgd2l0aCBkZWVwIHBvcHVsYXRlXG4gICAgICAgICAgY29uc3Qgc2luZ2xlTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2Jvb2tpbmdzXFwvKFteL10rKSQvKTtcbiAgICAgICAgICBpZiAobWV0aG9kID09PSAnR0VUJyAmJiBzaW5nbGVNYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBCb29raW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Cb29raW5nJyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHNpbmdsZU1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgQm9va2luZy5maW5kQnlJZChpZClcbiAgICAgICAgICAgICAgLnBvcHVsYXRlKCd1c2VyJywgJ25hbWUgZW1haWwgYXZhdGFyJylcbiAgICAgICAgICAgICAgLnBvcHVsYXRlKHsgcGF0aDogJ3RvdXInLCBzZWxlY3Q6ICd0aXRsZSBvd25lciBtYWluSW1hZ2UnLCBwb3B1bGF0ZTogeyBwYXRoOiAnb3duZXInLCBzZWxlY3Q6ICduYW1lIGVtYWlsJyB9IH0pXG4gICAgICAgICAgICAgIC5sZWFuKCk7XG4gICAgICAgICAgICBpZiAoIWRvYykgeyByZXMuc3RhdHVzQ29kZT00MDQ7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonTm90IGZvdW5kJyB9KSk7IH1cbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogZG9jIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUFVUIHN0YXR1cyB1cGRhdGUgKyBoaXN0b3J5XG4gICAgICAgICAgY29uc3Qgc3RhdHVzTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2Jvb2tpbmdzXFwvKFteL10rKVxcL3N0YXR1cyQvKTtcbiAgICAgICAgICBpZiAobWV0aG9kID09PSAnUFVUJyAmJiBzdGF0dXNNYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBCb29raW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Cb29raW5nJyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHN0YXR1c01hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHsgc3RhdHVzLCBub3RlIH0gPSBib2R5IHx8IHt9O1xuICAgICAgICAgICAgaWYgKCFbJ3BlbmRpbmcnLCdjb25maXJtZWQnLCdjYW5jZWxsZWQnLCdyZWZ1bmRlZCcsJ2NvbXBsZXRlZCddLmluY2x1ZGVzKHN0YXR1cykpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ludmFsaWQgc3RhdHVzJ30pKTsgfVxuICAgICAgICAgICAgY29uc3QgdXBkYXRlOiBhbnkgPSB7IHN0YXR1cyB9O1xuICAgICAgICAgICAgY29uc3QgaGlzdG9yeUVudHJ5ID0geyBhdDogbmV3IERhdGUoKSwgYWN0aW9uOiBgU3RhdHVzIHVwZGF0ZWQgdG8gJyR7c3RhdHVzfSdgLCBieTogcGF5bG9hZC51c2VySWQgPyAoYXdhaXQgaW1wb3J0KCdtb25nb29zZScpKS5kZWZhdWx0LlR5cGVzLk9iamVjdElkLmNyZWF0ZUZyb21IZXhTdHJpbmcocGF5bG9hZC51c2VySWQpIDogdW5kZWZpbmVkLCBub3RlIH0gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jvb2tpbmcnKSkuZGVmYXVsdC5maW5kQnlJZEFuZFVwZGF0ZShpZCwgeyAkc2V0OiB1cGRhdGUsICRwdXNoOiB7IGhpc3Rvcnk6IGhpc3RvcnlFbnRyeSB9IH0sIHsgbmV3OiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBkb2MgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBQT1NUIHJlc2VuZCBjb25maXJtYXRpb24gKHN0dWIpXG4gICAgICAgICAgY29uc3QgcmVzZW5kTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2Jvb2tpbmdzXFwvKFteL10rKVxcL3Jlc2VuZC1jb25maXJtYXRpb24kLyk7XG4gICAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ1BPU1QnICYmIHJlc2VuZE1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHJlc2VuZE1hdGNoWzFdO1xuICAgICAgICAgICAgLy8gU2ltdWxhdGUgYXN5bmMgZW1haWwgc2VuZGluZ1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBtZXNzYWdlOiAnUmVzZW50IGNvbmZpcm1hdGlvbiBlbWFpbCcsIGlkIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTZXJ2ZXIgZXJyb3InIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyAtLS0gTWFya2V0aW5nIEFkbWluIEFQSXMgKGFkbWluIG9ubHkgZm9yIGNyZWF0ZS91cGRhdGUvZGVsZXRlLCBhZG1pbi9zdGFmZiBmb3IgcmVhZCkgLS0tXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8ICcnO1xuICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL2NvdXBvbnMnKSAmJiAhdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYmFubmVycycpICYmICF1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi9jb2xsZWN0aW9ucycpICYmICF1cmwuc3RhcnRzV2l0aCgnL2FwaS9ib29raW5ncy9hcHBseS1jb3Vwb24nKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRva2VuID8gdmVyaWZ5Snd0KHRva2VuKSA6IG51bGw7XG4gICAgICAgIGNvbnN0IGlzQWRtaW4gPSAhIXBheWxvYWQgJiYgcGF5bG9hZC5yb2xlID09PSAnYWRtaW4nO1xuICAgICAgICBjb25zdCBpc1N0YWZmID0gISFwYXlsb2FkICYmIFsnYWRtaW4nLCdzdGFmZiddLmluY2x1ZGVzKHBheWxvYWQucm9sZSk7XG4gICAgICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xuICAgICAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIENPVVBPTlMgQ1JVRFxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FkbWluL2NvdXBvbnMnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ291cG9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Db3Vwb24nKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBDb3Vwb24uZmluZCh7fSkuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSkubGVhbigpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiByb3dzIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vY291cG9ucycgJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ291cG9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Db3Vwb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgQ291cG9uLmNyZWF0ZShib2R5KTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMTsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogY3JlYXRlZCB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvdXBvbk1hdGNoID0gdXJsLm1hdGNoKC9eXFwvYXBpXFwvYWRtaW5cXC9jb3Vwb25zXFwvKFteL10rKSQvKTtcbiAgICAgICAgICBpZiAoY291cG9uTWF0Y2ggJiYgbWV0aG9kID09PSAnUFVUJykge1xuICAgICAgICAgICAgaWYgKCFpc0FkbWluKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nIH0pKTsgfVxuICAgICAgICAgICAgY29uc3QgaWQgPSBjb3Vwb25NYXRjaFsxXTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ291cG9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Db3Vwb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgQ291cG9uLmZpbmRCeUlkQW5kVXBkYXRlKGlkLCBib2R5LCB7IG5ldzogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogdXBkYXRlZCB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb3Vwb25NYXRjaCAmJiBtZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbicgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCBpZCA9IGNvdXBvbk1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBDb3Vwb24gfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0NvdXBvbicpO1xuICAgICAgICAgICAgYXdhaXQgQ291cG9uLmZpbmRCeUlkQW5kRGVsZXRlKGlkKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQkFOTkVSUyBDUlVEICsgcmVvcmRlclxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FkbWluL2Jhbm5lcnMnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQmFubmVyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9CYW5uZXInKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBCYW5uZXIuZmluZCh7fSkuc29ydCh7IGRpc3BsYXlPcmRlcjogMSB9KS5sZWFuKCk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHJvd3MgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsID09PSAnL2FwaS9hZG1pbi9iYW5uZXJzJyAmJiBtZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgaWYgKCFpc0FkbWluKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nIH0pKTsgfVxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBCYW5uZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jhbm5lcicpO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGRpc3BsYXlPcmRlciBmb3IgbmV3IGJhbm5lclxuICAgICAgICAgICAgY29uc3QgaGlnaGVzdE9yZGVyQmFubmVyID0gYXdhaXQgQmFubmVyLmZpbmRPbmUoe30pLnNvcnQoeyBkaXNwbGF5T3JkZXI6IC0xIH0pLmxlYW4oKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0Rpc3BsYXlPcmRlciA9IChoaWdoZXN0T3JkZXJCYW5uZXI/LmRpc3BsYXlPcmRlciB8fCAwKSArIDE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENyZWF0ZSBiYW5uZXIgd2l0aCBjYWxjdWxhdGVkIGRpc3BsYXlPcmRlclxuICAgICAgICAgICAgY29uc3QgYmFubmVyRGF0YSA9IHsgLi4uYm9keSwgZGlzcGxheU9yZGVyOiBuZXdEaXNwbGF5T3JkZXIgfTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCBCYW5uZXIuY3JlYXRlKGJhbm5lckRhdGEpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAxOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBjcmVhdGVkIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYmFubmVyTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2Jhbm5lcnNcXC8oW14vXSspJC8pO1xuICAgICAgICAgIGlmIChiYW5uZXJNYXRjaCAmJiBtZXRob2QgPT09ICdQVVQnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbicgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJhbm5lciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQmFubmVyJyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IGJhbm5lck1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBhd2FpdCBCYW5uZXIuZmluZEJ5SWRBbmRVcGRhdGUoaWQsIGJvZHksIHsgbmV3OiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB1cGRhdGVkIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGJhbm5lck1hdGNoICYmIG1ldGhvZCA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQmFubmVyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9CYW5uZXInKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gYmFubmVyTWF0Y2hbMV07XG4gICAgICAgICAgICBhd2FpdCBCYW5uZXIuZmluZEJ5SWRBbmREZWxldGUoaWQpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyByZW9yZGVyIGVuZHBvaW50XG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vYmFubmVycy9yZW9yZGVyJyAmJiBtZXRob2QgPT09ICdQVVQnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbicgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJhbm5lciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQmFubmVyJyk7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IGxldCBiPScnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMpOyByZXEub24oJ2VuZCcsKCk9PnsgdHJ5eyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7IH0gfSk7IHJlcS5vbignZXJyb3InLHJlamVjdCk7IH0pO1xuICAgICAgICAgICAgY29uc3QgeyBvcmRlciB9ID0gYm9keSB8fCB7IG9yZGVyOiBbXSB9O1xuICAgICAgICAgICAgLy8gb3JkZXIgaXMgYXJyYXkgb2YgeyBpZCwgZGlzcGxheU9yZGVyIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaXQgb2Ygb3JkZXIgfHwgW10pIHtcbiAgICAgICAgICAgICAgYXdhaXQgQmFubmVyLmZpbmRCeUlkQW5kVXBkYXRlKGl0LmlkLCB7IGRpc3BsYXlPcmRlcjogaXQuZGlzcGxheU9yZGVyIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDT0xMRUNUSU9OUyBDUlVEXG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vY29sbGVjdGlvbnMnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ29sbGVjdGlvbiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQ29sbGVjdGlvbicpO1xuICAgICAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IENvbGxlY3Rpb24uZmluZCh7fSkucG9wdWxhdGUoJ3RvdXJzJywndGl0bGUgbWFpbkltYWdlJykuc29ydCh7IGNyZWF0ZWRBdDogLTEgfSkubGVhbigpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiByb3dzIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vY29sbGVjdGlvbnMnICYmIG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbicgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IENvbGxlY3Rpb24gfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0NvbGxlY3Rpb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgQ29sbGVjdGlvbi5jcmVhdGUoYm9keSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDE7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IGNyZWF0ZWQgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2NvbGxlY3Rpb25zXFwvKFteL10rKSQvKTtcbiAgICAgICAgICBpZiAoY29sbGVjdGlvbk1hdGNoICYmIG1ldGhvZCA9PT0gJ1BVVCcpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ29sbGVjdGlvbiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQ29sbGVjdGlvbicpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBjb2xsZWN0aW9uTWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IGxldCBiPScnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMpOyByZXEub24oJ2VuZCcsKCk9PnsgdHJ5eyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7IH0gfSk7IHJlcS5vbignZXJyb3InLHJlamVjdCk7IH0pO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IENvbGxlY3Rpb24uZmluZEJ5SWRBbmRVcGRhdGUoaWQsIGJvZHksIHsgbmV3OiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB1cGRhdGVkIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvbGxlY3Rpb25NYXRjaCAmJiBtZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbicgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IENvbGxlY3Rpb24gfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0NvbGxlY3Rpb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY29sbGVjdGlvbk1hdGNoWzFdO1xuICAgICAgICAgICAgYXdhaXQgQ29sbGVjdGlvbi5maW5kQnlJZEFuZERlbGV0ZShpZCk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJFRkVSUkFMIFBST0dSQU0gU0VUVElOR1MgZW5kcG9pbnRzXG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vc2V0dGluZ3MvcmVmZXJyYWwnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogU2V0dGluZ3MgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1NldHRpbmdzJyk7XG4gICAgICAgICAgICBsZXQgc2V0dGluZ3MgPSBhd2FpdCBTZXR0aW5ncy5maW5kT25lKHt9KS5sZWFuKCk7XG4gICAgICAgICAgICBpZiAoIXNldHRpbmdzKSB7XG4gICAgICAgICAgICAgIC8vIENyZWF0ZSBkZWZhdWx0IHNldHRpbmdzIGlmIG5vbmUgZXhpc3RcbiAgICAgICAgICAgICAgc2V0dGluZ3MgPSBhd2FpdCBTZXR0aW5ncy5jcmVhdGUoe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBzZXR0aW5ncy5yZWZlcnJhbFByb2dyYW0gfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsID09PSAnL2FwaS9hZG1pbi9zZXR0aW5ncy9yZWZlcnJhbCcgJiYgbWV0aG9kID09PSAnUFVUJykge1xuICAgICAgICAgICAgaWYgKCFpc0FkbWluKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nIH0pKTsgfVxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBTZXR0aW5ncyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvU2V0dGluZ3MnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRoZSBpbmNvbWluZyBkYXRhXG4gICAgICAgICAgICBjb25zdCB7IHJld2FyZEFtb3VudCwgZGlzY291bnRQZXJjZW50YWdlIH0gPSBib2R5O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXdhcmRBbW91bnQgIT09ICdudW1iZXInIHx8IHJld2FyZEFtb3VudCA8IDApIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ludmFsaWQgcmV3YXJkIGFtb3VudCcgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXNjb3VudFBlcmNlbnRhZ2UgIT09ICdudW1iZXInIHx8IGRpc2NvdW50UGVyY2VudGFnZSA8IDAgfHwgZGlzY291bnRQZXJjZW50YWdlID4gMTAwKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidJbnZhbGlkIGRpc2NvdW50IHBlcmNlbnRhZ2UnIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IFNldHRpbmdzLmZpbmRPbmVBbmRVcGRhdGUoXG4gICAgICAgICAgICAgIHt9LCBcbiAgICAgICAgICAgICAgeyByZWZlcnJhbFByb2dyYW06IHsgcmV3YXJkQW1vdW50LCBkaXNjb3VudFBlcmNlbnRhZ2UgfSB9LCBcbiAgICAgICAgICAgICAgeyB1cHNlcnQ6IHRydWUsIG5ldzogdHJ1ZSB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB1cGRhdGVkLnJlZmVycmFsUHJvZ3JhbSB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUFVCTElDIEFQUExZLUNPVVBPTiBlbmRwb2ludFxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2Jvb2tpbmdzL2FwcGx5LWNvdXBvbicgJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCB7IGJvb2tpbmdJZCwgY291cG9uQ29kZSB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ291cG9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Db3Vwb24nKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQm9va2luZyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQm9va2luZycpO1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBUb3VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Ub3VyJyk7XG4gICAgICAgICAgICBpZiAoIWJvb2tpbmdJZCB8fCAhY291cG9uQ29kZSkgeyByZXMuc3RhdHVzQ29kZT00MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonYm9va2luZ0lkIGFuZCBjb3Vwb25Db2RlIGFyZSByZXF1aXJlZCcgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCBib29raW5nID0gYXdhaXQgQm9va2luZy5maW5kQnlJZChib29raW5nSWQpLnBvcHVsYXRlKCd1c2VyJywnX2lkJykucG9wdWxhdGUoJ3RvdXInLCdvd25lciBkZXN0aW5hdGlvbicpLmxlYW4oKTtcbiAgICAgICAgICAgIGlmICghYm9va2luZykgeyByZXMuc3RhdHVzQ29kZT00MDQ7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonQm9va2luZyBub3QgZm91bmQnIH0pKTsgfVxuICAgICAgICAgICAgY29uc3QgY291cG9uID0gYXdhaXQgQ291cG9uLmZpbmRPbmUoeyBjb2RlOiBjb3Vwb25Db2RlIH0pLmxlYW4oKTtcbiAgICAgICAgICAgIGlmICghY291cG9uIHx8ICFjb3Vwb24uaXNBY3RpdmUpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ludmFsaWQgY291cG9uJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBpZiAoY291cG9uLnN0YXJ0RGF0ZSAmJiBub3cgPCBjb3Vwb24uc3RhcnREYXRlKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidDb3Vwb24gbm90IHN0YXJ0ZWQnIH0pKTsgfVxuICAgICAgICAgICAgaWYgKGNvdXBvbi5lbmREYXRlICYmIG5vdyA+IGNvdXBvbi5lbmREYXRlKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidDb3Vwb24gZXhwaXJlZCcgfSkpOyB9XG4gICAgICAgICAgICBpZiAoY291cG9uLmxpbWl0cz8udG90YWxVc2VzICYmIGNvdXBvbi51c2VkQ291bnQgPj0gY291cG9uLmxpbWl0cy50b3RhbFVzZXMpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0NvdXBvbiB1c2FnZSBsaW1pdCByZWFjaGVkJyB9KSk7IH1cbiAgICAgICAgICAgIGlmIChjb3Vwb24ubGltaXRzPy51c2VzUGVyQ3VzdG9tZXIgJiYgKGNvdXBvbi51c2VkQnl8fFtdKS5zb21lKCh1OmFueSk9PiBTdHJpbmcodSkgPT09IFN0cmluZyhib29raW5nLnVzZXIuX2lkKSkpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0NvdXBvbiBhbHJlYWR5IHVzZWQgYnkgdGhpcyBjdXN0b21lcicgfSkpOyB9XG4gICAgICAgICAgICBpZiAoY291cG9uLnJ1bGVzPy5taW5pbXVtU3BlbmQgJiYgYm9va2luZy50b3RhbFByaWNlIDwgY291cG9uLnJ1bGVzLm1pbmltdW1TcGVuZCkgeyByZXMuc3RhdHVzQ29kZT00MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonTWluaW11bSBzcGVuZCBub3QgbWV0JyB9KSk7IH1cbiAgICAgICAgICAgIGlmIChjb3Vwb24ucnVsZXM/LmFwcGxpY2FibGVUb1RvdXJzPy5sZW5ndGggJiYgIWNvdXBvbi5ydWxlcy5hcHBsaWNhYmxlVG9Ub3Vycy5zb21lKChpZDphbnkpPT4gU3RyaW5nKGlkKSA9PT0gU3RyaW5nKGJvb2tpbmcudG91cikpKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidDb3Vwb24gbm90IGFwcGxpY2FibGUgdG8gdGhpcyB0b3VyJyB9KSk7IH1cbiAgICAgICAgICAgIGlmIChjb3Vwb24ucnVsZXM/LmFwcGxpY2FibGVUb0Rlc3RpbmF0aW9ucz8ubGVuZ3RoICYmICFjb3Vwb24ucnVsZXMuYXBwbGljYWJsZVRvRGVzdGluYXRpb25zLnNvbWUoKGlkOmFueSk9PiBTdHJpbmcoaWQpID09PSBTdHJpbmcoKGJvb2tpbmcudG91ciBhcyBhbnkpLmRlc3RpbmF0aW9uKSkpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0NvdXBvbiBub3QgYXBwbGljYWJsZSB0byB0aGlzIGRlc3RpbmF0aW9uJyB9KSk7IH1cbiAgICAgICAgICAgIGlmIChjb3Vwb24ucnVsZXM/LmFwcGxpY2FibGVUb1BhcnRuZXJzPy5sZW5ndGggJiYgIWNvdXBvbi5ydWxlcy5hcHBsaWNhYmxlVG9QYXJ0bmVycy5zb21lKChpZDphbnkpPT4gU3RyaW5nKGlkKSA9PT0gU3RyaW5nKChib29raW5nLnRvdXIgYXMgYW55KS5vd25lcikpKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidDb3Vwb24gbm90IGFwcGxpY2FibGUgdG8gdGhpcyBwYXJ0bmVyJyB9KSk7IH1cbiAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSBkaXNjb3VudFxuICAgICAgICAgICAgbGV0IGRpc2NvdW50ID0gMDtcbiAgICAgICAgICAgIGlmIChjb3Vwb24uZGlzY291bnRUeXBlID09PSAncGVyY2VudGFnZScpIGRpc2NvdW50ID0gKGJvb2tpbmcudG90YWxQcmljZSB8fCAwKSAqIChjb3Vwb24uZGlzY291bnRWYWx1ZS8xMDApO1xuICAgICAgICAgICAgZWxzZSBkaXNjb3VudCA9IGNvdXBvbi5kaXNjb3VudFZhbHVlO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB7IGRpc2NvdW50LCBuZXdUb3RhbDogTWF0aC5tYXgoMCwgKGJvb2tpbmcudG90YWxQcmljZXx8MCkgLSBkaXNjb3VudCkgfSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gLS0tIEFuYWx5dGljcyBBZG1pbiBBUElzIChhZG1pbiwgc3RhZmYpIC0tLVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCAnJztcbiAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi9hbmFseXRpY3MnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRva2VuID8gdmVyaWZ5Snd0KHRva2VuKSA6IG51bGw7XG4gICAgICAgIGlmICghcGF5bG9hZCB8fCAhWydhZG1pbicsJ3N0YWZmJ10uaW5jbHVkZXMocGF5bG9hZC5yb2xlKSkgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgY29uc3QgdSA9IG5ldyBVUkwocmVxLm9yaWdpbmFsVXJsIHx8IHVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgY29uc3Qgc3RhcnREYXRlID0gdS5zZWFyY2hQYXJhbXMuZ2V0KCdzdGFydERhdGUnKSA/IG5ldyBEYXRlKFN0cmluZyh1LnNlYXJjaFBhcmFtcy5nZXQoJ3N0YXJ0RGF0ZScpKSkgOiBuZXcgRGF0ZShEYXRlLm5vdygpLTMwKjI0KjM2MDAqMTAwMCk7XG4gICAgICAgIGNvbnN0IGVuZERhdGUgPSB1LnNlYXJjaFBhcmFtcy5nZXQoJ2VuZERhdGUnKSA/IG5ldyBEYXRlKFN0cmluZyh1LnNlYXJjaFBhcmFtcy5nZXQoJ2VuZERhdGUnKSkpIDogbmV3IERhdGUoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYW5hbHl0aWNzL292ZXJ2aWV3JykpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQm9va2luZyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvQm9va2luZycpO1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBVc2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Vc2VyJyk7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFRvdXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1RvdXInKTtcbiAgICAgICAgICAgIGNvbnN0IHJldkFnZyA9IGF3YWl0IEJvb2tpbmcuYWdncmVnYXRlKFtcbiAgICAgICAgICAgICAgeyAkbWF0Y2g6IHsgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9LCBzdGF0dXM6IHsgJGluOiBbJ2NvbmZpcm1lZCcsJ3JlZnVuZGVkJywnY2FuY2VsbGVkJywncGVuZGluZyddIH0gfSB9LFxuICAgICAgICAgICAgICB7ICRncm91cDogeyBfaWQ6IHsgJGRhdGVUb1N0cmluZzogeyBmb3JtYXQ6ICclWS0lbScsIGRhdGU6ICckY3JlYXRlZEF0JyB9IH0sIHJldmVudWU6IHsgJHN1bTogJyR0b3RhbFByaWNlJyB9LCBib29raW5nczogeyAkc3VtOiAxIH0gfSB9LFxuICAgICAgICAgICAgICB7ICRzb3J0OiB7IF9pZDogMSB9IH1cbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgY29uc3Qga3BpcyA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgQm9va2luZy5hZ2dyZWdhdGUoW3sgJG1hdGNoOiB7IGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSwgc3RhdHVzOiB7ICRpbjogWydjb25maXJtZWQnLCdyZWZ1bmRlZCcsJ2NhbmNlbGxlZCcsJ3BlbmRpbmcnXSB9IH0gfSwgeyAkZ3JvdXA6IHsgX2lkOiBudWxsLCByZXZlbnVlOiB7ICRzdW06ICckdG90YWxQcmljZScgfSwgYm9va2luZ3M6IHsgJHN1bTogMSB9IH0gfV0pLFxuICAgICAgICAgICAgICBVc2VyLmNvdW50RG9jdW1lbnRzKHsgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9IH0pLFxuICAgICAgICAgICAgICBUb3VyLmFnZ3JlZ2F0ZShbeyAkZ3JvdXA6IHsgX2lkOiBudWxsLCBhdmdSYXRpbmc6IHsgJGF2ZzogJyRhdmVyYWdlUmF0aW5nJyB9IH0gfV0pXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIGNvbnN0IHRvcFRvdXJzID0gYXdhaXQgQm9va2luZy5hZ2dyZWdhdGUoW1xuICAgICAgICAgICAgICB7ICRtYXRjaDogeyBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gfSB9LFxuICAgICAgICAgICAgICB7ICRncm91cDogeyBfaWQ6ICckdG91cicsIHJldmVudWU6IHsgJHN1bTogJyR0b3RhbFByaWNlJyB9LCBib29raW5nczogeyAkc3VtOiAxIH0gfSB9LFxuICAgICAgICAgICAgICB7ICRzb3J0OiB7IHJldmVudWU6IC0xIH0gfSxcbiAgICAgICAgICAgICAgeyAkbGltaXQ6IDUgfSxcbiAgICAgICAgICAgICAgeyAkbG9va3VwOiB7IGZyb206ICd0b3VycycsIGxvY2FsRmllbGQ6ICdfaWQnLCBmb3JlaWduRmllbGQ6ICdfaWQnLCBhczogJ3RvdXInIH0gfSxcbiAgICAgICAgICAgICAgeyAkdW53aW5kOiAnJHRvdXInIH1cbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogeyByZXZBZ2csIGtwaXMsIHRvcFRvdXJzIH0gfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYW5hbHl0aWNzL3JldmVudWUnKSkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBCb29raW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Cb29raW5nJyk7XG4gICAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbklkID0gdS5zZWFyY2hQYXJhbXMuZ2V0KCdkZXN0aW5hdGlvbklkJyk7XG4gICAgICAgICAgICBjb25zdCBwYXJ0bmVySWQgPSB1LnNlYXJjaFBhcmFtcy5nZXQoJ3BhcnRuZXJJZCcpO1xuICAgICAgICAgICAgY29uc3QgcGlwZWxpbmU6IGFueVtdID0gWyB7ICRtYXRjaDogeyBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gfSB9IF07XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25JZCkgcGlwZWxpbmUucHVzaCh7ICRsb29rdXA6IHsgZnJvbTogJ3RvdXJzJywgbG9jYWxGaWVsZDogJ3RvdXInLCBmb3JlaWduRmllbGQ6ICdfaWQnLCBhczogJ3RvdXInIH0gfSwgeyAkdW53aW5kOiAnJHRvdXInIH0sIHsgJG1hdGNoOiB7ICd0b3VyLmRlc3RpbmF0aW9uJzogKGF3YWl0IGltcG9ydCgnbW9uZ29vc2UnKSkuZGVmYXVsdC5UeXBlcy5PYmplY3RJZC5jcmVhdGVGcm9tSGV4U3RyaW5nKGRlc3RpbmF0aW9uSWQpIH0gfSk7XG4gICAgICAgICAgICBpZiAocGFydG5lcklkKSBwaXBlbGluZS5wdXNoKHsgJGxvb2t1cDogeyBmcm9tOiAndG91cnMnLCBsb2NhbEZpZWxkOiAndG91cicsIGZvcmVpZ25GaWVsZDogJ19pZCcsIGFzOiAndG91cicgfSB9LCB7ICR1bndpbmQ6ICckdG91cicgfSwgeyAkbWF0Y2g6IHsgJ3RvdXIub3duZXInOiAoYXdhaXQgaW1wb3J0KCdtb25nb29zZScpKS5kZWZhdWx0LlR5cGVzLk9iamVjdElkLmNyZWF0ZUZyb21IZXhTdHJpbmcocGFydG5lcklkKSB9IH0pO1xuICAgICAgICAgICAgcGlwZWxpbmUucHVzaCh7ICRncm91cDogeyBfaWQ6IHsgJGRhdGVUb1N0cmluZzogeyBmb3JtYXQ6ICclWS0lbS0lZCcsIGRhdGU6ICckY3JlYXRlZEF0JyB9IH0sIHRvdGFsUmV2ZW51ZTogeyAkc3VtOiAnJHRvdGFsUHJpY2UnIH0sIGJvb2tpbmdGZWVzOiB7ICRzdW06IHsgJG11bHRpcGx5OiBbJyR0b3RhbFByaWNlJywgMC4wNV0gfSB9LCByZWZ1bmRzOiB7ICRzdW06IHsgJGNvbmQ6IFt7ICRlcTogWyckc3RhdHVzJywncmVmdW5kZWQnXSB9LCAnJHRvdGFsUHJpY2UnLCAwXSB9IH0gfSB9LCB7ICRzb3J0OiB7IF9pZDogMSB9IH0pO1xuICAgICAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IEJvb2tpbmcuYWdncmVnYXRlKHBpcGVsaW5lKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHJvd3MgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYW5hbHl0aWNzL3Byb2R1Y3QtcGVyZm9ybWFuY2UnKSkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBUb3VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Ub3VyJyk7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJvb2tpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jvb2tpbmcnKTtcbiAgICAgICAgICAgIC8vIE1vY2sgcGFnZVZpZXdzIGZyb20gdG91cnMgKGV4dGVuZCBpbiBmdXR1cmUpXG4gICAgICAgICAgICBjb25zdCB0b3VycyA9IGF3YWl0IFRvdXIuZmluZCh7fSkuc2VsZWN0KCd0aXRsZSBhdmVyYWdlUmF0aW5nIG93bmVyJykubGVhbigpO1xuICAgICAgICAgICAgY29uc3QgYnlUb3VyID0gYXdhaXQgQm9va2luZy5hZ2dyZWdhdGUoW3sgJG1hdGNoOiB7IGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSB9IH0sIHsgJGdyb3VwOiB7IF9pZDogJyR0b3VyJywgYm9va2luZ3M6IHsgJHN1bTogMSB9LCByZXZlbnVlOiB7ICRzdW06ICckdG90YWxQcmljZScgfSB9IH1dKTtcbiAgICAgICAgICAgIGNvbnN0IG1hcDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9OyBieVRvdXIuZm9yRWFjaCgoYjphbnkpPT4gbWFwW1N0cmluZyhiLl9pZCldID0gYik7XG4gICAgICAgICAgICBjb25zdCByb3dzID0gdG91cnMubWFwKCh0OmFueSk9PiAoeyB0b3VySWQ6IFN0cmluZyh0Ll9pZCksIG5hbWU6IHQudGl0bGUsIHBhZ2VWaWV3czogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjUwMDApKzUwMCwgYm9va2luZ3M6IG1hcFtTdHJpbmcodC5faWQpXT8uYm9va2luZ3MgfHwgMCwgY29udmVyc2lvblJhdGU6ICgobWFwW1N0cmluZyh0Ll9pZCldPy5ib29raW5nc3x8MCkvTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjUwMDApKzUwMCkpKjEwMCwgYXZnUmF0aW5nOiB0LmF2ZXJhZ2VSYXRpbmcgfHwgMCwgdG90YWxSZXZlbnVlOiBtYXBbU3RyaW5nKHQuX2lkKV0/LnJldmVudWUgfHwgMCB9KSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiByb3dzIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL2FuYWx5dGljcy9jdXN0b21lci1zZWdtZW50cycpKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJvb2tpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jvb2tpbmcnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogVXNlciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvVXNlcicpO1xuICAgICAgICAgICAgY29uc3Qgc2VnbWVudCA9IHUuc2VhcmNoUGFyYW1zLmdldCgnc2VnbWVudCcpIHx8ICd2aXAnO1xuICAgICAgICAgICAgaWYgKHNlZ21lbnQgPT09ICd2aXAnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFnZyA9IGF3YWl0IEJvb2tpbmcuYWdncmVnYXRlKFt7ICRtYXRjaDogeyBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gfSB9LCB7ICRncm91cDogeyBfaWQ6ICckdXNlcicsIHRvdGFsU3BlbmQ6IHsgJHN1bTogJyR0b3RhbFByaWNlJyB9IH0gfSwgeyAkc29ydDogeyB0b3RhbFNwZW5kOiAtMSB9IH0sIHsgJGxpbWl0OiAxMDAgfSwgeyAkbG9va3VwOiB7IGZyb206ICd1c2VycycsIGxvY2FsRmllbGQ6ICdfaWQnLCBmb3JlaWduRmllbGQ6ICdfaWQnLCBhczogJ3VzZXInIH0gfSwgeyAkdW53aW5kOiAnJHVzZXInIH1dKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBhZ2cgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNlZ21lbnQgPT09ICduZXcnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFnZyA9IGF3YWl0IFVzZXIuYWdncmVnYXRlKFt7ICRtYXRjaDogeyBjcmVhdGVkQXQ6IHsgJGd0ZTogc3RhcnREYXRlLCAkbHRlOiBlbmREYXRlIH0gfSB9LCB7ICRwcm9qZWN0OiB7IG5hbWU6IDEsIGVtYWlsOiAxLCBjcmVhdGVkQXQ6IDEgfSB9XSk7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogYWdnIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWdtZW50ID09PSAnYXRfcmlzaycpIHtcbiAgICAgICAgICAgICAgY29uc3QgY3V0b2ZmID0gbmV3IERhdGUoZW5kRGF0ZSk7IGN1dG9mZi5zZXRNb250aChjdXRvZmYuZ2V0TW9udGgoKS02KTtcbiAgICAgICAgICAgICAgY29uc3QgYWN0aXZlID0gYXdhaXQgQm9va2luZy5kaXN0aW5jdCgndXNlcicsIHsgY3JlYXRlZEF0OiB7ICRndGU6IGN1dG9mZiwgJGx0ZTogZW5kRGF0ZSB9IH0pO1xuICAgICAgICAgICAgICBjb25zdCBhZ2cgPSBhd2FpdCBVc2VyLmZpbmQoeyBfaWQ6IHsgJG5pbjogYWN0aXZlIH0gfSkuc2VsZWN0KCduYW1lIGVtYWlsIGNyZWF0ZWRBdCcpLmxlYW4oKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBhZ2cgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vYW5hbHl0aWNzL2NvdXBvbi1wZXJmb3JtYW5jZScpKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IEJvb2tpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Jvb2tpbmcnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogQ291cG9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Db3Vwb24nKTtcbiAgICAgICAgICAgIC8vIEFzc3VtaW5nIGZ1dHVyZSBsaW5rIGJldHdlZW4gYm9va2luZ3MgYW5kIGNvdXBvbiBhcHBsaWVkOyBmb3Igbm93IG1vY2sgYWdncmVnYXRlZCB2aWV3IHVzaW5nIGNvdXBvbiB1c2FnZVxuICAgICAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IENvdXBvbi5maW5kKHt9KS5zZWxlY3QoJ2NvZGUgdXNlZENvdW50JykubGVhbigpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogcm93cyB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyAtLS0gRGFzaGJvYXJkIEFkbWluIEFQSXMgKGFkbWluLCBzdGFmZikgLS0tXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8ICcnO1xuICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL2Rhc2hib2FyZCcpKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRva2VuID8gdmVyaWZ5Snd0KHRva2VuKSA6IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXBheWxvYWQgfHwgIVsnYWRtaW4nLCdzdGFmZiddLmluY2x1ZGVzKHBheWxvYWQucm9sZSkpIHsgXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGU9NDAzOyBcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IFxuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFBhcnNlIHF1ZXJ5IHBhcmFtZXRlcnMgZm9yIGRhdGUgcmFuZ2VcbiAgICAgICAgY29uc3QgdSA9IG5ldyBVUkwocmVxLm9yaWdpbmFsVXJsIHx8IHVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgY29uc3QgZnJvbSA9IHUuc2VhcmNoUGFyYW1zLmdldCgnZnJvbScpO1xuICAgICAgICBjb25zdCB0byA9IHUuc2VhcmNoUGFyYW1zLmdldCgndG8nKTtcbiAgICAgICAgXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCBtb250aCBpZiBubyBkYXRlcyBwcm92aWRlZFxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCBzdGFydERhdGUgPSBmcm9tID8gbmV3IERhdGUoZnJvbSkgOiBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIDEpO1xuICAgICAgICBjb25zdCBlbmREYXRlID0gdG8gPyBuZXcgRGF0ZSh0bykgOiBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCkgKyAxLCAwLCAyMywgNTksIDU5LCA5OTkpO1xuICAgICAgICBcbiAgICAgICAgLy8gUHJldmlvdXMgcGVyaW9kIGZvciBjb21wYXJpc29uIChzYW1lIGR1cmF0aW9uKVxuICAgICAgICBjb25zdCBkdXJhdGlvbk1zID0gZW5kRGF0ZS5nZXRUaW1lKCkgLSBzdGFydERhdGUuZ2V0VGltZSgpO1xuICAgICAgICBjb25zdCBwcmV2U3RhcnREYXRlID0gbmV3IERhdGUoc3RhcnREYXRlLmdldFRpbWUoKSAtIGR1cmF0aW9uTXMpO1xuICAgICAgICBjb25zdCBwcmV2RW5kRGF0ZSA9IG5ldyBEYXRlKHN0YXJ0RGF0ZS5nZXRUaW1lKCkgLSAxKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIE1haW4gYWdncmVnYXRpb24gcGlwZWxpbmUgdXNpbmcgJGZhY2V0IGZvciBwYXJhbGxlbCBwcm9jZXNzaW5nXG4gICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBCb29raW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Cb29raW5nJyk7XG4gICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBVc2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Vc2VyJyk7XG4gICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBSZXZpZXcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1JldmlldycpO1xuICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogVG91ciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvVG91cicpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IG1haW5BZ2dyZWdhdGlvbiA9IGF3YWl0IEJvb2tpbmcuYWdncmVnYXRlKFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgJG1hdGNoOiB7XG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHN0YXJ0RGF0ZSwgJGx0ZTogZW5kRGF0ZSB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICRmYWNldDoge1xuICAgICAgICAgICAgICAgIC8vIEtQSSBNZXRyaWNzIC0gYWxsIGNhbGN1bGF0aW9ucyBpbiBwYXJhbGxlbFxuICAgICAgICAgICAgICAgIGtwaU1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJGdyb3VwOiB7XG4gICAgICAgICAgICAgICAgICAgICAgX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmV2ZW51ZTogeyAkc3VtOiB7ICRjb25kOiBbeyAkZXE6IFsnJHN0YXR1cycsICdjb25maXJtZWQnXSB9LCAnJHRvdGFsUHJpY2UnLCAwXSB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgdG90YWxCb29raW5nczogeyAkc3VtOiAxIH0sXG4gICAgICAgICAgICAgICAgICAgICAgY29uZmlybWVkQm9va2luZ3M6IHsgJHN1bTogeyAkY29uZDogW3sgJGVxOiBbJyRzdGF0dXMnLCAnY29uZmlybWVkJ10gfSwgMSwgMF0gfSB9LFxuICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdCb29raW5nczogeyAkc3VtOiB7ICRjb25kOiBbeyAkZXE6IFsnJHN0YXR1cycsICdwZW5kaW5nJ10gfSwgMSwgMF0gfSB9LFxuICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbGxlZEJvb2tpbmdzOiB7ICRzdW06IHsgJGNvbmQ6IFt7ICRlcTogWyckc3RhdHVzJywgJ2NhbmNlbGxlZCddIH0sIDEsIDBdIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgICByZWZ1bmRlZEJvb2tpbmdzOiB7ICRzdW06IHsgJGNvbmQ6IFt7ICRlcTogWyckc3RhdHVzJywgJ3JlZnVuZGVkJ10gfSwgMSwgMF0gfSB9LFxuICAgICAgICAgICAgICAgICAgICAgIGF2Z0Jvb2tpbmdWYWx1ZTogeyAkYXZnOiAnJHRvdGFsUHJpY2UnIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgLy8gUmV2ZW51ZSBvdmVyIHRpbWUgZm9yIGNoYXJ0c1xuICAgICAgICAgICAgICAgIHJldmVudWVPdmVyVGltZTogW1xuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkbWF0Y2g6IHsgc3RhdHVzOiAnY29uZmlybWVkJyB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkZ3JvdXA6IHtcbiAgICAgICAgICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXI6IHsgJHllYXI6ICckY3JlYXRlZEF0JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGg6IHsgJG1vbnRoOiAnJGNyZWF0ZWRBdCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheTogeyAkZGF5T2ZNb250aDogJyRjcmVhdGVkQXQnIH1cbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHJldmVudWU6IHsgJHN1bTogJyR0b3RhbFByaWNlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmdzOiB7ICRzdW06IDEgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkc29ydDogeyAnX2lkLnllYXInOiAxLCAnX2lkLm1vbnRoJzogMSwgJ19pZC5kYXknOiAxIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICRwcm9qZWN0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgX2lkOiAwLFxuICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkYXRlVG9TdHJpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnJVktJW0tJWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGRhdGVGcm9tUGFydHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHllYXI6ICckX2lkLnllYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGg6ICckX2lkLm1vbnRoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheTogJyRfaWQuZGF5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgcmV2ZW51ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgICBib29raW5nczogMVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAvLyBUb3AgcGVyZm9ybWluZyB0b3Vyc1xuICAgICAgICAgICAgICAgIHRvcFRvdXJzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICRtYXRjaDogeyBzdGF0dXM6ICdjb25maXJtZWQnIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgICAgICAgICAgIF9pZDogJyR0b3VyJyxcbiAgICAgICAgICAgICAgICAgICAgICByZXZlbnVlOiB7ICRzdW06ICckdG90YWxQcmljZScgfSxcbiAgICAgICAgICAgICAgICAgICAgICBib29raW5nczogeyAkc3VtOiAxIH0sXG4gICAgICAgICAgICAgICAgICAgICAgYXZnUmF0aW5nOiB7ICRhdmc6ICckdG91ckluZm8uYXZlcmFnZVJhdGluZycgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkc29ydDogeyByZXZlbnVlOiAtMSB9XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkbGltaXQ6IDEwXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkbG9va3VwOiB7XG4gICAgICAgICAgICAgICAgICAgICAgZnJvbTogJ3RvdXJzJyxcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZpZWxkOiAnX2lkJyxcbiAgICAgICAgICAgICAgICAgICAgICBmb3JlaWduRmllbGQ6ICdfaWQnLFxuICAgICAgICAgICAgICAgICAgICAgIGFzOiAndG91ckRldGFpbHMnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICR1bndpbmQ6ICckdG91ckRldGFpbHMnXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkcHJvamVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgIF9pZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICB0b3VySWQ6ICckX2lkJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJyR0b3VyRGV0YWlscy50aXRsZScsXG4gICAgICAgICAgICAgICAgICAgICAgcmV2ZW51ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgICBib29raW5nczogMSxcbiAgICAgICAgICAgICAgICAgICAgICBhdmdSYXRpbmc6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgcHJpY2U6ICckdG91ckRldGFpbHMucHJpY2UnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIC8vIFJlY2VudCBib29raW5ncyBmb3IgYWN0aXZpdHkgZmVlZFxuICAgICAgICAgICAgICAgIHJlY2VudEJvb2tpbmdzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICRzb3J0OiB7IGNyZWF0ZWRBdDogLTEgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbWl0OiAxMFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvb2t1cDoge1xuICAgICAgICAgICAgICAgICAgICAgIGZyb206ICd1c2VycycsXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYWxGaWVsZDogJ3VzZXInLFxuICAgICAgICAgICAgICAgICAgICAgIGZvcmVpZ25GaWVsZDogJ19pZCcsXG4gICAgICAgICAgICAgICAgICAgICAgYXM6ICd1c2VyRGV0YWlscydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvb2t1cDoge1xuICAgICAgICAgICAgICAgICAgICAgIGZyb206ICd0b3VycycsXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYWxGaWVsZDogJ3RvdXInLFxuICAgICAgICAgICAgICAgICAgICAgIGZvcmVpZ25GaWVsZDogJ19pZCcsXG4gICAgICAgICAgICAgICAgICAgICAgYXM6ICd0b3VyRGV0YWlscydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJHVud2luZDogJyR1c2VyRGV0YWlscydcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICR1bndpbmQ6ICckdG91ckRldGFpbHMnXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkcHJvamVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgIF9pZDogMSxcbiAgICAgICAgICAgICAgICAgICAgICBib29raW5nSWQ6IHsgJHRvU3RyaW5nOiAnJF9pZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICB1c2VyOiAnJHVzZXJEZXRhaWxzLm5hbWUnLFxuICAgICAgICAgICAgICAgICAgICAgIHRvdXI6ICckdG91ckRldGFpbHMudGl0bGUnLFxuICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUHJpY2U6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAxLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcnRpY2lwYW50czogMSxcbiAgICAgICAgICAgICAgICAgICAgICBib29raW5nRGF0ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IDFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgLy8gUHJldmlvdXMgcGVyaW9kIGFnZ3JlZ2F0aW9uIGZvciBjb21wYXJpc29uXG4gICAgICAgICAgY29uc3QgcHJldlBlcmlvZEFnZ3JlZ2F0aW9uID0gYXdhaXQgQm9va2luZy5hZ2dyZWdhdGUoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAkbWF0Y2g6IHtcbiAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IHsgJGd0ZTogcHJldlN0YXJ0RGF0ZSwgJGx0ZTogcHJldkVuZERhdGUgfSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdjb25maXJtZWQnXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgICAgIF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICB0b3RhbFJldmVudWU6IHsgJHN1bTogJyR0b3RhbFByaWNlJyB9LFxuICAgICAgICAgICAgICAgIHRvdGFsQm9va2luZ3M6IHsgJHN1bTogMSB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdKTtcblxuICAgICAgICAgIC8vIEFkZGl0aW9uYWwgcXVlcmllcyBmb3IgZGF0YSBub3QgaW4gYm9va2luZ3NcbiAgICAgICAgICBjb25zdCBbXG4gICAgICAgICAgICBuZXdVc2Vyc0NvdW50LFxuICAgICAgICAgICAgbmV3VXNlcnNQcmV2Q291bnQsXG4gICAgICAgICAgICBwZW5kaW5nUmV2aWV3c0NvdW50LFxuICAgICAgICAgICAgdG90YWxUb3Vyc0NvdW50LFxuICAgICAgICAgICAgYWN0aXZlVG91cnNDb3VudFxuICAgICAgICAgIF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBVc2VyLmNvdW50RG9jdW1lbnRzKHsgXG4gICAgICAgICAgICAgIGNyZWF0ZWRBdDogeyAkZ3RlOiBzdGFydERhdGUsICRsdGU6IGVuZERhdGUgfSxcbiAgICAgICAgICAgICAgcm9sZTogJ3VzZXInXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIFVzZXIuY291bnREb2N1bWVudHMoeyBcbiAgICAgICAgICAgICAgY3JlYXRlZEF0OiB7ICRndGU6IHByZXZTdGFydERhdGUsICRsdGU6IHByZXZFbmREYXRlIH0sXG4gICAgICAgICAgICAgIHJvbGU6ICd1c2VyJ1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBSZXZpZXcuY291bnREb2N1bWVudHMoeyBzdGF0dXM6ICdwZW5kaW5nJyB9KSxcbiAgICAgICAgICAgIFRvdXIuY291bnREb2N1bWVudHMoe30pLFxuICAgICAgICAgICAgVG91ci5jb3VudERvY3VtZW50cyh7IHN0YXR1czogJ3B1Ymxpc2hlZCcgfSlcbiAgICAgICAgICBdKTtcblxuICAgICAgICAgIC8vIEV4dHJhY3QgcmVzdWx0cyBmcm9tIG1haW4gYWdncmVnYXRpb25cbiAgICAgICAgICBjb25zdCBrcGlNZXRyaWNzID0gbWFpbkFnZ3JlZ2F0aW9uWzBdPy5rcGlNZXRyaWNzWzBdIHx8IHtcbiAgICAgICAgICAgIHRvdGFsUmV2ZW51ZTogMCxcbiAgICAgICAgICAgIHRvdGFsQm9va2luZ3M6IDAsXG4gICAgICAgICAgICBjb25maXJtZWRCb29raW5nczogMCxcbiAgICAgICAgICAgIHBlbmRpbmdCb29raW5nczogMCxcbiAgICAgICAgICAgIGNhbmNlbGxlZEJvb2tpbmdzOiAwLFxuICAgICAgICAgICAgcmVmdW5kZWRCb29raW5nczogMCxcbiAgICAgICAgICAgIGF2Z0Jvb2tpbmdWYWx1ZTogMFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCByZXZlbnVlT3ZlclRpbWUgPSBtYWluQWdncmVnYXRpb25bMF0/LnJldmVudWVPdmVyVGltZSB8fCBbXTtcbiAgICAgICAgICBjb25zdCB0b3BUb3VycyA9IG1haW5BZ2dyZWdhdGlvblswXT8udG9wVG91cnMgfHwgW107XG4gICAgICAgICAgY29uc3QgcmVjZW50Qm9va2luZ3MgPSBtYWluQWdncmVnYXRpb25bMF0/LnJlY2VudEJvb2tpbmdzIHx8IFtdO1xuXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGNvbXBhcmlzb24gbWV0cmljc1xuICAgICAgICAgIGNvbnN0IHByZXZQZXJpb2RNZXRyaWNzID0gcHJldlBlcmlvZEFnZ3JlZ2F0aW9uWzBdIHx8IHsgdG90YWxSZXZlbnVlOiAwLCB0b3RhbEJvb2tpbmdzOiAwIH07XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgcmV2ZW51ZUNvbXBhcmlzb24gPSBwcmV2UGVyaW9kTWV0cmljcy50b3RhbFJldmVudWUgPT09IDAgXG4gICAgICAgICAgICA/IDEwMCBcbiAgICAgICAgICAgIDogTWF0aC5yb3VuZCgoKGtwaU1ldHJpY3MudG90YWxSZXZlbnVlIC0gcHJldlBlcmlvZE1ldHJpY3MudG90YWxSZXZlbnVlKSAvIHByZXZQZXJpb2RNZXRyaWNzLnRvdGFsUmV2ZW51ZSkgKiAxMDApO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGJvb2tpbmdzQ29tcGFyaXNvbiA9IHByZXZQZXJpb2RNZXRyaWNzLnRvdGFsQm9va2luZ3MgPT09IDAgXG4gICAgICAgICAgICA/IDEwMCBcbiAgICAgICAgICAgIDogTWF0aC5yb3VuZCgoKGtwaU1ldHJpY3MuY29uZmlybWVkQm9va2luZ3MgLSBwcmV2UGVyaW9kTWV0cmljcy50b3RhbEJvb2tpbmdzKSAvIHByZXZQZXJpb2RNZXRyaWNzLnRvdGFsQm9va2luZ3MpICogMTAwKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCB1c2Vyc0NvbXBhcmlzb24gPSBuZXdVc2Vyc1ByZXZDb3VudCA9PT0gMCBcbiAgICAgICAgICAgID8gMTAwIFxuICAgICAgICAgICAgOiBNYXRoLnJvdW5kKCgobmV3VXNlcnNDb3VudCAtIG5ld1VzZXJzUHJldkNvdW50KSAvIG5ld1VzZXJzUHJldkNvdW50KSAqIDEwMCk7XG5cbiAgICAgICAgICAvLyBDYWxjdWxhdGUgY29udmVyc2lvbiByYXRlIChzaW1wbGlmaWVkIC0gd291bGQgbmVlZCBzZXNzaW9uIGRhdGEgZm9yIGFjY3VyYXRlIGNhbGN1bGF0aW9uKVxuICAgICAgICAgIGNvbnN0IGNvbnZlcnNpb25SYXRlID0gdG90YWxUb3Vyc0NvdW50ID4gMCBcbiAgICAgICAgICAgID8gTWF0aC5yb3VuZCgoa3BpTWV0cmljcy5jb25maXJtZWRCb29raW5ncyAvIHRvdGFsVG91cnNDb3VudCkgKiAxMDApIFxuICAgICAgICAgICAgOiAwO1xuXG4gICAgICAgICAgLy8gRm9ybWF0IGNoYXJ0IGRhdGFcbiAgICAgICAgICBjb25zdCBjaGFydERhdGEgPSByZXZlbnVlT3ZlclRpbWUubWFwKChpdGVtOiBhbnkpID0+ICh7XG4gICAgICAgICAgICBkYXRlOiBpdGVtLmRhdGUsXG4gICAgICAgICAgICByZXZlbnVlOiBpdGVtLnJldmVudWUsXG4gICAgICAgICAgICBib29raW5nczogaXRlbS5ib29raW5nc1xuICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIC8vIEZvcm1hdCB0b3AgdG91cnMgZGF0YVxuICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFRvcFRvdXJzID0gdG9wVG91cnMubWFwKCh0b3VyOiBhbnkpID0+ICh7XG4gICAgICAgICAgICB0b3VySWQ6IHRvdXIudG91cklkLFxuICAgICAgICAgICAgdGl0bGU6IHRvdXIudGl0bGUsXG4gICAgICAgICAgICByZXZlbnVlOiB0b3VyLnJldmVudWUsXG4gICAgICAgICAgICBib29raW5nczogdG91ci5ib29raW5ncyxcbiAgICAgICAgICAgIGF2Z1JhdGluZzogdG91ci5hdmdSYXRpbmcgfHwgMCxcbiAgICAgICAgICAgIHByaWNlOiB0b3VyLnByaWNlXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgLy8gRm9ybWF0IHJlY2VudCBib29raW5ncyBkYXRhXG4gICAgICAgICAgY29uc3QgZm9ybWF0dGVkUmVjZW50Qm9va2luZ3MgPSByZWNlbnRCb29raW5ncy5tYXAoKGJvb2tpbmc6IGFueSkgPT4gKHtcbiAgICAgICAgICAgIGlkOiBib29raW5nLmJvb2tpbmdJZCxcbiAgICAgICAgICAgIHVzZXI6IGJvb2tpbmcudXNlcixcbiAgICAgICAgICAgIHRvdXI6IGJvb2tpbmcudG91cixcbiAgICAgICAgICAgIHRvdGFsOiBib29raW5nLnRvdGFsUHJpY2UsXG4gICAgICAgICAgICBzdGF0dXM6IGJvb2tpbmcuc3RhdHVzLFxuICAgICAgICAgICAgcGFydGljaXBhbnRzOiBib29raW5nLnBhcnRpY2lwYW50cyxcbiAgICAgICAgICAgIGJvb2tpbmdEYXRlOiBib29raW5nLmJvb2tpbmdEYXRlLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBib29raW5nLmNyZWF0ZWRBdFxuICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgLy8gS1BJIENhcmRzIERhdGFcbiAgICAgICAgICAgICAga3BpQ2FyZHM6IHtcbiAgICAgICAgICAgICAgICBtb250aGx5UmV2ZW51ZToge1xuICAgICAgICAgICAgICAgICAgdmFsdWU6IGtwaU1ldHJpY3MudG90YWxSZXZlbnVlLFxuICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbjogcmV2ZW51ZUNvbXBhcmlzb24sXG4gICAgICAgICAgICAgICAgICBpc1Bvc2l0aXZlOiByZXZlbnVlQ29tcGFyaXNvbiA+PSAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdCb29raW5nczoge1xuICAgICAgICAgICAgICAgICAgdmFsdWU6IGtwaU1ldHJpY3MuY29uZmlybWVkQm9va2luZ3MsXG4gICAgICAgICAgICAgICAgICBjb21wYXJpc29uOiBib29raW5nc0NvbXBhcmlzb24sXG4gICAgICAgICAgICAgICAgICBpc1Bvc2l0aXZlOiBib29raW5nc0NvbXBhcmlzb24gPj0gMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VXNlcnM6IHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBuZXdVc2Vyc0NvdW50LFxuICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbjogdXNlcnNDb21wYXJpc29uLFxuICAgICAgICAgICAgICAgICAgaXNQb3NpdGl2ZTogdXNlcnNDb21wYXJpc29uID49IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbnZlcnNpb25SYXRlOiB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZTogY29udmVyc2lvblJhdGUsXG4gICAgICAgICAgICAgICAgICBjb21wYXJpc29uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgaXNQb3NpdGl2ZTogY29udmVyc2lvblJhdGUgPiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwZW5kaW5nUmV2aWV3czoge1xuICAgICAgICAgICAgICAgICAgdmFsdWU6IHBlbmRpbmdSZXZpZXdzQ291bnQsXG4gICAgICAgICAgICAgICAgICBjb21wYXJpc29uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgaXNQb3NpdGl2ZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIC8vIENoYXJ0IERhdGFcbiAgICAgICAgICAgICAgcmV2ZW51ZUNoYXJ0RGF0YTogY2hhcnREYXRhLFxuICAgICAgICAgICAgICAvLyBUb3AgUGVyZm9ybWluZyBEYXRhXG4gICAgICAgICAgICAgIHRvcFRvdXJzOiBmb3JtYXR0ZWRUb3BUb3VycyxcbiAgICAgICAgICAgICAgLy8gQWN0aXZpdHkgRGF0YVxuICAgICAgICAgICAgICByZWNlbnRCb29raW5nczogZm9ybWF0dGVkUmVjZW50Qm9va2luZ3MsXG4gICAgICAgICAgICAgIC8vIEFkZGl0aW9uYWwgTWV0cmljc1xuICAgICAgICAgICAgICBhZGRpdGlvbmFsTWV0cmljczoge1xuICAgICAgICAgICAgICAgIHRvdGFsVG91cnM6IHRvdGFsVG91cnNDb3VudCxcbiAgICAgICAgICAgICAgICBhY3RpdmVUb3VyczogYWN0aXZlVG91cnNDb3VudCxcbiAgICAgICAgICAgICAgICBhdmdCb29raW5nVmFsdWU6IGtwaU1ldHJpY3MuYXZnQm9va2luZ1ZhbHVlLFxuICAgICAgICAgICAgICAgIGJvb2tpbmdTdGF0dXNCcmVha2Rvd246IHtcbiAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDoga3BpTWV0cmljcy5jb25maXJtZWRCb29raW5ncyxcbiAgICAgICAgICAgICAgICAgIHBlbmRpbmc6IGtwaU1ldHJpY3MucGVuZGluZ0Jvb2tpbmdzLFxuICAgICAgICAgICAgICAgICAgY2FuY2VsbGVkOiBrcGlNZXRyaWNzLmNhbmNlbGxlZEJvb2tpbmdzLFxuICAgICAgICAgICAgICAgICAgcmVmdW5kZWQ6IGtwaU1ldHJpY3MucmVmdW5kZWRCb29raW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgLy8gRGF0ZSByYW5nZSBpbmZvXG4gICAgICAgICAgICAgIGRhdGVSYW5nZToge1xuICAgICAgICAgICAgICAgIGZyb206IHN0YXJ0RGF0ZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHRvOiBlbmREYXRlLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBgJHtzdGFydERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCd2aS1WTicpfSAtICR7ZW5kRGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoJ3ZpLVZOJyl9YFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Rhc2hib2FyZCBBUEkgRXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgIGVycm9yOiAnSW50ZXJuYWwgU2VydmVyIEVycm9yJyxcbiAgICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gLS0tIERlc3RpbmF0aW9ucyBBZG1pbiBBUElzIChhZG1pbiwgc3RhZmYpIC0tLVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCAnJztcbiAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi9kZXN0aW5hdGlvbnMnKSAmJiAhdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWkvZ2VuZXJhdGUtdGV4dCcpKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICBjb25zdCB7IHBhcnNlIH0gPSBhd2FpdCBpbXBvcnQoJ2Nvb2tpZScpO1xuICAgICAgICBjb25zdCB7IHZlcmlmeUp3dCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvYXV0aC9qd3QuanMnKTtcbiAgICAgICAgY29uc3QgY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyk7XG4gICAgICAgIGNvbnN0IHRva2VuID0gY29va2llc1snYXV0aF90b2tlbiddO1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gdG9rZW4gPyB2ZXJpZnlKd3QodG9rZW4pIDogbnVsbDtcbiAgICAgICAgaWYgKCFwYXlsb2FkIHx8ICFbJ2FkbWluJywnc3RhZmYnXS5pbmNsdWRlcyhwYXlsb2FkLnJvbGUpKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nfSkpOyB9XG4gICAgICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xuICAgICAgICBjb25zdCB1ID0gbmV3IFVSTChyZXEub3JpZ2luYWxVcmwgfHwgdXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi9kZXN0aW5hdGlvbnMnKSAmJiByZXEubWV0aG9kID09PSAnR0VUJyAmJiAodXJsID09PSAnL2FwaS9hZG1pbi9kZXN0aW5hdGlvbnMnIHx8IHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL2Rlc3RpbmF0aW9ucz8nKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogRGVzdGluYXRpb24gfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Rlc3RpbmF0aW9uJyk7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2ggPSAodS5zZWFyY2hQYXJhbXMuZ2V0KCdzZWFyY2gnKSB8fCAnJykudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcGFnZSA9IE1hdGgubWF4KDEsIHBhcnNlSW50KHUuc2VhcmNoUGFyYW1zLmdldCgncGFnZScpIHx8ICcxJywgMTApKTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgxLCBwYXJzZUludCh1LnNlYXJjaFBhcmFtcy5nZXQoJ2xpbWl0JykgfHwgJzIwJywgMTApKSk7XG4gICAgICAgICAgICBjb25zdCBtYXRjaDogYW55ID0ge307XG4gICAgICAgICAgICBpZiAoc2VhcmNoKSBtYXRjaC5uYW1lID0geyAkcmVnZXg6IHNlYXJjaCwgJG9wdGlvbnM6ICdpJyB9O1xuICAgICAgICAgICAgY29uc3QgcGlwZWxpbmU6IGFueVtdID0gW1xuICAgICAgICAgICAgICB7ICRtYXRjaDogbWF0Y2ggfSxcbiAgICAgICAgICAgICAgeyAkbG9va3VwOiB7IGZyb206ICd0b3VycycsIGxvY2FsRmllbGQ6ICdfaWQnLCBmb3JlaWduRmllbGQ6ICdkZXN0aW5hdGlvbicsIGFzOiAndG91cnMnIH0gfSxcbiAgICAgICAgICAgICAgeyAkbG9va3VwOiB7IGZyb206ICdib29raW5ncycsIGxvY2FsRmllbGQ6ICd0b3Vycy5faWQnLCBmb3JlaWduRmllbGQ6ICd0b3VyJywgYXM6ICdib29raW5ncycgfSB9LFxuICAgICAgICAgICAgICB7ICRhZGRGaWVsZHM6IHsgdG91ckNvdW50OiB7ICRzaXplOiAnJHRvdXJzJyB9LCB0b3RhbEJvb2tpbmdzOiB7ICRzaXplOiAnJGJvb2tpbmdzJyB9LCB0b3RhbFJldmVudWU6IHsgJHN1bTogJyRib29raW5ncy50b3RhbFByaWNlJyB9IH0gfSxcbiAgICAgICAgICAgICAgeyAkcHJvamVjdDogeyBib29raW5nczogMCB9IH0sXG4gICAgICAgICAgICAgIHsgJHNvcnQ6IHsgdXBkYXRlZEF0OiAtMSB9IH0sXG4gICAgICAgICAgICAgIHsgJGZhY2V0OiB7IHJvd3M6IFt7ICRza2lwOiAocGFnZS0xKSpsaW1pdCB9LCB7ICRsaW1pdDogbGltaXQgfV0sIHRvdGFsOiBbeyAkY291bnQ6ICdjb3VudCcgfV0gfSB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGNvbnN0IGFnZyA9IGF3YWl0IChhd2FpdCBpbXBvcnQoJ21vbmdvb3NlJykpLmRlZmF1bHQuY29ubmVjdGlvbi5jb2xsZWN0aW9uKCdkZXN0aW5hdGlvbnMnKS5hZ2dyZWdhdGUocGlwZWxpbmUpLnRvQXJyYXkoKTtcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gYWdnWzBdPy50b3RhbD8uWzBdPy5jb3VudCB8fCAwO1xuICAgICAgICAgICAgY29uc3Qgcm93cyA9IGFnZ1swXT8ucm93cyB8fCBbXTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogeyB0b3RhbCwgcGFnZSwgbGltaXQsIHJvd3MgfSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGlkTWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL2Rlc3RpbmF0aW9uc1xcLyhbXi9dKykkLyk7XG4gICAgICAgICAgaWYgKGlkTWF0Y2ggJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogRGVzdGluYXRpb24gfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL0Rlc3RpbmF0aW9uJyk7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFRvdXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1RvdXInKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gaWRNYXRjaFsxXTtcbiAgICAgICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IERlc3RpbmF0aW9uLmZpbmRCeUlkKGlkKS5sZWFuKCk7XG4gICAgICAgICAgICBpZiAoIWRvYykgeyByZXMuc3RhdHVzQ29kZT00MDQ7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonTm90IGZvdW5kJyB9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHRvdXJzID0gYXdhaXQgVG91ci5maW5kKHsgZGVzdGluYXRpb246IGlkIH0pLnNlbGVjdCgnX2lkIHRpdGxlJykubGVhbigpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogeyAuLi5kb2MsIHRvdXJzIH0gfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodXJsID09PSAnL2FwaS9hZG1pbi9kZXN0aW5hdGlvbnMnICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBEZXN0aW5hdGlvbiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvRGVzdGluYXRpb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb246IENoZWNrIHJlcXVpcmVkIGZpZWxkc1xuICAgICAgICAgICAgaWYgKCFib2R5Lm5hbWUgfHwgIWJvZHkuc2x1Zykge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05hbWUgYW5kIHNsdWcgYXJlIHJlcXVpcmVkJyB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHNsdWcgZm9ybWF0IChhbHBoYW51bWVyaWMsIGh5cGhlbnMsIHVuZGVyc2NvcmVzIG9ubHkpXG4gICAgICAgICAgICBjb25zdCBzbHVnUmVnZXggPSAvXlthLXowLTldKyg/Oi1bYS16MC05XSspKiQvO1xuICAgICAgICAgICAgaWYgKCFzbHVnUmVnZXgudGVzdChib2R5LnNsdWcpKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2x1ZyBtdXN0IGNvbnRhaW4gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycywgYW5kIGh5cGhlbnMnIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRHVwbGljYXRlIGNoZWNrOiBDaGVjayBpZiBhIGRlc3RpbmF0aW9uIHdpdGggdGhlIGdpdmVuIHNsdWcgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nRGVzdGluYXRpb24gPSBhd2FpdCBEZXN0aW5hdGlvbi5maW5kT25lKHsgc2x1ZzogYm9keS5zbHVnIH0pO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nRGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDk7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBIGRlc3RpbmF0aW9uIHdpdGggdGhpcyBzbHVnIGFscmVhZHkgZXhpc3RzJyB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZGVzdGluYXRpb24gd2l0aCB2YWxpZGF0ZWQgZGF0YVxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25EYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBib2R5Lm5hbWUudHJpbSgpLFxuICAgICAgICAgICAgICBzbHVnOiBib2R5LnNsdWcudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGJvZHkuZGVzY3JpcHRpb24/LnRyaW0oKSxcbiAgICAgICAgICAgICAgaGlzdG9yeTogYm9keS5oaXN0b3J5Py50cmltKCksXG4gICAgICAgICAgICAgIGN1bHR1cmU6IGJvZHkuY3VsdHVyZT8udHJpbSgpLFxuICAgICAgICAgICAgICBnZW9ncmFwaHk6IGJvZHkuZ2VvZ3JhcGh5Py50cmltKCksXG4gICAgICAgICAgICAgIG1haW5JbWFnZTogYm9keS5tYWluSW1hZ2U/LnRyaW0oKSxcbiAgICAgICAgICAgICAgaW1hZ2VHYWxsZXJ5OiBBcnJheS5pc0FycmF5KGJvZHkuaW1hZ2VHYWxsZXJ5KSA/IGJvZHkuaW1hZ2VHYWxsZXJ5IDogW10sXG4gICAgICAgICAgICAgIGJlc3RUaW1lVG9WaXNpdDogYm9keS5iZXN0VGltZVRvVmlzaXQ/LnRyaW0oKSxcbiAgICAgICAgICAgICAgZXNzZW50aWFsVGlwczogQXJyYXkuaXNBcnJheShib2R5LmVzc2VudGlhbFRpcHMpID8gYm9keS5lc3NlbnRpYWxUaXBzIDogW10sXG4gICAgICAgICAgICAgIHN0YXR1czogYm9keS5zdGF0dXMgfHwgJ2RyYWZ0J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IERlc3RpbmF0aW9uLmNyZWF0ZShkZXN0aW5hdGlvbkRhdGEpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDE7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY3JlYXRlZCB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpZE1hdGNoICYmIHJlcS5tZXRob2QgPT09ICdQVVQnKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IERlc3RpbmF0aW9uIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9EZXN0aW5hdGlvbicpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBpZE1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBhd2FpdCBEZXN0aW5hdGlvbi5maW5kQnlJZEFuZFVwZGF0ZShpZCwgYm9keSwgeyBuZXc6IHRydWUgfSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHVwZGF0ZWQgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaWRNYXRjaCAmJiByZXEubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBEZXN0aW5hdGlvbiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvRGVzdGluYXRpb24nKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gaWRNYXRjaFsxXTtcbiAgICAgICAgICAgIGF3YWl0IERlc3RpbmF0aW9uLmZpbmRCeUlkQW5kRGVsZXRlKGlkKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FpL2dlbmVyYXRlLXRleHQnICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgLy8gU3R1YiBBSSBnZW5lcmF0aW9uIGZvciBub3dcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCB7IHByb21wdCB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBgR2VuZXJhdGVkIGNvbnRlbnQgZm9yIHByb21wdDogXCIke3Byb21wdCB8fCAnJ31cIi4uLlxcblxcbkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIFNlZCBkbyBlaXVzbW9kIHRlbXBvciBpbmNpZGlkdW50IHV0IGxhYm9yZSBldCBkb2xvcmUgbWFnbmEgYWxpcXVhLmA7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHRleHQgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ1NlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vIC0tLSBTZXR0aW5ncyBBZG1pbiBBUElzIChhZG1pbiBvbmx5KSAtLS1cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vc2V0dGluZ3MnKSAmJiAhdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vcm9sZXMnKSAmJiAhdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vbm90aWZpY2F0aW9ucy9zZW5kLXRlc3QnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRva2VuID8gdmVyaWZ5Snd0KHRva2VuKSA6IG51bGw7XG4gICAgICAgIGlmICghcGF5bG9hZCB8fCBwYXlsb2FkLnJvbGUgIT09ICdhZG1pbicpIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IH1cbiAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gU2V0dGluZ3Mgc2luZ2xldG9uIGdldC91cGRhdGVcbiAgICAgICAgICBpZiAodXJsID09PSAnL2FwaS9hZG1pbi9zZXR0aW5ncycgJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogU2V0dGluZ3MgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1NldHRpbmdzJyk7XG4gICAgICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBTZXR0aW5ncy5maW5kT25lKHt9KS5sZWFuKCk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IGRvYyB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FkbWluL3NldHRpbmdzJyAmJiByZXEubWV0aG9kID09PSAnUFVUJykge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBTZXR0aW5ncyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvU2V0dGluZ3MnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBsZXQgZG9jID0gYXdhaXQgU2V0dGluZ3MuZmluZE9uZSh7fSk7XG4gICAgICAgICAgICBpZiAoIWRvYykgZG9jID0gbmV3IChhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9TZXR0aW5ncycpKS5kZWZhdWx0KCk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGRvYywgYm9keSk7XG4gICAgICAgICAgICBhd2FpdCBkb2Muc2F2ZSgpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBkb2MgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSb2xlcyBDUlVEXG4gICAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvYWRtaW4vcm9sZXMnICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFJvbGUgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1JvbGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBSb2xlLmZpbmQoe30pLmxlYW4oKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogcm93cyB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FkbWluL3JvbGVzJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogUm9sZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvUm9sZScpO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCBSb2xlLmNyZWF0ZShib2R5KTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMTsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogY3JlYXRlZCB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHJvbGVNYXRjaCA9IHVybC5tYXRjaCgvXlxcL2FwaVxcL2FkbWluXFwvcm9sZXNcXC8oW14vXSspJC8pO1xuICAgICAgICAgIGlmIChyb2xlTWF0Y2ggJiYgcmVxLm1ldGhvZCA9PT0gJ1BVVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogUm9sZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvUm9sZScpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSByb2xlTWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IGxldCBiPScnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMpOyByZXEub24oJ2VuZCcsKCk9PnsgdHJ5eyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7IH0gfSk7IHJlcS5vbignZXJyb3InLHJlamVjdCk7IH0pO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IFJvbGUuZmluZEJ5SWRBbmRVcGRhdGUoaWQsIGJvZHksIHsgbmV3OiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB1cGRhdGVkIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJvbGVNYXRjaCAmJiByZXEubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBSb2xlIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Sb2xlJyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHJvbGVNYXRjaFsxXTtcbiAgICAgICAgICAgIGF3YWl0IFJvbGUuZmluZEJ5SWRBbmREZWxldGUoaWQpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gTm90aWZpY2F0aW9uczogc2VuZCB0ZXN0IGVtYWlsIChzdHViKVxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYXBpL2FkbWluL25vdGlmaWNhdGlvbnMvc2VuZC10ZXN0JyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgbWVzc2FnZTogJ1Rlc3QgZW1haWwgc2VudCAoc3R1YiknIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTZXJ2ZXIgZXJyb3InIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyAtLS0gVXNlciBNYW5hZ2VtZW50IENlbnRlciBBUElzIChhZG1pbiwgc3RhZmYgZm9yIHJlYWQ7IGFkbWluIGZvciB3cml0ZSkgLS0tXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8ICcnO1xuICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL3VzZXJzJykpIHJldHVybiBuZXh0KCk7XG4gICAgICAgIGNvbnN0IHsgcGFyc2UgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XG4gICAgICAgIGNvbnN0IHsgdmVyaWZ5Snd0IH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2xpYi9hdXRoL2p3dC5qcycpO1xuICAgICAgICBjb25zdCBjb29raWVzID0gcGFyc2UocmVxLmhlYWRlcnMuY29va2llIHx8ICcnKTtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBjb29raWVzWydhdXRoX3Rva2VuJ107XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB0b2tlbiA/IHZlcmlmeUp3dCh0b2tlbikgOiBudWxsO1xuICAgICAgICBpZiAoIXBheWxvYWQpIHsgcmVzLnN0YXR1c0NvZGU9NDAxOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J1VuYXV0aG9yaXplZCd9KSk7IH1cbiAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgIGNvbnN0IGlzQWRtaW4gPSBwYXlsb2FkLnJvbGUgPT09ICdhZG1pbic7XG4gICAgICAgIGNvbnN0IGlzU3RhZmYgPSBbJ2FkbWluJywnc3RhZmYnXS5pbmNsdWRlcyhwYXlsb2FkLnJvbGUpO1xuXG4gICAgICAgIGNvbnN0IGZ1bGwgPSBuZXcgVVJMKChyZXEgYXMgYW55KS5vcmlnaW5hbFVybCB8fCB1cmwsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gUEhBU0UgMTogV29ya2hvcnNlIGFnZ3JlZ2F0aW9uIGVuZHBvaW50XG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdHRVQnICYmICh1cmwgPT09ICcvYXBpL2FkbWluL3VzZXJzJyB8fCB1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi91c2Vycz8nKSkpIHtcbiAgICAgICAgICAgIGlmICghaXNTdGFmZikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICAgICAgY29uc3QgcGFnZSA9IE1hdGgubWF4KDEsIHBhcnNlSW50KGZ1bGwuc2VhcmNoUGFyYW1zLmdldCgncGFnZScpIHx8ICcxJywgMTApKTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oMTAwLCBNYXRoLm1heCgxLCBwYXJzZUludChmdWxsLnNlYXJjaFBhcmFtcy5nZXQoJ2xpbWl0JykgfHwgJzE1JywgMTApKSk7XG4gICAgICAgICAgICBjb25zdCByb2xlID0gZnVsbC5zZWFyY2hQYXJhbXMuZ2V0KCdyb2xlJykgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBmdWxsLnNlYXJjaFBhcmFtcy5nZXQoJ3N0YXR1cycpIHx8ICcnO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoID0gKGZ1bGwuc2VhcmNoUGFyYW1zLmdldCgnc2VhcmNoJykgfHwgJycpLnRyaW0oKTtcblxuICAgICAgICAgICAgY29uc3QgbWF0Y2g6IGFueSA9IHt9O1xuICAgICAgICAgICAgaWYgKHJvbGUgPT09ICd1c2VyJykgbWF0Y2gucm9sZSA9ICd1c2VyJztcbiAgICAgICAgICAgIGVsc2UgaWYgKHJvbGUgPT09ICdwYXJ0bmVyJykgbWF0Y2gucm9sZSA9ICdwYXJ0bmVyJztcbiAgICAgICAgICAgIGVsc2UgaWYgKHJvbGUgPT09ICdzdGFmZicpIG1hdGNoLnJvbGUgPSB7ICRpbjogWydzdGFmZicsJ2FkbWluJ10gfTtcbiAgICAgICAgICAgIGlmIChzdGF0dXMpIG1hdGNoLnN0YXR1cyA9IHN0YXR1cztcblxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoU3RhZ2UgPSBzZWFyY2ggPyBbeyAkbWF0Y2g6IHsgJG9yOiBbXG4gICAgICAgICAgICAgIHsgbmFtZTogeyAkcmVnZXg6IHNlYXJjaCwgJG9wdGlvbnM6ICdpJyB9IH0sXG4gICAgICAgICAgICAgIHsgZW1haWw6IHsgJHJlZ2V4OiBzZWFyY2gsICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgICAgICAgXSB9IH1dIDogW107XG5cbiAgICAgICAgICAgIGNvbnN0IHBpcGVsaW5lOiBhbnlbXSA9IFtcbiAgICAgICAgICAgICAgeyAkbWF0Y2g6IG1hdGNoIH0sXG4gICAgICAgICAgICAgIC4uLnNlYXJjaFN0YWdlLFxuICAgICAgICAgICAgICB7ICRsb29rdXA6IHsgZnJvbTogJ2Jvb2tpbmdzJywgbG9jYWxGaWVsZDogJ19pZCcsIGZvcmVpZ25GaWVsZDogJ3VzZXInLCBhczogJ2Jvb2tpbmdzJyB9IH0sXG4gICAgICAgICAgICAgIHsgJGxvb2t1cDogeyBmcm9tOiAndG91cnMnLCBsb2NhbEZpZWxkOiAnX2lkJywgZm9yZWlnbkZpZWxkOiAnb3duZXInLCBhczogJ3RvdXJzJyB9IH0sXG4gICAgICAgICAgICAgIHsgJGFkZEZpZWxkczoge1xuICAgICAgICAgICAgICAgIHRvdGFsQm9va2luZ3M6IHsgJHNpemU6ICckYm9va2luZ3MnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxTcGVuZDogeyAkc3VtOiAnJGJvb2tpbmdzLnRvdGFsUHJpY2UnIH0sXG4gICAgICAgICAgICAgICAgdG91ckNvdW50OiB7ICRzaXplOiAnJHRvdXJzJyB9LFxuICAgICAgICAgICAgICAgIGF2Z1JhdGluZzogeyAkbGl0ZXJhbDogMCB9XG4gICAgICAgICAgICAgIH0gfSxcbiAgICAgICAgICAgICAgeyAkcHJvamVjdDogeyBwYXNzd29yZDogMCwgYm9va2luZ3M6IDAsIHRvdXJzOiAwIH0gfSxcbiAgICAgICAgICAgICAgeyAkc29ydDogeyBjcmVhdGVkQXQ6IC0xIH0gfSxcbiAgICAgICAgICAgICAgeyAkZmFjZXQ6IHtcbiAgICAgICAgICAgICAgICB1c2VyczogWyB7ICRza2lwOiAocGFnZSAtIDEpICogbGltaXQgfSwgeyAkbGltaXQ6IGxpbWl0IH0gXSxcbiAgICAgICAgICAgICAgICB0b3RhbDogWyB7ICRjb3VudDogJ2NvdW50JyB9IF1cbiAgICAgICAgICAgICAgfSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBjb25zdCBtb25nb29zZU1vZCA9IGF3YWl0IGltcG9ydCgnbW9uZ29vc2UnKTtcbiAgICAgICAgICAgIGNvbnN0IGFnZyA9IGF3YWl0IG1vbmdvb3NlTW9kLmRlZmF1bHQuY29ubmVjdGlvbi5jb2xsZWN0aW9uKCd1c2VycycpLmFnZ3JlZ2F0ZShwaXBlbGluZSkudG9BcnJheSgpO1xuICAgICAgICAgICAgY29uc3QgdXNlcnMgPSBhZ2dbMF0/LnVzZXJzIHx8IFtdO1xuICAgICAgICAgICAgY29uc3QgdG90YWxVc2VycyA9IGFnZ1swXT8udG90YWw/LlswXT8uY291bnQgfHwgMDtcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLm1heCgxLCBNYXRoLmNlaWwodG90YWxVc2VycyAvIGxpbWl0KSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiB7IHVzZXJzLCBwYWdpbmF0aW9uOiB7IGN1cnJlbnRQYWdlOiBwYWdlLCB0b3RhbFBhZ2VzLCB0b3RhbFVzZXJzIH0gfSB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWxpYXM6IFBPU1QgL2FwaS9hZG1pbi9zdGFmZiAtPiBleGlzdGluZyBjcmVhdGUgc3RhZmZcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnICYmIHVybCA9PT0gJy9hcGkvYWRtaW4vc3RhZmYnKSB7XG4gICAgICAgICAgICBpZiAoIWlzQWRtaW4pIHsgcmVzLnN0YXR1c0NvZGU9NDAzOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCB7IG5hbWUsIGVtYWlsLCBwYXNzd29yZCwgcm9sZSB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIXBhc3N3b3JkKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidBbGwgZmllbGRzIGFyZSByZXF1aXJlZCcgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFVzZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWw6IFN0cmluZyhlbWFpbCkudG9Mb3dlckNhc2UoKSB9KTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZykgeyByZXMuc3RhdHVzQ29kZT00MDk7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVXNlciBhbHJlYWR5IGV4aXN0cycgfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5jcmVhdGUoeyBuYW1lOiBuYW1lLnRyaW0oKSwgZW1haWw6IFN0cmluZyhlbWFpbCkudG9Mb3dlckNhc2UoKSwgcGFzc3dvcmQsIHJvbGU6IHJvbGUgPT09ICdhZG1pbicgPyAnYWRtaW4nIDogJ3N0YWZmJywgc3RhdHVzOiAnYWN0aXZlJyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHNhZmUgPSB1c2VyLnRvT2JqZWN0KCk7IGRlbGV0ZSAoc2FmZSBhcyBhbnkpLnBhc3N3b3JkO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAxOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBzYWZlIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBQSEFTRSAyOiBBY3Rpb24tb3JpZW50ZWQgQ1JVRCBBUElzXG4gICAgICAgICAgLy8gUFVUIC9hcGkvYWRtaW4vdXNlcnMvOmlkXG4gICAgICAgICAgY29uc3QgdXNlcklkUHV0ID0gdXJsLm1hdGNoKC9eXFwvYXBpXFwvYWRtaW5cXC91c2Vyc1xcLyhbXi9dKykkLyk7XG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdQVVQnICYmIHVzZXJJZFB1dCkge1xuICAgICAgICAgICAgaWYgKCFpc0FkbWluKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nfSkpOyB9XG4gICAgICAgICAgICBjb25zdCBpZCA9IHVzZXJJZFB1dFsxXTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCBhbGxvd2VkOiBhbnkgPSB7fTtcbiAgICAgICAgICAgIGlmIChib2R5Lm5hbWUgIT09IHVuZGVmaW5lZCkgYWxsb3dlZC5uYW1lID0gYm9keS5uYW1lO1xuICAgICAgICAgICAgaWYgKGJvZHkuZW1haWwgIT09IHVuZGVmaW5lZCkgYWxsb3dlZC5lbWFpbCA9IFN0cmluZyhib2R5LmVtYWlsKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGJvZHkucm9sZSAhPT0gdW5kZWZpbmVkKSBhbGxvd2VkLnJvbGUgPSBib2R5LnJvbGU7XG4gICAgICAgICAgICBpZiAoYm9keS5zdGF0dXMgIT09IHVuZGVmaW5lZCkgYWxsb3dlZC5zdGF0dXMgPSBib2R5LnN0YXR1cztcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogVXNlciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvVXNlcicpO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IFVzZXIuZmluZEJ5SWRBbmRVcGRhdGUoaWQsIGFsbG93ZWQsIHsgbmV3OiB0cnVlIH0pLmxlYW4oKTtcbiAgICAgICAgICAgIGlmICghdXBkYXRlZCkgeyByZXMuc3RhdHVzQ29kZT00MDQ7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVXNlciBub3QgZm91bmQnIH0pKTsgfVxuICAgICAgICAgICAgY29uc3Qgc2FmZSA9IHVwZGF0ZWQgYXMgYW55OyBkZWxldGUgc2FmZS5wYXNzd29yZDtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSwgZGF0YTogc2FmZSB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUFVUIC9hcGkvYWRtaW4vdXNlcnMvOmlkL3N0YXR1c1xuICAgICAgICAgIGNvbnN0IHVzZXJTdGF0dXNNYXRjaCA9IHVybC5tYXRjaCgvXlxcL2FwaVxcL2FkbWluXFwvdXNlcnNcXC8oW14vXSspXFwvc3RhdHVzJC8pO1xuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnUFVUJyAmJiB1c2VyU3RhdHVzTWF0Y2gpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICAgICAgY29uc3QgaWQgPSB1c2VyU3RhdHVzTWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IGxldCBiPScnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMpOyByZXEub24oJ2VuZCcsKCk9PnsgdHJ5eyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7IH0gfSk7IHJlcS5vbignZXJyb3InLHJlamVjdCk7IH0pO1xuICAgICAgICAgICAgY29uc3QgeyBzdGF0dXMgfSA9IGJvZHkgfHwge307XG4gICAgICAgICAgICBpZiAoIVsnYWN0aXZlJywnc3VzcGVuZGVkJywncGVuZGluZ19hcHByb3ZhbCddLmluY2x1ZGVzKHN0YXR1cykpIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ludmFsaWQgc3RhdHVzJ30pKTsgfVxuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBVc2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9Vc2VyJyk7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgVXNlci5maW5kQnlJZEFuZFVwZGF0ZShpZCwgeyBzdGF0dXMgfSwgeyBuZXc6IHRydWUgfSkubGVhbigpO1xuICAgICAgICAgICAgaWYgKCF1cGRhdGVkKSB7IHJlcy5zdGF0dXNDb2RlPTQwNDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidVc2VyIG5vdCBmb3VuZCd9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHNhZmUgPSB1cGRhdGVkIGFzIGFueTsgZGVsZXRlIHNhZmUucGFzc3dvcmQ7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHNhZmUgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFBVVCAvYXBpL2FkbWluL3VzZXJzLzppZC9yb2xlXG4gICAgICAgICAgY29uc3QgdXNlclJvbGVNYXRjaCA9IHVybC5tYXRjaCgvXlxcL2FwaVxcL2FkbWluXFwvdXNlcnNcXC8oW14vXSspXFwvcm9sZSQvKTtcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BVVCcgJiYgdXNlclJvbGVNYXRjaCkge1xuICAgICAgICAgICAgaWYgKCFpc0FkbWluKSB7IHJlcy5zdGF0dXNDb2RlPTQwMzsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidGb3JiaWRkZW4nfSkpOyB9XG4gICAgICAgICAgICBjb25zdCBpZCA9IHVzZXJSb2xlTWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IGxldCBiPScnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMpOyByZXEub24oJ2VuZCcsKCk9PnsgdHJ5eyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7IH0gfSk7IHJlcS5vbignZXJyb3InLHJlamVjdCk7IH0pO1xuICAgICAgICAgICAgY29uc3QgeyByb2xlIH0gPSBib2R5IHx8IHt9O1xuICAgICAgICAgICAgaWYgKCFbJ3VzZXInLCdwYXJ0bmVyJywnc3RhZmYnLCdhZG1pbiddLmluY2x1ZGVzKHJvbGUpKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidJbnZhbGlkIHJvbGUnfSkpOyB9XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFVzZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBhd2FpdCBVc2VyLmZpbmRCeUlkQW5kVXBkYXRlKGlkLCB7IHJvbGUgfSwgeyBuZXc6IHRydWUgfSkubGVhbigpO1xuICAgICAgICAgICAgaWYgKCF1cGRhdGVkKSB7IHJlcy5zdGF0dXNDb2RlPTQwNDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidVc2VyIG5vdCBmb3VuZCd9KSk7IH1cbiAgICAgICAgICAgIGNvbnN0IHNhZmUgPSB1cGRhdGVkIGFzIGFueTsgZGVsZXRlIHNhZmUucGFzc3dvcmQ7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHNhZmUgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERFTEVURSAvYXBpL2FkbWluL3VzZXJzLzppZFxuICAgICAgICAgIGNvbnN0IHVzZXJJZERlbCA9IHVybC5tYXRjaCgvXlxcL2FwaVxcL2FkbWluXFwvdXNlcnNcXC8oW14vXSspJC8pO1xuICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJyAmJiB1c2VySWREZWwpIHtcbiAgICAgICAgICAgIGlmICghaXNBZG1pbikgeyByZXMuc3RhdHVzQ29kZT00MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICAgICAgY29uc3QgaWQgPSB1c2VySWREZWxbMV07XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFVzZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZWQgPSBhd2FpdCBVc2VyLmZpbmRCeUlkQW5kRGVsZXRlKGlkKTtcbiAgICAgICAgICAgIGlmICghZGVsZXRlZCkgeyByZXMuc3RhdHVzQ29kZT00MDQ7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVXNlciBub3QgZm91bmQnIH0pKTsgfVxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTUwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTZXJ2ZXIgZXJyb3InIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyAtLS0gTW9kZXJhdGlvbiBBUElzIChhZG1pbiwgc3RhZmYpIC0tLVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCAnJztcbiAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aCgnL2FwaS9hZG1pbi9yZXZpZXdzJykgJiYgIXVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL3N0b3JpZXMnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgaWYgKCF0b2tlbikgeyByZXMuc3RhdHVzQ29kZSA9IDQwMTsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidVbmF1dGhvcml6ZWQnfSkpOyB9XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJpZnlKd3QodG9rZW4pO1xuICAgICAgICBpZiAoIXBheWxvYWQgfHwgIVsnYWRtaW4nLCdzdGFmZiddLmluY2x1ZGVzKHBheWxvYWQucm9sZSkpIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDM7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBHRVQgcXVldWVzXG4gICAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcgJiYgdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vcmV2aWV3cycpKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFJldmlldyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvUmV2aWV3Jyk7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFVzZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1VzZXInKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogVG91ciB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvVG91cicpO1xuICAgICAgICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gdS5zZWFyY2hQYXJhbXMuZ2V0KCdzdGF0dXMnKSB8fCAncGVuZGluZyc7XG4gICAgICAgICAgICBjb25zdCBwYWdlID0gTnVtYmVyKHUuc2VhcmNoUGFyYW1zLmdldCgncGFnZScpIHx8ICcxJyk7XG4gICAgICAgICAgICBjb25zdCBsaW1pdCA9IE51bWJlcih1LnNlYXJjaFBhcmFtcy5nZXQoJ2xpbWl0JykgfHwgJzIwJyk7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgUmV2aWV3LmZpbmQoeyBzdGF0dXMgfSlcbiAgICAgICAgICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXG4gICAgICAgICAgICAgIC5za2lwKChwYWdlLTEpKmxpbWl0KVxuICAgICAgICAgICAgICAubGltaXQobGltaXQpXG4gICAgICAgICAgICAgIC5wb3B1bGF0ZSgndXNlcicsICduYW1lIGF2YXRhciBjb250cmlidXRpb25TY29yZScpXG4gICAgICAgICAgICAgIC5wb3B1bGF0ZSgndG91cicsICd0aXRsZScpXG4gICAgICAgICAgICAgIC5sZWFuKCk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IGRvY3MsIHRvdGFsOiBkb2NzLmxlbmd0aCB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdHRVQnICYmIHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL3N0b3JpZXMnKSkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBTdG9yeSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvU3RvcnknKTtcbiAgICAgICAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHUuc2VhcmNoUGFyYW1zLmdldCgnc3RhdHVzJykgfHwgJ3BlbmRpbmcnO1xuICAgICAgICAgICAgY29uc3QgcGFnZSA9IE51bWJlcih1LnNlYXJjaFBhcmFtcy5nZXQoJ3BhZ2UnKSB8fCAnMScpO1xuICAgICAgICAgICAgY29uc3QgbGltaXQgPSBOdW1iZXIodS5zZWFyY2hQYXJhbXMuZ2V0KCdsaW1pdCcpIHx8ICcyMCcpO1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IFN0b3J5LmZpbmQoeyBzdGF0dXMgfSlcbiAgICAgICAgICAgICAgLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pXG4gICAgICAgICAgICAgIC5za2lwKChwYWdlLTEpKmxpbWl0KVxuICAgICAgICAgICAgICAubGltaXQobGltaXQpXG4gICAgICAgICAgICAgIC5wb3B1bGF0ZSgnYXV0aG9yJywgJ25hbWUgYXZhdGFyIGNvbnRyaWJ1dGlvblNjb3JlJylcbiAgICAgICAgICAgICAgLnBvcHVsYXRlKCdkZXN0aW5hdGlvbicsICduYW1lIHNsdWcnKVxuICAgICAgICAgICAgICAubGVhbigpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBkb2NzLCB0b3RhbDogZG9jcy5sZW5ndGggfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBCVUxLIFVQREFURVxuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdQVVQnICYmIHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL3Jldmlld3MvYnVsay11cGRhdGUnKSkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBSZXZpZXcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1JldmlldycpO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHsgYWN0aW9uLCBpZHMsIHJlYXNvbiB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpZHMpIHx8ICFpZHMubGVuZ3RoKSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidpZHMgcmVxdWlyZWQnfSkpOyB9XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnYXBwcm92ZScpIHtcbiAgICAgICAgICAgICAgYXdhaXQgUmV2aWV3LnVwZGF0ZU1hbnkoeyBfaWQ6IHsgJGluOiBpZHMgfSB9LCB7ICRzZXQ6IHsgc3RhdHVzOiAnYXBwcm92ZWQnLCByZWplY3Rpb25SZWFzb246IHVuZGVmaW5lZCB9IH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdyZWplY3QnKSB7XG4gICAgICAgICAgICAgIGF3YWl0IFJldmlldy51cGRhdGVNYW55KHsgX2lkOiB7ICRpbjogaWRzIH0gfSwgeyAkc2V0OiB7IHN0YXR1czogJ3JlamVjdGVkJywgcmVqZWN0aW9uUmVhc29uOiByZWFzb24gfHwgJycgfSB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7IHJlcy5zdGF0dXNDb2RlPTQwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidJbnZhbGlkIGFjdGlvbid9KSk7IH1cbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlPTIwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6dHJ1ZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdQVVQnICYmIHVybC5zdGFydHNXaXRoKCcvYXBpL2FkbWluL3N0b3JpZXMvYnVsay11cGRhdGUnKSkge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBTdG9yeSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvU3RvcnknKTtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHsgbGV0IGI9Jyc7IHJlcS5vbignZGF0YScsKGM6YW55KT0+Yis9Yyk7IHJlcS5vbignZW5kJywoKT0+eyB0cnl7IHJlc29sdmUoSlNPTi5wYXJzZShifHwne30nKSk7IH0gY2F0Y2goZSl7IHJlamVjdChlKTsgfSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTsgfSk7XG4gICAgICAgICAgICBjb25zdCB7IGFjdGlvbiwgaWRzLCByZWFzb24gfSA9IGJvZHkgfHwge307XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaWRzKSB8fCAhaWRzLmxlbmd0aCkgeyByZXMuc3RhdHVzQ29kZT00MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonaWRzIHJlcXVpcmVkJ30pKTsgfVxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2FwcHJvdmUnKSB7XG4gICAgICAgICAgICAgIGF3YWl0IFN0b3J5LnVwZGF0ZU1hbnkoeyBfaWQ6IHsgJGluOiBpZHMgfSB9LCB7ICRzZXQ6IHsgc3RhdHVzOiAnYXBwcm92ZWQnLCByZWplY3Rpb25SZWFzb246IHVuZGVmaW5lZCB9IH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdyZWplY3QnKSB7XG4gICAgICAgICAgICAgIGF3YWl0IFN0b3J5LnVwZGF0ZU1hbnkoeyBfaWQ6IHsgJGluOiBpZHMgfSB9LCB7ICRzZXQ6IHsgc3RhdHVzOiAncmVqZWN0ZWQnLCByZWplY3Rpb25SZWFzb246IHJlYXNvbiB8fCAnJyB9IH0pO1xuICAgICAgICAgICAgfSBlbHNlIHsgcmVzLnN0YXR1c0NvZGU9NDAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ludmFsaWQgYWN0aW9uJ30pKTsgfVxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gU0lOR0xFIEVESVQgJiBBUFBST1ZFXG4gICAgICAgICAgY29uc3QgcmV2aWV3TWF0Y2ggPSB1cmwubWF0Y2goL15cXC9hcGlcXC9hZG1pblxcL3Jldmlld3NcXC8oW14vXSspJC8pO1xuICAgICAgICAgIGlmIChtZXRob2QgPT09ICdQVVQnICYmIHJldmlld01hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFJldmlldyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvUmV2aWV3Jyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHJldmlld01hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHsgY29udGVudCwgYWN0aW9uIH0gPSBib2R5IHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlOiBhbnkgPSB7IH07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB1cGRhdGUuY29tbWVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnYXBwcm92ZScpIHVwZGF0ZS5zdGF0dXMgPSAnYXBwcm92ZWQnO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgUmV2aWV3LmZpbmRCeUlkQW5kVXBkYXRlKGlkLCB1cGRhdGUsIHsgbmV3OiB0cnVlIH0pO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGU9MjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2Vzczp0cnVlLCBkYXRhOiBkb2MgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzdG9yeU1hdGNoID0gdXJsLm1hdGNoKC9eXFwvYXBpXFwvYWRtaW5cXC9zdG9yaWVzXFwvKFteL10rKSQvKTtcbiAgICAgICAgICBpZiAobWV0aG9kID09PSAnUFVUJyAmJiBzdG9yeU1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFN0b3J5IH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL21vZGVscy9TdG9yeScpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBzdG9yeU1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4geyBsZXQgYj0nJzsgcmVxLm9uKCdkYXRhJywoYzphbnkpPT5iKz1jKTsgcmVxLm9uKCdlbmQnLCgpPT57IHRyeXsgcmVzb2x2ZShKU09OLnBhcnNlKGJ8fCd7fScpKTsgfSBjYXRjaChlKXsgcmVqZWN0KGUpOyB9IH0pOyByZXEub24oJ2Vycm9yJyxyZWplY3QpOyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHsgY29udGVudCwgYWN0aW9uLCB0aXRsZSB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZTogYW55ID0ge307XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRpdGxlID09PSAnc3RyaW5nJykgdXBkYXRlLnRpdGxlID0gdGl0bGU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB1cGRhdGUuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnYXBwcm92ZScpIHVwZGF0ZS5zdGF0dXMgPSAnYXBwcm92ZWQnO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgU3RvcnkuZmluZEJ5SWRBbmRVcGRhdGUoaWQsIHVwZGF0ZSwgeyBuZXc6IHRydWUgfSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZT0yMDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IGRvYyB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7IHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyAtLS0gQWRtaW4gVG91cnMgQVBJcyAoYWRtaW4sIHN0YWZmKSAtLS1cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJy9hcGkvYWRtaW4vdG91cnMnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZSBhdXRoZW50aWNhdGlvbiBmb3IgdGVzdGluZ1xuICAgICAgICAgIC8vIGNvbnN0IHsgcGFyc2UgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XG4gICAgICAgICAgLy8gY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgICAgLy8gY29uc3QgY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyk7XG4gICAgICAgICAgLy8gY29uc3QgdG9rZW4gPSBjb29raWVzWydhdXRoX3Rva2VuJ107XG4gICAgICAgICAgLy8gaWYgKCF0b2tlbikgeyBcbiAgICAgICAgICAvLyAgIHJlcy5zdGF0dXNDb2RlID0gNDAxOyBcbiAgICAgICAgICAvLyAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTsgXG4gICAgICAgICAgLy8gICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOidVbmF1dGhvcml6ZWQnfSkpOyBcbiAgICAgICAgICAvLyB9XG4gICAgICAgICAgLy8gY29uc3QgcGF5bG9hZCA9IHZlcmlmeUp3dCh0b2tlbik7XG4gICAgICAgICAgLy8gaWYgKCFwYXlsb2FkIHx8ICFbJ2FkbWluJywnc3RhZmYnXS5pbmNsdWRlcyhwYXlsb2FkLnJvbGUpKSB7IFxuICAgICAgICAgIC8vICAgcmVzLnN0YXR1c0NvZGUgPSA0MDM7IFxuICAgICAgICAgIC8vICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpOyBcbiAgICAgICAgICAvLyAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IFxuICAgICAgICAgIC8vIH1cbiAgICAgICAgICBcbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBJbXBvcnQgdGhlIHRvdXJzIGhhbmRsZXIgZHluYW1pY2FsbHlcbiAgICAgICAgICBjb25zdCB0b3Vyc0hhbmRsZXIgPSBhd2FpdCBpbXBvcnQoJy4vc3JjL3BhZ2VzL2FwaS9hZG1pbi90b3Vycy9pbmRleC50cycpO1xuICAgICAgICAgIHJldHVybiB0b3Vyc0hhbmRsZXIuZGVmYXVsdChyZXEsIHJlcyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignVG91cnMgQVBJIEVycm9yOicsIGVycik7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7IFxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6ZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gR0VUIC9hcGkvYWRtaW4vdXNlcnMvcGVuZGluZy1wYXJ0bmVycyAoYWRtaW4sIHN0YWZmKVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hZG1pbi91c2Vycy9wZW5kaW5nLXBhcnRuZXJzJywgYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ0dFVCcpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IHBhcnNlIH0gPSBhd2FpdCBpbXBvcnQoJ2Nvb2tpZScpO1xuICAgICAgICAgIGNvbnN0IHsgdmVyaWZ5Snd0IH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2xpYi9hdXRoL2p3dC5qcycpO1xuICAgICAgICAgIGNvbnN0IGNvb2tpZXMgPSBwYXJzZShyZXEuaGVhZGVycy5jb29raWUgfHwgJycpO1xuICAgICAgICAgIGNvbnN0IHRva2VuID0gY29va2llc1snYXV0aF90b2tlbiddO1xuICAgICAgICAgIGlmICghdG9rZW4pIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDE7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J1VuYXV0aG9yaXplZCd9KSk7IH1cbiAgICAgICAgICBjb25zdCBwYXlsb2FkID0gdmVyaWZ5Snd0KHRva2VuKTtcbiAgICAgICAgICBpZiAoIXBheWxvYWQgfHwgIVsnYWRtaW4nLCdzdGFmZiddLmluY2x1ZGVzKHBheWxvYWQucm9sZSkpIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDM7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IH1cbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgVXNlci5maW5kKHsgc3RhdHVzOiAncGVuZGluZ19hcHByb3ZhbCcgfSkuc2VsZWN0KCctcGFzc3dvcmQnKS5sZWFuKCk7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IGRvY3MgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTZXJ2ZXIgZXJyb3InIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFBPU1QgL2FwaS9hZG1pbi91c2Vycy9zdGFmZiAoYWRtaW4gb25seSlcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWRtaW4vdXNlcnMvc3RhZmYnLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgeyByZXMuc3RhdHVzQ29kZSA9IDQwNTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonTWV0aG9kIE5vdCBBbGxvd2VkJ30pKTsgfVxuICAgICAgICAgIGNvbnN0IHsgcGFyc2UgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XG4gICAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgICAgY29uc3QgY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyk7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBjb29raWVzWydhdXRoX3Rva2VuJ107XG4gICAgICAgICAgaWYgKCF0b2tlbikgeyByZXMuc3RhdHVzQ29kZSA9IDQwMTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVW5hdXRob3JpemVkJ30pKTsgfVxuICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJpZnlKd3QodG9rZW4pO1xuICAgICAgICAgIGlmICghcGF5bG9hZCB8fCBwYXlsb2FkLnJvbGUgIT09ICdhZG1pbicpIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDM7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J0ZvcmJpZGRlbid9KSk7IH1cblxuICAgICAgICAgIC8vIHBhcnNlIGJvZHlcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgYiA9ICcnOyByZXEub24oJ2RhdGEnLChjOmFueSk9PmIrPWMudG9TdHJpbmcoKSk7IHJlcS5vbignZW5kJywoKT0+eyB0cnkgeyByZXNvbHZlKEpTT04ucGFyc2UoYnx8J3t9JykpOyB9IGNhdGNoKGUpeyByZWplY3QoZSk7fSB9KTsgcmVxLm9uKCdlcnJvcicscmVqZWN0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCB7IG5hbWUsIGVtYWlsLCBwYXNzd29yZCB9ID0gYm9keSB8fCB7fTtcbiAgICAgICAgICBpZiAoIW5hbWUgfHwgIWVtYWlsIHx8ICFwYXNzd29yZCkgeyByZXMuc3RhdHVzQ29kZSA9IDQwMDsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonQWxsIGZpZWxkcyBhcmUgcmVxdWlyZWQnIH0pKTsgfVxuXG4gICAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyBlbWFpbDogU3RyaW5nKGVtYWlsKS50b0xvd2VyQ2FzZSgpIH0pO1xuICAgICAgICAgIGlmIChleGlzdGluZykgeyByZXMuc3RhdHVzQ29kZSA9IDQwOTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVXNlciBhbHJlYWR5IGV4aXN0cycgfSkpOyB9XG4gICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuY3JlYXRlKHsgbmFtZTogbmFtZS50cmltKCksIGVtYWlsOiBTdHJpbmcoZW1haWwpLnRvTG93ZXJDYXNlKCksIHBhc3N3b3JkLCByb2xlOiAnc3RhZmYnLCBzdGF0dXM6ICdhY3RpdmUnIH0pO1xuICAgICAgICAgIGNvbnN0IHNhZmUgPSB1c2VyLnRvT2JqZWN0KCk7IGRlbGV0ZSAoc2FmZSBhcyBhbnkpLnBhc3N3b3JkO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAxOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHNhZmUgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ1NlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUFVUIC9hcGkvYWRtaW4vdXNlcnMvOnVzZXJJZC9hcHByb3ZlLXBhcnRuZXIgKGFkbWluLCBzdGFmZilcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gdXJsLm1hdGNoKC9eXFwvYXBpXFwvYWRtaW5cXC91c2Vyc1xcLyhbXi9dKylcXC9hcHByb3ZlLXBhcnRuZXIkLyk7XG4gICAgICAgIGlmICghbWF0Y2gpIHJldHVybiBuZXh0KCk7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUFVUJykgeyByZXMuc3RhdHVzQ29kZSA9IDQwNTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonTWV0aG9kIE5vdCBBbGxvd2VkJ30pKTsgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgcGFyc2UgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XG4gICAgICAgICAgY29uc3QgeyB2ZXJpZnlKd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgICAgY29uc3QgY29va2llcyA9IHBhcnNlKHJlcS5oZWFkZXJzLmNvb2tpZSB8fCAnJyk7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBjb29raWVzWydhdXRoX3Rva2VuJ107XG4gICAgICAgICAgaWYgKCF0b2tlbikgeyByZXMuc3RhdHVzQ29kZSA9IDQwMTsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonVW5hdXRob3JpemVkJ30pKTsgfVxuICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJpZnlKd3QodG9rZW4pO1xuICAgICAgICAgIGlmICghcGF5bG9hZCB8fCAhWydhZG1pbicsJ3N0YWZmJ10uaW5jbHVkZXMocGF5bG9hZC5yb2xlKSkgeyByZXMuc3RhdHVzQ29kZSA9IDQwMzsgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjonRm9yYmlkZGVuJ30pKTsgfVxuXG4gICAgICAgICAgY29uc3QgdXNlcklkID0gbWF0Y2hbMV07XG4gICAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuZmluZEJ5SWQodXNlcklkKTtcbiAgICAgICAgICBpZiAoIXVzZXIpIHsgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7IHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczpmYWxzZSwgZXJyb3I6J1VzZXIgbm90IGZvdW5kJ30pKTsgfVxuICAgICAgICAgIHVzZXIucm9sZSA9ICdwYXJ0bmVyJztcbiAgICAgICAgICB1c2VyLnN0YXR1cyA9ICdhY3RpdmUnO1xuICAgICAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgICAgICAgIGNvbnN0IHNhZmUgPSB1c2VyLnRvT2JqZWN0KCk7IGRlbGV0ZSAoc2FmZSBhcyBhbnkpLnBhc3N3b3JkO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOnRydWUsIGRhdGE6IHNhZmUgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwOyByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCdhcHBsaWNhdGlvbi9qc29uJyk7IHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOmZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ1NlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc2VlZCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSByZXR1cm47IC8vIE9ubHkgYWNjZXB0IFBPU1QgcmVxdWVzdHNcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW1ZJVEUgU0VSVkVSXSBQT1NUIC9hcGkvc2VlZCByZWNlaXZlZC4gVHJpZ2dlcmluZyBzZWVkZXIuLi4nKTtcbiAgICAgICAgICBhd2FpdCBzZWVkRGF0YWJhc2UoKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnRGF0YWJhc2Ugc2VlZGVkIHN1Y2Nlc3NmdWxseSEnIH0pKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIFNFUlZFUl0gU2VlZGluZyBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBgU2VlZGluZyBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuLy8gRGV2LW9ubHkgQVBJIGVuZHBvaW50cyBmb3IgaG9tZXBhZ2UgZGF0YVxuZnVuY3Rpb24gaG9tZUFwaVBsdWdpbigpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndml0ZS1wbHVnaW4taG9tZS1hcGknLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IFZpdGVEZXZTZXJ2ZXIpIHtcbiAgICAgIC8vIEdFVCAvYXBpL2hvbWUvZmVhdHVyZWQtZGVzdGluYXRpb25zXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2hvbWUvZmVhdHVyZWQtZGVzdGluYXRpb25zJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xuICAgICAgICAgIC8vIExvZ2ljOiBGZXRjaCB0b3AgNiBkZXN0aW5hdGlvbnMsIHNvcnRlZCBieSBuZXdlc3QgZm9yIG5vd1xuICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9ucyA9IGF3YWl0IERlc3RpbmF0aW9uLmZpbmQoe30pLnNvcnQoeyBjcmVhdGVkQXQ6IC0xIH0pLmxpbWl0KDYpLmxlYW4oKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBGZWF0dXJlZCBEZXN0aW5hdGlvbnMgY291bnQ9JHtkZXN0aW5hdGlvbnMubGVuZ3RofWApO1xuICAgICAgICAgIGlmIChkZXN0aW5hdGlvbnNbMF0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVklURSBBUEldIEZpcnN0IERlc3RpbmF0aW9uOicsIEpTT04uc3RyaW5naWZ5KGRlc3RpbmF0aW9uc1swXSwgbnVsbCwgMikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBkZXN0aW5hdGlvbnMgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJXSBGZWF0dXJlZCBEZXN0aW5hdGlvbnMgRXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCBmZWF0dXJlZCBkZXN0aW5hdGlvbnMnIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEdFVCAvYXBpL2hvbWUvZmVhdHVyZWQtdG91cnNcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvaG9tZS9mZWF0dXJlZC10b3VycycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ0dFVCcpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgICAvLyBMb2dpYzogRmV0Y2ggdG9wIDYgdG91cnMsIHNvcnRlZCBieSBhdmVyYWdlIHJhdGluZ1xuICAgICAgICAgIC8vIENSSVRJQ0FMOiBQb3B1bGF0ZSB0aGUgZGVzdGluYXRpb24gdG8gZ2V0IGl0cyBuYW1lIGZvciBkaXNwbGF5IHB1cnBvc2VzXG4gICAgICAgICAgY29uc3QgdG91cnMgPSBhd2FpdCBUb3VyLmZpbmQoe30pXG4gICAgICAgICAgICAuc29ydCh7IGF2ZXJhZ2VSYXRpbmc6IC0xLCByZXZpZXdDb3VudDogLTEsIGNyZWF0ZWRBdDogLTEgfSlcbiAgICAgICAgICAgIC5saW1pdCg2KVxuICAgICAgICAgICAgLnBvcHVsYXRlKCdkZXN0aW5hdGlvbicsICduYW1lIHNsdWcnKVxuICAgICAgICAgICAgLmxlYW4oKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBGZWF0dXJlZCBUb3VycyBjb3VudD0ke3RvdXJzLmxlbmd0aH1gKTtcbiAgICAgICAgICBpZiAodG91cnNbMF0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVklURSBBUEldIEZpcnN0IFRvdXI6JywgSlNPTi5zdHJpbmdpZnkodG91cnNbMF0sIG51bGwsIDIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdG91cnMgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJXSBGZWF0dXJlZCBUb3VycyBFcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIGZlYXR1cmVkIHRvdXJzJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBHRVQgL2FwaS9kZXN0aW5hdGlvbnMvbG9va3VwP2lkcz1jb21tYSxzZXBhcmF0ZWRcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvZGVzdGluYXRpb25zL2xvb2t1cCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ0dFVCcpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgJycsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgY29uc3QgaWRzUGFyYW0gPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnaWRzJyk7XG4gICAgICAgICAgY29uc3QgaWRzID0gKGlkc1BhcmFtIHx8ICcnKVxuICAgICAgICAgICAgLnNwbGl0KCcsJylcbiAgICAgICAgICAgIC5tYXAoKHMpID0+IHMudHJpbSgpKVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICBpZiAoIWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBbXSB9KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCBEZXN0aW5hdGlvbi5maW5kKHsgX2lkOiB7ICRpbjogaWRzIH0gfSkubGVhbigpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGRvY3MgfSkpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUE9TVCAvYXBpL21lZGlhL3VwbG9hZCAtIFNlbGYtaG9zdGVkIGltYWdlIHVwbG9hZCAoRWFybHkgbWlkZGxld2FyZSBmb3Igc3RyZWFtIGNvbnRyb2wpXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSByZXEub3JpZ2luYWxVcmwgfHwgcmVxLnVybCB8fCAnJztcbiAgICAgICAgY29uc3QgbWV0aG9kID0gcmVxLm1ldGhvZDtcblxuICAgICAgICAvLyBSb3V0ZTogUE9TVCAvYXBpL21lZGlhL3VwbG9hZFxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvbWVkaWEvdXBsb2FkJykgJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FQSSBST1VURVJdIE1hdGNoZWQgUE9TVCAvYXBpL21lZGlhL3VwbG9hZC4gRm9yd2FyZGluZyB0byBoYW5kbGVyLmApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbVklURSBBUEldIENvbnRlbnQtVHlwZTogJHtyZXEuaGVhZGVyc1snY29udGVudC10eXBlJ119YCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtWSVRFIEFQSV0gQ29udGVudC1MZW5ndGg6ICR7cmVxLmhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ119YCk7XG4gICAgICAgICAgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEltcG9ydCB0aGUgbWVkaWEgaGFuZGxlclxuICAgICAgICAgICAgY29uc3QgeyBoYW5kbGVJbWFnZVVwbG9hZCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvYXBpL21lZGlhSGFuZGxlcicpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtWSVRFIEFQSV0gQ2FsbGluZyBoYW5kbGVJbWFnZVVwbG9hZC4uLmApO1xuICAgICAgICAgICAgLy8gVGhlIGBhd2FpdGAgaGVyZSBpcyBpbXBvcnRhbnQgYXMgb3VyIGhhbmRsZXIgbm93IHJldHVybnMgYSBQcm9taXNlXG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVJbWFnZVVwbG9hZChyZXEsIHJlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBoYW5kbGVJbWFnZVVwbG9hZCBjb21wbGV0ZWRgKTtcbiAgICAgICAgICAgIHJldHVybjsgLy8gRG9uJ3QgY2FsbCBuZXh0KCkgLSB3ZSd2ZSBoYW5kbGVkIHRoZSByZXF1ZXN0XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJXSBJbWFnZSB1cGxvYWQgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgIGVycm9yOiAnTFx1MUVEN2kgc2VydmVyLCB2dWkgbFx1MDBGMm5nIHRoXHUxRUVEIGxcdTFFQTFpIHNhdScgXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm47IC8vIERvbid0IGNhbGwgbmV4dCgpIC0gd2UndmUgaGFuZGxlZCB0aGUgcmVxdWVzdFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnRpbnVlIHRvIG5leHQgbWlkZGxld2FyZSBmb3Igb3RoZXIgcm91dGVzXG4gICAgICAgIG5leHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBQT1NUIC9hcGkvc3RvcmllcyAtIENyZWF0ZSBuZXcgc3RvcnlcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc3RvcmllcycsIGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1O1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gSW1wb3J0IHRoZSBzdG9yeSBoYW5kbGVyXG4gICAgICAgICAgY29uc3QgeyBoYW5kbGVDcmVhdGVTdG9yeSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvYXBpL3N0b3J5SGFuZGxlcicpO1xuICAgICAgICAgIGF3YWl0IGhhbmRsZUNyZWF0ZVN0b3J5KHJlcSwgcmVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIEFQSV0gQ3JlYXRlIHN0b3J5IGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgIGVycm9yOiAnTFx1MUVEN2kgc2VydmVyLCB2dWkgbFx1MDBGMm5nIHRoXHUxRUVEIGxcdTFFQTFpIHNhdScgXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gR0VUIC9hcGkvZGVzdGluYXRpb25zL3NlYXJjaD9xPXF1ZXJ5JmxpbWl0PTEwXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2Rlc3RpbmF0aW9ucy9zZWFyY2gnLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1O1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsIHx8ICcnLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3EnKTtcbiAgICAgICAgICBjb25zdCBsaW1pdCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsaW1pdCcpIHx8ICcxMCc7XG4gICAgICAgICAgY29uc3QgbGltaXROdW0gPSBNYXRoLm1pbihwYXJzZUludChsaW1pdCkgfHwgMTAsIDIwKTsgLy8gTWF4IDIwIHJlc3VsdHNcblxuICAgICAgICAgIGlmICghcXVlcnkgfHwgcXVlcnkudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICAgICAgICB0b3RhbDogMFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNlYXJjaFF1ZXJ5ID0gcXVlcnkudHJpbSgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFNlYXJjaCBkZXN0aW5hdGlvbnMgYnkgbmFtZSwgZGVzY3JpcHRpb24sIG9yIGxvY2F0aW9uXG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25zID0gYXdhaXQgRGVzdGluYXRpb24uZmluZCh7XG4gICAgICAgICAgICAkYW5kOiBbXG4gICAgICAgICAgICAgIHsgc3RhdHVzOiAncHVibGlzaGVkJyB9LCAvLyBPbmx5IHB1Ymxpc2hlZCBkZXN0aW5hdGlvbnNcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICRvcjogW1xuICAgICAgICAgICAgICAgICAgeyBuYW1lOiB7ICRyZWdleDogc2VhcmNoUXVlcnksICRvcHRpb25zOiAnaScgfSB9LFxuICAgICAgICAgICAgICAgICAgeyBkZXNjcmlwdGlvbjogeyAkcmVnZXg6IHNlYXJjaFF1ZXJ5LCAkb3B0aW9uczogJ2knIH0gfSxcbiAgICAgICAgICAgICAgICAgIHsgbG9jYXRpb246IHsgJHJlZ2V4OiBzZWFyY2hRdWVyeSwgJG9wdGlvbnM6ICdpJyB9IH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZWxlY3QoJ25hbWUgc2x1ZyBsb2NhdGlvbiBpbWFnZScpXG4gICAgICAgICAgLmxpbWl0KGxpbWl0TnVtKVxuICAgICAgICAgIC5sZWFuKCk7XG5cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgZGF0YTogZGVzdGluYXRpb25zLFxuICAgICAgICAgICAgdG90YWw6IGRlc3RpbmF0aW9ucy5sZW5ndGhcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIEFQSV0gRGVzdGluYXRpb24gc2VhcmNoIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgIGVycm9yOiAnTFx1MUVEN2kgc2VydmVyLCB2dWkgbFx1MDBGMm5nIHRoXHUxRUVEIGxcdTFFQTFpIHNhdScgXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gR0VUIC9hcGkvZGVzdGluYXRpb25zLzpzbHVnIChkeW5hbWljKVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9kZXN0aW5hdGlvbnMvJywgYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIC8vIEF2b2lkIGludGVyY2VwdGluZyB0aGUgbG9va3VwIHJvdXRlIGFib3ZlXG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWwgPSByZXEub3JpZ2luYWxVcmwgfHwgcmVxLnVybCB8fCAnJztcbiAgICAgICAgICBpZiAob3JpZ2luYWwuc3RhcnRzV2l0aCgnL2FwaS9kZXN0aW5hdGlvbnMvbG9va3VwJykpIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgaWYgKG9yaWdpbmFsLnN0YXJ0c1dpdGgoJy9hcGkvZGVzdGluYXRpb25zL3NlYXJjaCcpKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIGNvbnN0IHNsdWcgPSAocmVxLnVybCB8fCAnJykucmVwbGFjZSgvXlxcLz8vLCAnJyk7IC8vIHN0cmlwIGxlYWRpbmcgJy8nXG4gICAgICAgICAgaWYgKCFzbHVnKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIGNvbnN0IHsgaGFuZGxlR2V0RGVzdGluYXRpb25CeVNsdWcgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2FwaS9kZXN0aW5hdGlvbkhhbmRsZXInKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBHRVQgL2FwaS9kZXN0aW5hdGlvbnMvJHtzbHVnfWApO1xuICAgICAgICAgIGF3YWl0IGhhbmRsZUdldERlc3RpbmF0aW9uQnlTbHVnKHJlcSwgcmVzLCBzbHVnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIEFQSV0gRGVzdGluYXRpb24gYnkgc2x1ZyBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuLy8gRGV2LW9ubHkgQVBJIGVuZHBvaW50cyBmb3IgYXV0aGVudGljYXRpb25cbmZ1bmN0aW9uIGF1dGhBcGlQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLWF1dGgtYXBpJyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyBIZWxwZXIgdG8gcGFyc2UgSlNPTiBib2R5IGZyb20gTm9kZS5qcyByZXF1ZXN0XG4gICAgICBmdW5jdGlvbiBwYXJzZUJvZHkocmVxOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuazogYW55KSA9PiBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKGJvZHkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIEpTT04nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnI6IGFueSkgPT4gcmVqZWN0KGVycikpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gUE9TVCAvYXBpL2F1dGgvcmVnaXN0ZXJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXV0aC9yZWdpc3RlcicsIGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcbiAgICAgICAgLy8gSGVhcnRiZWF0IGxvZ1xuICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBSZWNlaXZlZCByZXF1ZXN0IG9uIC9hcGkvYXV0aC9yZWdpc3RlciB3aXRoIG1ldGhvZDogJHtyZXEubWV0aG9kfWApO1xuICAgICAgICBcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTsgLy8gU2V0IGhlYWRlciBmb3IgYWxsIHJlc3BvbnNlc1xuXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBQYXJzZSByZXF1ZXN0IGJvZHkgZmlyc3RcbiAgICAgICAgICBjb25zdCB7IG5hbWUsIGVtYWlsLCBwYXNzd29yZCwgYWNjb3VudFR5cGUgfSA9IGF3YWl0IHBhcnNlQm9keShyZXEpIGFzIGFueTtcblxuICAgICAgICAgIC8vIC0tLSBTZXJ2ZXItU2lkZSBWYWxpZGF0aW9uIC0tLVxuICAgICAgICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIXBhc3N3b3JkKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnQWxsIGZpZWxkcyBhcmUgcmVxdWlyZWQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRW1haWwgZm9ybWF0IHZhbGlkYXRpb25cbiAgICAgICAgICBjb25zdCBlbWFpbFJlZ2V4ID0gL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC87XG4gICAgICAgICAgaWYgKCFlbWFpbFJlZ2V4LnRlc3QoZW1haWwpKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBlbWFpbCBmb3JtYXQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUGFzc3dvcmQgbGVuZ3RoIHZhbGlkYXRpb25cbiAgICAgICAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Bhc3N3b3JkIG11c3QgYmUgYXQgbGVhc3QgNiBjaGFyYWN0ZXJzLicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERldGVybWluZSBhY2NvdW50VHlwZSAoJ3VzZXInIHwgJ3BhcnRuZXInKVxuICAgICAgICAgIGNvbnN0IHJlcXVlc3RlZFR5cGUgPSAoYWNjb3VudFR5cGUgPT09ICdwYXJ0bmVyJykgPyAncGFydG5lcicgOiAndXNlcic7XG5cbiAgICAgICAgICAvLyBDaGVjayBpZiBNT05HT0RCX1VSSSBpcyBhdmFpbGFibGVcbiAgICAgICAgICBpZiAoIXByb2Nlc3MuZW52Lk1PTkdPREJfVVJJKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMztcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgZXJyb3I6ICdEYXRhYmFzZSBjb25uZWN0aW9uIG5vdCBjb25maWd1cmVkLiBQbGVhc2Ugc2V0IE1PTkdPREJfVVJJIGVudmlyb25tZW50IHZhcmlhYmxlLicgXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ29ubmVjdCB0byBEQlxuICAgICAgICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xuXG4gICAgICAgICAgLy8gLS0tIEJ1c2luZXNzIExvZ2ljIC0tLVxuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVXNlciA9IGF3YWl0IFVzZXIuZmluZE9uZSh7IGVtYWlsOiBlbWFpbC50b0xvd2VyQ2FzZSgpIH0pO1xuICAgICAgICAgIGlmIChleGlzdGluZ1VzZXIpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA5O1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVc2VyIHdpdGggdGhpcyBlbWFpbCBhbHJlYWR5IGV4aXN0cy4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDcmVhdGUgdXNlciB3aXRoIGFwcHJvcHJpYXRlIHN0YXR1cyAocGFydG5lciByZXF1ZXN0cyBhcmUgcGVuZGluZyBhcHByb3ZhbClcbiAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUudHJpbSgpLFxuICAgICAgICAgICAgZW1haWw6IGVtYWlsLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICBwYXNzd29yZCxcbiAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgIHN0YXR1czogcmVxdWVzdGVkVHlwZSA9PT0gJ3BhcnRuZXInID8gJ3BlbmRpbmdfYXBwcm92YWwnIDogJ2FjdGl2ZSdcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXIuY3JlYXRlKHVzZXJEYXRhKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBSZW1vdmUgcGFzc3dvcmQgZnJvbSByZXNwb25zZVxuICAgICAgICAgIGNvbnN0IHVzZXJSZXNwb25zZSA9IHVzZXIudG9PYmplY3QoKTtcbiAgICAgICAgICBkZWxldGUgdXNlclJlc3BvbnNlLnBhc3N3b3JkO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coYFtWSVRFIEFQSV0gVXNlciBjcmVhdGVkIHN1Y2Nlc3NmdWxseTogJHt1c2VyLmVtYWlsfSB3aXRoIHJvbGU6ICR7dXNlci5yb2xlfWApO1xuXG4gICAgICAgICAgLy8gLS0tIFN1Y2Nlc3MgUmVzcG9uc2UgLS0tXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDE7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHVzZXJSZXNwb25zZSB9KSk7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIC8vIC0tLSBFcnJvciBIYW5kbGluZyBTYWZldHkgTmV0IC0tLVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIEFQSSBSZWdpc3RlciBFcnJvcl0nLCBlcnJvcik7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0FuIGludGVybmFsIHNlcnZlciBlcnJvciBvY2N1cnJlZC4nIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFBPU1QgL2FwaS9hdXRoL2xvZ2luXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2F1dGgvbG9naW4nLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbVklURSBBUEldIFJlY2VpdmVkIHJlcXVlc3Qgb24gL2FwaS9hdXRoL2xvZ2luIHdpdGggbWV0aG9kOiAke3JlcS5tZXRob2R9YCk7XG4gICAgICAgIFxuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcblxuICAgICAgICAgIGNvbnN0IHsgZW1haWwsIHBhc3N3b3JkIH0gPSBhd2FpdCBwYXJzZUJvZHkocmVxKSBhcyBhbnk7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtMb2dpbiBBUEldIEF0dGVtcHRpbmcgbG9naW4gZm9yIGVtYWlsOiAke2VtYWlsfWApO1xuXG4gICAgICAgICAgLy8gVmFsaWRhdGlvblxuICAgICAgICAgIGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0xvZ2luIEFQSV0gRkFJTEVEOiBNaXNzaW5nIGVtYWlsIG9yIHBhc3N3b3JkJyk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZC4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBGaW5kIHVzZXIgYW5kIGluY2x1ZGUgcGFzc3dvcmQgZm9yIGNvbXBhcmlzb25cbiAgICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWw6IGVtYWlsLnRvTG93ZXJDYXNlKCkgfSkuc2VsZWN0KCcrcGFzc3dvcmQnKTtcbiAgICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTG9naW4gQVBJXSBGQUlMRUQ6IFVzZXIgbm90IGZvdW5kIGZvciBlbWFpbDogJHtlbWFpbH1gKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAxO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIGNyZWRlbnRpYWxzLicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbTG9naW4gQVBJXSBTVUNDRVNTOiBVc2VyIGZvdW5kLiBTdG9yZWQgaGFzaDogJHt1c2VyLnBhc3N3b3JkfWApO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBpcyBwZW5kaW5nIGFwcHJvdmFsXG4gICAgICAgICAgaWYgKHVzZXIuc3RhdHVzID09PSAncGVuZGluZ19hcHByb3ZhbCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTG9naW4gQVBJXSBGQUlMRUQ6IFVzZXIgJHt1c2VyLmVtYWlsfSBpcyBwZW5kaW5nIGFwcHJvdmFsYCk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMztcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVFx1MDBFMGkga2hvXHUxRUEzbiBjXHUxRUU3YSBiXHUxRUExbiBcdTAxMTFhbmcgY2hcdTFFREQgcGhcdTAwRUEgZHV5XHUxRUM3dC4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBWZXJpZnkgcGFzc3dvcmRcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0xvZ2luIEFQSV0gQXR0ZW1wdGluZyBwYXNzd29yZCB2ZXJpZmljYXRpb24gZm9yIHVzZXI6ICR7dXNlci5lbWFpbH1gKTtcbiAgICAgICAgICBjb25zdCBpc1ZhbGlkUGFzc3dvcmQgPSBhd2FpdCB1c2VyLmNvbXBhcmVQYXNzd29yZChwYXNzd29yZCk7XG4gICAgICAgICAgaWYgKCFpc1ZhbGlkUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbTG9naW4gQVBJXSBGQUlMRUQ6IFBhc3N3b3JkIGNvbXBhcmlzb24gcmV0dXJuZWQgZmFsc2UgZm9yIHVzZXI6ICR7dXNlci5lbWFpbH1gKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAxO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIGNyZWRlbnRpYWxzLicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbTG9naW4gQVBJXSBTVUNDRVNTOiBQYXNzd29yZCBtYXRjaGVkIGZvciB1c2VyOiAke3VzZXIuZW1haWx9YCk7XG5cbiAgICAgICAgICAvLyBHZW5lcmF0ZSBKV1QgdG9rZW5cbiAgICAgICAgICBjb25zdCB7IHNpZ25Kd3QgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2F1dGgvand0LmpzJyk7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBzaWduSnd0KHsgdXNlcklkOiBTdHJpbmcodXNlci5faWQpLCByb2xlOiB1c2VyLnJvbGUgfSk7XG5cbiAgICAgICAgICAvLyBTZXQgSFRUUC1vbmx5IGNvb2tpZVxuICAgICAgICAgIGNvbnN0IHsgc2VyaWFsaXplIH0gPSBhd2FpdCBpbXBvcnQoJ2Nvb2tpZScpO1xuICAgICAgICAgIGNvbnN0IGNvb2tpZSA9IHNlcmlhbGl6ZSgnYXV0aF90b2tlbicsIHRva2VuLCB7XG4gICAgICAgICAgICBodHRwT25seTogdHJ1ZSxcbiAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsIC8vIFNldCB0byB0cnVlIGluIHByb2R1Y3Rpb24gd2l0aCBIVFRQU1xuICAgICAgICAgICAgc2FtZVNpdGU6ICdsYXgnLFxuICAgICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgICAgbWF4QWdlOiA2MCAqIDYwICogMjQgKiA3LCAvLyA3IGRheXNcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFJlbW92ZSBwYXNzd29yZCBmcm9tIHJlc3BvbnNlXG4gICAgICAgICAgY29uc3QgdXNlclJlc3BvbnNlID0gdXNlci50b09iamVjdCgpO1xuICAgICAgICAgIGRlbGV0ZSB1c2VyUmVzcG9uc2UucGFzc3dvcmQ7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHk6ICR7dXNlci5lbWFpbH1gKTtcblxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ1NldC1Db29raWUnLCBjb29raWUpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB1c2VyUmVzcG9uc2UgfSkpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVklURSBBUEkgTG9naW4gRXJyb3JdJywgZXJyb3IpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBbiBpbnRlcm5hbCBzZXJ2ZXIgZXJyb3Igb2NjdXJyZWQuJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBQT1NUIC9hcGkvYXV0aC9sb2dvdXRcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXV0aC9sb2dvdXQnLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbVklURSBBUEldIFJlY2VpdmVkIHJlcXVlc3Qgb24gL2FwaS9hdXRoL2xvZ291dCB3aXRoIG1ldGhvZDogJHtyZXEubWV0aG9kfWApO1xuICAgICAgICBcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBzZXJpYWxpemUgfSA9IGF3YWl0IGltcG9ydCgnY29va2llJyk7XG4gICAgICAgICAgY29uc3QgY29va2llID0gc2VyaWFsaXplKCdhdXRoX3Rva2VuJywgJycsIHtcbiAgICAgICAgICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICAgIHNhbWVTaXRlOiAnbGF4JyxcbiAgICAgICAgICAgIHBhdGg6ICcvJyxcbiAgICAgICAgICAgIG1heEFnZTogMCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ1NldC1Db29raWUnLCBjb29raWUpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTG9nZ2VkIG91dCBzdWNjZXNzZnVsbHknIH0pKTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJIExvZ291dCBFcnJvcl0nLCBlcnJvcik7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0FuIGludGVybmFsIHNlcnZlciBlcnJvciBvY2N1cnJlZC4nIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEdFVCAvYXBpL2F1dGgvbWVcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXV0aC9tZScsIGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFtWSVRFIEFQSV0gUmVjZWl2ZWQgcmVxdWVzdCBvbiAvYXBpL2F1dGgvbWUgd2l0aCBtZXRob2Q6ICR7cmVxLm1ldGhvZH1gKTtcbiAgICAgICAgXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdjb29raWUnKTtcbiAgICAgICAgICBjb25zdCB7IHZlcmlmeUp3dCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvYXV0aC9qd3QuanMnKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBjb29raWVzID0gcGFyc2UocmVxLmhlYWRlcnMuY29va2llIHx8ICcnKTtcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IGNvb2tpZXNbJ2F1dGhfdG9rZW4nXTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYXV0aGVudGljYXRpb24gdG9rZW4gcHJvdmlkZWQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHZlcmlmeUp3dCh0b2tlbik7XG4gICAgICAgICAgaWYgKCFwYXlsb2FkKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBhdXRoZW50aWNhdGlvbiB0b2tlbi4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhd2FpdCBkYkNvbm5lY3QoKTtcbiAgICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kQnlJZChwYXlsb2FkLnVzZXJJZCk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVXNlciBub3QgZm91bmQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdXNlclJlc3BvbnNlID0gdXNlci50b09iamVjdCgpO1xuICAgICAgICAgIGRlbGV0ZSB1c2VyUmVzcG9uc2UucGFzc3dvcmQ7XG5cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdXNlclJlc3BvbnNlIH0pKTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJIE1lIEVycm9yXScsIGVycm9yKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnQW4gaW50ZXJuYWwgc2VydmVyIGVycm9yIG9jY3VycmVkLicgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gR0VUIC9hcGkvYXV0aC90ZXN0IC0gU2ltcGxlIHRlc3QgZW5kcG9pbnRcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXV0aC90ZXN0JywgYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBSZWNlaXZlZCByZXF1ZXN0IG9uIC9hcGkvYXV0aC90ZXN0IHdpdGggbWV0aG9kOiAke3JlcS5tZXRob2R9YCk7XG4gICAgICAgIFxuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgIG1lc3NhZ2U6ICdBdXRoIEFQSSBpcyB3b3JraW5nIScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgbW9uZ29kYl91cmk6IHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJID8gJ0NvbmZpZ3VyZWQnIDogJ05vdCBjb25maWd1cmVkJ1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gUE9TVCAvYXBpL2F1dGgvY3JlYXRlLWFkbWluIC0gQWRtaW4gY3JlYXRpb24gZW5kcG9pbnQgZm9yIHRlc3RpbmdcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYXV0aC9jcmVhdGUtYWRtaW4nLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbVklURSBBUEldIFJlY2VpdmVkIHJlcXVlc3Qgb24gL2FwaS9hdXRoL2NyZWF0ZS1hZG1pbiB3aXRoIG1ldGhvZDogJHtyZXEubWV0aG9kfWApO1xuICAgICAgICBcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG5cbiAgICAgICAgICBjb25zdCB7IG5hbWUsIGVtYWlsLCBwYXNzd29yZCB9ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSkgYXMgYW55O1xuXG4gICAgICAgICAgLy8gVmFsaWRhdGlvblxuICAgICAgICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIXBhc3N3b3JkKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnQWxsIGZpZWxkcyBhcmUgcmVxdWlyZWQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgYWRtaW4gYWxyZWFkeSBleGlzdHNcbiAgICAgICAgICBjb25zdCBleGlzdGluZ0FkbWluID0gYXdhaXQgVXNlci5maW5kT25lKHsgZW1haWw6IGVtYWlsLnRvTG93ZXJDYXNlKCkgfSk7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nQWRtaW4pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA5O1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBZG1pbiB3aXRoIHRoaXMgZW1haWwgYWxyZWFkeSBleGlzdHMuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGFkbWluIHVzZXJcbiAgICAgICAgICBjb25zdCBhZG1pbkRhdGEgPSB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRyaW0oKSxcbiAgICAgICAgICAgIGVtYWlsOiBlbWFpbC50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgcGFzc3dvcmQsXG4gICAgICAgICAgICByb2xlOiAnYWRtaW4nLFxuICAgICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJ1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBhZG1pbiA9IG5ldyBVc2VyKGFkbWluRGF0YSk7XG4gICAgICAgICAgYXdhaXQgYWRtaW4uc2F2ZSgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlbW92ZSBwYXNzd29yZCBmcm9tIHJlc3BvbnNlXG4gICAgICAgICAgY29uc3QgYWRtaW5SZXNwb25zZSA9IGFkbWluLnRvT2JqZWN0KCk7XG4gICAgICAgICAgZGVsZXRlIGFkbWluUmVzcG9uc2UucGFzc3dvcmQ7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZJVEUgQVBJXSBBZG1pbiBjcmVhdGVkIHN1Y2Nlc3NmdWxseTogJHthZG1pbi5lbWFpbH0gd2l0aCByb2xlOiAke2FkbWluLnJvbGV9YCk7XG5cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogYWRtaW5SZXNwb25zZSB9KSk7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWSVRFIEFQSSBDcmVhdGUgQWRtaW4gRXJyb3JdJywgZXJyb3IpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBbiBpbnRlcm5hbCBzZXJ2ZXIgZXJyb3Igb2NjdXJyZWQuJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIERldi1vbmx5IFB1YmxpYyBUb3VycyBTZWFyY2ggQVBJXG5mdW5jdGlvbiBwdWJsaWNUb3Vyc0FwaVBsdWdpbigpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndml0ZS1wbHVnaW4tcHVibGljLXRvdXJzLWFwaScsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgLy8gUm91dGU6IEdFVCAvYXBpL3RvdXJzL3NlYXJjaFxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCAnJztcbiAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aCgnL2FwaS90b3Vycy9zZWFyY2gnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgaGFuZGxlciA9IGF3YWl0IGltcG9ydCgnLi9zcmMvcGFnZXMvYXBpL3RvdXJzL3NlYXJjaCcpO1xuICAgICAgICAgIHJldHVybiBoYW5kbGVyLmRlZmF1bHQocmVxLCByZXMpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTZXJ2ZXIgZXJyb3InIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJvdXRlOiBHRVQgL2FwaS90b3Vycy86aWRcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvdG91cnMvJywgYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIGNvbnN0IHNlZyA9IChyZXEudXJsIHx8ICcnKS5yZXBsYWNlKC9eXFwvPy8sICcnKTtcbiAgICAgICAgICAvLyBJZ25vcmUgc2VhcmNoIHdoaWNoIGlzIGhhbmRsZWQgYWJvdmVcbiAgICAgICAgICBpZiAoIXNlZyB8fCBzZWcuc3RhcnRzV2l0aCgnc2VhcmNoJykpIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgY29uc3QgeyBoYW5kbGVHZXRUb3VyQnlJZCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvYXBpL3RvdXJIYW5kbGVyJyk7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtWSVRFIEFQSV0gR0VUIC9hcGkvdG91cnMvJHtzZWd9YCk7XG4gICAgICAgICAgYXdhaXQgaGFuZGxlR2V0VG91ckJ5SWQocmVxLCByZXMsIHNlZyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIERldi1vbmx5IFVzZXIgSm91cm5leXMgQVBJXG5mdW5jdGlvbiB1c2VySm91cm5leXNBcGlQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLXVzZXItam91cm5leXMtYXBpJyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyBSb3V0ZTogR0VUIC9hcGkvdXNlcnMvam91cm5leXNcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJy9hcGkvdXNlcnMvam91cm5leXMnKSkgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbVklURSBBUEldIEdFVCAvYXBpL3VzZXJzL2pvdXJuZXlzIC0gRm9yd2FyZGluZyB0byBoYW5kbGVyYCk7XG4gICAgICAgICAgY29uc3QgeyBoYW5kbGVHZXRVc2VySm91cm5leXMgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbGliL2FwaS9qb3VybmV5c0hhbmRsZXInKTtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgaGFuZGxlR2V0VXNlckpvdXJuZXlzKHJlcSwgcmVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVklURSBBUEldIFVzZXIgSm91cm5leXMgRXJyb3I6JywgZXJyKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAnU2VydmVyIGVycm9yJyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIERldi1vbmx5IENvbW11bml0eSBIdWIgQVBJXG5mdW5jdGlvbiBjb21tdW5pdHlIdWJBcGlQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLWNvbW11bml0eS1odWItYXBpJyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyBSb3V0ZTogR0VUIC9hcGkvY29tbXVuaXR5L2h1YlxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9jb21tdW5pdHkvaHViJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnR0VUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1O1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW1ZJVEUgQVBJXSBHRVQgL2FwaS9jb21tdW5pdHkvaHViIC0gUHJvY2Vzc2luZyByZXF1ZXN0Li4uJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gSW1wb3J0IHJlcXVpcmVkIG1vZHVsZXNcbiAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGRiQ29ubmVjdCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9saWIvZGJDb25uZWN0LmpzJyk7XG4gICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBTdG9yeSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9tb2RlbHMvU3RvcnkuanMnKTtcbiAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IFVzZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvbW9kZWxzL1VzZXIuanMnKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBDb25uZWN0IHRvIGRhdGFiYXNlXG4gICAgICAgICAgYXdhaXQgZGJDb25uZWN0KCk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRXhlY3V0ZSBhbGwgcXVlcmllcyBpbiBwYXJhbGxlbCBmb3IgbWF4aW11bSBwZXJmb3JtYW5jZVxuICAgICAgICAgIGNvbnN0IFtcbiAgICAgICAgICAgIGZlYXR1cmVkU3RvcnksXG4gICAgICAgICAgICBsYXRlc3RTdG9yaWVzLFxuICAgICAgICAgICAgdHJlbmRpbmdUYWdzLFxuICAgICAgICAgICAgdG9wQXV0aG9ycyxcbiAgICAgICAgICAgIHRvdGFsU3RvcmllcyxcbiAgICAgICAgICAgIHRvdGFsTWVtYmVycyxcbiAgICAgICAgICAgIHN0b3JpZXNUaGlzV2Vla1xuICAgICAgICAgIF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAvLyBGZWF0dXJlZCBTdG9yeTogR2V0IHRoZSBzdG9yeSB3aXRoIGhpZ2hlc3QgbGlrZUNvdW50IHRoYXQgaXMgYXBwcm92ZWRcbiAgICAgICAgICAgIFN0b3J5LmZpbmRPbmUoeyBzdGF0dXM6ICdhcHByb3ZlZCcgfSlcbiAgICAgICAgICAgICAgLnNvcnQoeyBsaWtlQ291bnQ6IC0xIH0pXG4gICAgICAgICAgICAgIC5wb3B1bGF0ZSgnYXV0aG9yJywgJ25hbWUgYXZhdGFyJylcbiAgICAgICAgICAgICAgLmxlYW4oKSxcblxuICAgICAgICAgICAgLy8gTGF0ZXN0IFN0b3JpZXM6IEdldCA1IG1vc3QgcmVjZW50IHN0b3JpZXMgKGFsbCBzdGF0dXNlcylcbiAgICAgICAgICAgIFN0b3J5LmZpbmQoe30pXG4gICAgICAgICAgICAgIC5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KVxuICAgICAgICAgICAgICAubGltaXQoNSlcbiAgICAgICAgICAgICAgLnBvcHVsYXRlKCdhdXRob3InLCAnbmFtZSBhdmF0YXInKVxuICAgICAgICAgICAgICAubGVhbigpLFxuXG4gICAgICAgICAgICAvLyBUcmVuZGluZyBUYWdzOiBNb25nb0RCIGFnZ3JlZ2F0aW9uIHBpcGVsaW5lXG4gICAgICAgICAgICBTdG9yeS5hZ2dyZWdhdGUoW1xuICAgICAgICAgICAgICB7ICR1bndpbmQ6ICckdGFncycgfSxcbiAgICAgICAgICAgICAgeyAkZ3JvdXA6IHsgX2lkOiAnJHRhZ3MnLCBjb3VudDogeyAkc3VtOiAxIH0gfSB9LFxuICAgICAgICAgICAgICB7ICRzb3J0OiB7IGNvdW50OiAtMSB9IH0sXG4gICAgICAgICAgICAgIHsgJGxpbWl0OiA1IH0sXG4gICAgICAgICAgICAgIHsgJHByb2plY3Q6IHsgdGFnOiAnJF9pZCcsIGNvdW50OiAxLCBfaWQ6IDAgfSB9XG4gICAgICAgICAgICBdKSxcblxuICAgICAgICAgICAgLy8gVG9wIEF1dGhvcnM6IENvbXBsZXggYWdncmVnYXRpb24gdG8gZ2V0IGF1dGhvcnMgd2l0aCBtb3N0IHN0b3JpZXMgYW5kIGxpa2VzXG4gICAgICAgICAgICBTdG9yeS5hZ2dyZWdhdGUoW1xuICAgICAgICAgICAgICB7ICRncm91cDoge1xuICAgICAgICAgICAgICAgIF9pZDogJyRhdXRob3InLFxuICAgICAgICAgICAgICAgIHN0b3J5Q291bnQ6IHsgJHN1bTogMSB9LFxuICAgICAgICAgICAgICAgIHRvdGFsTGlrZXM6IHsgJHN1bTogJyRsaWtlQ291bnQnIH1cbiAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICAgIHsgJHNvcnQ6IHsgdG90YWxMaWtlczogLTEsIHN0b3J5Q291bnQ6IC0xIH0gfSxcbiAgICAgICAgICAgICAgeyAkbGltaXQ6IDMgfSxcbiAgICAgICAgICAgICAgeyAkbG9va3VwOiB7XG4gICAgICAgICAgICAgICAgZnJvbTogJ3VzZXJzJyxcbiAgICAgICAgICAgICAgICBsb2NhbEZpZWxkOiAnX2lkJyxcbiAgICAgICAgICAgICAgICBmb3JlaWduRmllbGQ6ICdfaWQnLFxuICAgICAgICAgICAgICAgIGFzOiAnYXV0aG9ySW5mbydcbiAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICAgIHsgJHVud2luZDogJyRhdXRob3JJbmZvJyB9LFxuICAgICAgICAgICAgICB7ICRwcm9qZWN0OiB7XG4gICAgICAgICAgICAgICAgX2lkOiAnJGF1dGhvckluZm8uX2lkJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnJGF1dGhvckluZm8ubmFtZScsXG4gICAgICAgICAgICAgICAgYXZhdGFyOiAnJGF1dGhvckluZm8uYXZhdGFyJyxcbiAgICAgICAgICAgICAgICBmb2xsb3dlckNvdW50OiB7ICRpZk51bGw6IFsnJGF1dGhvckluZm8uY29udHJpYnV0aW9uU2NvcmUnLCAwXSB9LFxuICAgICAgICAgICAgICAgIHN0b3J5Q291bnQ6IDFcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIF0pLFxuXG4gICAgICAgICAgICAvLyBDb21tdW5pdHkgU3RhdHM6IFRvdGFsIHN0b3JpZXMgKHRydWUgdG90YWwgY291bnQpXG4gICAgICAgICAgICBTdG9yeS5lc3RpbWF0ZWREb2N1bWVudENvdW50KCksXG5cbiAgICAgICAgICAgIC8vIENvbW11bml0eSBTdGF0czogVG90YWwgbWVtYmVycyAodHJ1ZSB0b3RhbCBjb3VudClcbiAgICAgICAgICAgIFVzZXIuZXN0aW1hdGVkRG9jdW1lbnRDb3VudCgpLFxuXG4gICAgICAgICAgICAvLyBDb21tdW5pdHkgU3RhdHM6IFN0b3JpZXMgdGhpcyB3ZWVrXG4gICAgICAgICAgICBTdG9yeS5jb3VudERvY3VtZW50cyh7XG4gICAgICAgICAgICAgIHN0YXR1czogJ2FwcHJvdmVkJyxcbiAgICAgICAgICAgICAgY3JlYXRlZEF0OiB7XG4gICAgICAgICAgICAgICAgJGd0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgLy8gVHJhbnNmb3JtIHRoZSBkYXRhIHRvIG1hdGNoIG91ciBBUEkgY29udHJhY3RcbiAgICAgICAgICBjb25zdCBjb21tdW5pdHlIdWJEYXRhID0ge1xuICAgICAgICAgICAgZmVhdHVyZWRTdG9yeTogZmVhdHVyZWRTdG9yeSA/IHtcbiAgICAgICAgICAgICAgX2lkOiBmZWF0dXJlZFN0b3J5Ll9pZC50b1N0cmluZygpLFxuICAgICAgICAgICAgICB0aXRsZTogZmVhdHVyZWRTdG9yeS50aXRsZSxcbiAgICAgICAgICAgICAgY29udGVudDogZmVhdHVyZWRTdG9yeS5jb250ZW50LFxuICAgICAgICAgICAgICBjb3ZlckltYWdlOiBmZWF0dXJlZFN0b3J5LmNvdmVySW1hZ2UsXG4gICAgICAgICAgICAgIHRhZ3M6IGZlYXR1cmVkU3RvcnkudGFncyxcbiAgICAgICAgICAgICAgbGlrZUNvdW50OiBmZWF0dXJlZFN0b3J5Lmxpa2VDb3VudCxcbiAgICAgICAgICAgICAgY3JlYXRlZEF0OiBmZWF0dXJlZFN0b3J5LmNyZWF0ZWRBdC50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICBhdXRob3I6IHtcbiAgICAgICAgICAgICAgICBfaWQ6IGZlYXR1cmVkU3RvcnkuYXV0aG9yLl9pZC50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIG5hbWU6IChmZWF0dXJlZFN0b3J5LmF1dGhvciBhcyBhbnkpLm5hbWUsXG4gICAgICAgICAgICAgICAgYXZhdGFyOiAoZmVhdHVyZWRTdG9yeS5hdXRob3IgYXMgYW55KS5hdmF0YXJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxhdGVzdFN0b3JpZXM6IGxhdGVzdFN0b3JpZXMubWFwKHN0b3J5ID0+ICh7XG4gICAgICAgICAgICAgIF9pZDogc3RvcnkuX2lkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgIHRpdGxlOiBzdG9yeS50aXRsZSxcbiAgICAgICAgICAgICAgY29udGVudDogc3RvcnkuY29udGVudCxcbiAgICAgICAgICAgICAgY292ZXJJbWFnZTogc3RvcnkuY292ZXJJbWFnZSxcbiAgICAgICAgICAgICAgdGFnczogc3RvcnkudGFncyxcbiAgICAgICAgICAgICAgbGlrZUNvdW50OiBzdG9yeS5saWtlQ291bnQsXG4gICAgICAgICAgICAgIGNyZWF0ZWRBdDogc3RvcnkuY3JlYXRlZEF0LnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgICAgIF9pZDogc3RvcnkuYXV0aG9yLl9pZC50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIG5hbWU6IChzdG9yeS5hdXRob3IgYXMgYW55KS5uYW1lLFxuICAgICAgICAgICAgICAgIGF2YXRhcjogKHN0b3J5LmF1dGhvciBhcyBhbnkpLmF2YXRhclxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSksXG5cbiAgICAgICAgICAgIHRyZW5kaW5nVGFnczogdHJlbmRpbmdUYWdzLm1hcCh0YWcgPT4gKHtcbiAgICAgICAgICAgICAgdGFnOiB0YWcudGFnLFxuICAgICAgICAgICAgICBjb3VudDogdGFnLmNvdW50XG4gICAgICAgICAgICB9KSksXG5cbiAgICAgICAgICAgIHRvcEF1dGhvcnM6IHRvcEF1dGhvcnMubWFwKGF1dGhvciA9PiAoe1xuICAgICAgICAgICAgICBfaWQ6IGF1dGhvci5faWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgbmFtZTogYXV0aG9yLm5hbWUsXG4gICAgICAgICAgICAgIGF2YXRhcjogYXV0aG9yLmF2YXRhcixcbiAgICAgICAgICAgICAgZm9sbG93ZXJDb3VudDogYXV0aG9yLmZvbGxvd2VyQ291bnQsXG4gICAgICAgICAgICAgIHN0b3J5Q291bnQ6IGF1dGhvci5zdG9yeUNvdW50XG4gICAgICAgICAgICB9KSksXG5cbiAgICAgICAgICAgIGNvbW11bml0eVN0YXRzOiB7XG4gICAgICAgICAgICAgIHRvdGFsU3RvcmllcyxcbiAgICAgICAgICAgICAgdG90YWxNZW1iZXJzLFxuICAgICAgICAgICAgICBzdG9yaWVzVGhpc1dlZWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tWSVRFIEFQSV0gQ29tbXVuaXR5IGh1YiBkYXRhIGZldGNoZWQgc3VjY2Vzc2Z1bGx5Jyk7XG5cbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IGNvbW11bml0eUh1YkRhdGEsXG4gICAgICAgICAgICBjYWNoZWQ6IGZhbHNlXG4gICAgICAgICAgfSkpO1xuICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW1ZJVEUgQVBJXSBDb21tdW5pdHkgSHViIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ1NlcnZlciBlcnJvcicgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG4vLyAtLS0gTUFJTiBWSVRFIENPTkZJR1VSQVRJT04gKFRoZSBzaW5nbGUsIGF1dGhvcml0YXRpdmUgZXhwb3J0KSAtLS1cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gVXNlIFZpdGUncyBuYXRpdmUgYGxvYWRFbnZgIHRvIGNvcnJlY3RseSByZWFkIC5lbnYgZmlsZXMgZm9yIHRoZSBjdXJyZW50IG1vZGUuXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuXG4gIC8vIC0tLSBUSEUgREVGSU5JVElWRSBGSVggLS0tXG4gIC8vIFJhdGlvbmFsZTogYGxvYWRFbnZgIGRvZXMgTk9UIGF1dG9tYXRpY2FsbHkgcG9wdWxhdGUgYHByb2Nlc3MuZW52YC4gV2UgbXVzdFxuICAvLyBtYW51YWxseSBhc3NpZ24gZXZlcnkgc2VydmVyLXNpZGUgdmFyaWFibGUgdGhhdCBvdXIgYXBwbGljYXRpb24ncyBiYWNrZW5kXG4gIC8vIGxvZ2ljIChsaWtlIGF1dGggdXRpbGl0aWVzKSB3aWxsIG5lZWQuXG4gIHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJID0gZW52Lk1PTkdPREJfVVJJOyAvLyBLZWVwIGV4aXN0aW5nIHZhcmlhYmxlc1xuICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUID0gZW52LkpXVF9TRUNSRVQ7XG4gIHByb2Nlc3MuZW52LkpXVF9FWFBJUkVTX0lOID0gZW52LkpXVF9FWFBJUkVTX0lOOyAvLyBBbHNvIHByb3BhZ2F0ZSB0aGlzIGZvciB0aGUgbG9naW4gZW5kcG9pbnRcbiAgLy8gLS0tIEVORCBERUZJTklUSVZFIEZJWCAtLS1cblxuICAvLyBBZGQgYSBjaGVjayB0byB3YXJuIHRoZSBkZXZlbG9wZXIgaWYgdGhlIHNlY3JldCBpcyBtaXNzaW5nLlxuICBpZiAoIXByb2Nlc3MuZW52LkpXVF9TRUNSRVQpIHtcbiAgICBjb25zb2xlLndhcm4oXCJcdTI2QTBcdUZFMEYgV0FSTklORzogSldUX1NFQ1JFVCBpcyBub3QgZGVmaW5lZCBpbiB5b3VyIC5lbnYgZmlsZS4gQXV0aGVudGljYXRpb24gd2lsbCBmYWlsLlwiKTtcbiAgfVxuXG4gIC8vIEEgd2FybmluZyBmb3IgZGV2ZWxvcGVycyBpZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgbWlzc2luZy5cbiAgaWYgKCFwcm9jZXNzLmVudi5NT05HT0RCX1VSSSAmJiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgY29uc29sZS53YXJuKFwiXHUyNkEwXHVGRTBGIFdBUk5JTkc6IE1PTkdPREJfVVJJIGlzIG5vdCBkZWZpbmVkIGluIHlvdXIgLmVudi5sb2NhbCBmaWxlLiBUaGUgc2VlZGluZyBBUEkgd2lsbCBmYWlsLlwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIC8vIENvbmRpdGlvbmFsbHkgZW5hYmxlIHRoZSBzZWVkaW5nIEFQSSBvbmx5IGluIHRoZSAnZGV2ZWxvcG1lbnQnIGVudmlyb25tZW50LlxuICAgICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyA/IHNlZWRBcGlQbHVnaW4oKSA6IG51bGwsXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnID8gaG9tZUFwaVBsdWdpbigpIDogbnVsbCxcbiAgICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyBhdXRoQXBpUGx1Z2luKCkgOiBudWxsLFxuICAgICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyA/IHB1YmxpY1RvdXJzQXBpUGx1Z2luKCkgOiBudWxsLFxuICAgICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyA/IHVzZXJKb3VybmV5c0FwaVBsdWdpbigpIDogbnVsbCxcbiAgICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyBjb21tdW5pdHlIdWJBcGlQbHVnaW4oKSA6IG51bGwsXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXHZpZXQtYWR2ZW50dXJlLWNvbm5lY3RcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFxzcmNcXFxcbGliXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdmlldC1hZHZlbnR1cmUtY29ubmVjdFxcXFx2aWV0LWFkdmVudHVyZS1jb25uZWN0XFxcXHNyY1xcXFxsaWJcXFxcYXBpXFxcXGJvb2tpbmdIYW5kbGVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi92aWV0LWFkdmVudHVyZS1jb25uZWN0L3ZpZXQtYWR2ZW50dXJlLWNvbm5lY3Qvc3JjL2xpYi9hcGkvYm9va2luZ0hhbmRsZXIudHNcIjtpbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJztcclxuaW1wb3J0IHsgcGFyc2UgYXMgcGFyc2VDb29raWUgfSBmcm9tICdjb29raWUnO1xyXG5pbXBvcnQgZGJDb25uZWN0IGZyb20gJy4uL2RiQ29ubmVjdCc7XHJcbmltcG9ydCBCb29raW5nIGZyb20gJy4uLy4uL21vZGVscy9Cb29raW5nJztcclxuaW1wb3J0IFRvdXIgZnJvbSAnLi4vLi4vbW9kZWxzL1RvdXInO1xyXG5pbXBvcnQgeyB2ZXJpZnlKd3QgfSBmcm9tICcuLi9hdXRoL2p3dCc7XHJcblxyXG4vLyBIZWxwZXIgdG8gcGFyc2UgSlNPTiByZXF1ZXN0IGJvZHkgc2FmZWx5XHJcbmFzeW5jIGZ1bmN0aW9uIHBhcnNlQm9keShyZXE6IEluY29taW5nTWVzc2FnZSk6IFByb21pc2U8YW55PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGxldCBib2R5ID0gJyc7XHJcbiAgICByZXEub24oJ2RhdGEnLCAoY2h1bms6IGFueSkgPT4gKGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKSkpO1xyXG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmVzb2x2ZShib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJlamVjdChlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXEub24oJ2Vycm9yJywgKGVycjogYW55KSA9PiByZWplY3QoZXJyKSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlbmRKc29uKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1c0NvZGU6IG51bWJlciwgcGF5bG9hZDogYW55KSB7XHJcbiAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXNDb2RlO1xyXG4gIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShwYXlsb2FkKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDcmVhdGVCb29raW5nKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGRiQ29ubmVjdCgpO1xyXG5cclxuICAgIC8vIEF1dGhlbnRpY2F0ZSB1c2VyIGZyb20gY29va2llXHJcbiAgICBjb25zdCBjb29raWVzID0gcGFyc2VDb29raWUocmVxLmhlYWRlcnMuY29va2llIHx8ICcnKTtcclxuICAgIGNvbnN0IHRva2VuID0gY29va2llc1snYXV0aF90b2tlbiddO1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IHRva2VuID8gdmVyaWZ5Snd0KHRva2VuKSA6IG51bGw7XHJcbiAgICBpZiAoIXBheWxvYWQpIHtcclxuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDAxLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkLicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGFyc2UgYW5kIHZhbGlkYXRlIGJvZHlcclxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUJvZHkocmVxKTtcclxuICAgIGNvbnN0IHRvdXJJZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gYm9keT8udG91cklkO1xyXG4gICAgY29uc3QgYm9va2luZ0RhdGVSYXc6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGJvZHk/LmJvb2tpbmdEYXRlO1xyXG4gICAgY29uc3QgcGFydGljaXBhbnRzVG90YWw6IG51bWJlciB8IHVuZGVmaW5lZCA9IGJvZHk/LnBhcnRpY2lwYW50cztcclxuICAgIGNvbnN0IHBhcnRpY2lwYW50c0JyZWFrZG93bjogeyBhZHVsdHM/OiBudW1iZXI7IGNoaWxkcmVuPzogbnVtYmVyIH0gfCB1bmRlZmluZWQgPSBib2R5Py5wYXJ0aWNpcGFudHNCcmVha2Rvd247XHJcbiAgICBjb25zdCBjdXN0b21lckluZm86IGFueSA9IGJvZHk/LmN1c3RvbWVySW5mbztcclxuICAgIGNvbnN0IHBheW1lbnRNZXRob2Q6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGJvZHk/LnBheW1lbnRNZXRob2Q7XHJcblxyXG4gICAgaWYgKCF0b3VySWQgfHwgIWJvb2tpbmdEYXRlUmF3IHx8ICFwYXJ0aWNpcGFudHNUb3RhbCB8fCAhY3VzdG9tZXJJbmZvKSB7XHJcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdNaXNzaW5nIHJlcXVpcmVkIGZpZWxkcy4nIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvZXJjZSBhbmQgdmFsaWRhdGUgbnVtYmVyc1xyXG4gICAgY29uc3QgYWR1bHRzID0gTWF0aC5tYXgoMCwgTnVtYmVyKHBhcnRpY2lwYW50c0JyZWFrZG93bj8uYWR1bHRzIHx8IHBhcnRpY2lwYW50c1RvdGFsKSk7XHJcbiAgICBjb25zdCBjaGlsZHJlbiA9IE1hdGgubWF4KDAsIE51bWJlcihwYXJ0aWNpcGFudHNCcmVha2Rvd24/LmNoaWxkcmVuIHx8IDApKTtcclxuICAgIGNvbnN0IGNvbXB1dGVkVG90YWxQYXJ0aWNpcGFudHMgPSBhZHVsdHMgKyBjaGlsZHJlbjtcclxuICAgIGlmIChjb21wdXRlZFRvdGFsUGFydGljaXBhbnRzICE9PSBOdW1iZXIocGFydGljaXBhbnRzVG90YWwpKSB7XHJcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdQYXJ0aWNpcGFudHMgbWlzbWF0Y2guJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBib29raW5nRGF0ZSA9IG5ldyBEYXRlKGJvb2tpbmdEYXRlUmF3KTtcclxuICAgIGlmIChpc05hTihib29raW5nRGF0ZS5nZXRUaW1lKCkpKSB7XHJcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDQwMCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIGJvb2tpbmdEYXRlLicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9hZCB0b3VyIGFuZCB2ZXJpZnlcclxuICAgIGNvbnN0IHRvdXIgPSBhd2FpdCBUb3VyLmZpbmRCeUlkKHRvdXJJZCk7XHJcbiAgICBpZiAoIXRvdXIpIHtcclxuICAgICAgcmV0dXJuIHNlbmRKc29uKHJlcywgNDA0LCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1RvdXIgbm90IGZvdW5kLicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2VydmVyLXNpZGUgcHJpY2UgY2FsY3VsYXRpb24gKG5ldmVyIHRydXN0IGNsaWVudClcclxuICAgIGNvbnN0IHByaWNlUGVyQWR1bHQgPSBOdW1iZXIodG91ci5wcmljZSB8fCAwKTtcclxuICAgIGNvbnN0IHByaWNlUGVyQ2hpbGQgPSBwcmljZVBlckFkdWx0ICogMC43OyAvLyBidXNpbmVzcyBydWxlXHJcbiAgICBjb25zdCBiYXNlUHJpY2UgPSBhZHVsdHMgKiBwcmljZVBlckFkdWx0ICsgY2hpbGRyZW4gKiBwcmljZVBlckNoaWxkO1xyXG4gICAgY29uc3QgdGF4ZXMgPSBNYXRoLnJvdW5kKGJhc2VQcmljZSAqIDAuMCk7IC8vIG5vIHRheCBmb3Igbm93OyBrZWVwIGZvciBmdXR1cmVcclxuICAgIGNvbnN0IGZlZXMgPSAwOyAvLyBwbGFjZWhvbGRlciBmb3Igc2VydmljZSBmZWVzXHJcbiAgICBjb25zdCB0b3RhbFByaWNlID0gYmFzZVByaWNlICsgdGF4ZXMgKyBmZWVzO1xyXG5cclxuICAgIC8vIENyZWF0ZSBib29raW5nIGRvY3VtZW50IGF0b21pY2FsbHlcclxuICAgIGNvbnN0IG5ld0Jvb2tpbmcgPSBhd2FpdCBCb29raW5nLmNyZWF0ZSh7XHJcbiAgICAgIHVzZXI6IChhd2FpdCBpbXBvcnQoJ21vbmdvb3NlJykpLmRlZmF1bHQuVHlwZXMuT2JqZWN0SWQuY3JlYXRlRnJvbUhleFN0cmluZyhwYXlsb2FkLnVzZXJJZCksXHJcbiAgICAgIHRvdXI6IHRvdXIuX2lkLFxyXG4gICAgICB0b3VySW5mbzoge1xyXG4gICAgICAgIHRpdGxlOiB0b3VyLnRpdGxlLFxyXG4gICAgICAgIHByaWNlOiB0b3VyLnByaWNlLFxyXG4gICAgICAgIGR1cmF0aW9uOiB0b3VyLmR1cmF0aW9uLFxyXG4gICAgICB9LFxyXG4gICAgICBib29raW5nRGF0ZSxcclxuICAgICAgcGFydGljaXBhbnRzOiBjb21wdXRlZFRvdGFsUGFydGljaXBhbnRzLFxyXG4gICAgICBwYXJ0aWNpcGFudHNCcmVha2Rvd246IHsgYWR1bHRzLCBjaGlsZHJlbiB9LFxyXG4gICAgICB0b3RhbFByaWNlLFxyXG4gICAgICBwcmljZUJyZWFrZG93bjogeyBiYXNlUHJpY2UsIHRheGVzLCBmZWVzIH0sXHJcbiAgICAgIHBheW1lbnRNZXRob2QsXHJcbiAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxyXG4gICAgICBoaXN0b3J5OiBbXHJcbiAgICAgICAgeyBhdDogbmV3IERhdGUoKSwgYWN0aW9uOiAnQm9va2luZyBjcmVhdGVkIChwZW5kaW5nKScgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzZW5kSnNvbihyZXMsIDIwMSwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBuZXdCb29raW5nIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tBUEldIFBPU1QgL2FwaS9ib29raW5ncyBlcnJvcjonLCBlcnJvcik7XHJcbiAgICByZXR1cm4gc2VuZEpzb24ocmVzLCA1MDAsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvcj8ubWVzc2FnZSB8fCAnU2VydmVyIEVycm9yJyB9KTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQWdXLE9BQU8sY0FBYztBQWVyWCxlQUFPLFlBQTZEO0FBQ2xFLFFBQU0sY0FBYyxRQUFRLElBQUksZUFBZSxRQUFRLElBQUk7QUFDM0QsTUFBSSxDQUFDLGFBQWE7QUFDaEIsVUFBTSxJQUFJLE1BQU0sZ0VBQWdFO0FBQUEsRUFDbEY7QUFDQSxRQUFNLFNBQVMsbUJBQW1CO0FBRWxDLE1BQUksT0FBTyxNQUFNO0FBQ2YsV0FBTyxPQUFPO0FBQUEsRUFDaEI7QUFFQSxNQUFJLENBQUMsT0FBTyxTQUFTO0FBQ25CLFdBQU8sVUFBVSxTQUFTLFFBQVEsYUFBYTtBQUFBO0FBQUEsTUFFN0MsYUFBYTtBQUFBLElBQ2YsQ0FBQyxFQUFFLEtBQUssQ0FBQyxxQkFBcUI7QUFDNUIsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUFBLEVBQ0g7QUFFQSxTQUFPLE9BQU8sTUFBTSxPQUFPO0FBQzNCLFNBQU8sT0FBTztBQUNoQjtBQXJDQSxJQVNNO0FBVE47QUFBQTtBQUFB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c2UiLCAiU2NoZW1hIiwgIm1vbmdvb3NlIiwgIlNjaGVtYSIsICJtb25nb29zZSIsICJTY2hlbWEiLCAibW9uZ29vc2UiLCAiU2NoZW1hIiwgIm1vbmdvb3NlIiwgIlNjaGVtYSIsICJtb25nb29zZSIsICJTY2hlbWEiLCAibW9uZ29vc2UiLCAiU2NoZW1hIiwgIm1vbmdvb3NlIiwgIlNjaGVtYSIsICJtb25nb29zZSIsICJTY2hlbWEiLCAibW9uZ29vc2UiLCAiand0IiwgInNlbmQiLCAic2VuZCIsICJoYW5kbGVyIiwgImRiQ29ubmVjdCIsICJCb29raW5nIiwgImZvcm1hdERhdGUiLCAicGFyc2UiLCAidmVyaWZ5Snd0IiwgInBhdGgiLCAicGFyc2UiLCAidmVyaWZ5Snd0IiwgIkJvb2tpbmciLCAiVXNlciIsICJUb3VyIiwgIkNvdXBvbiIsICJCYW5uZXIiLCAiQ29sbGVjdGlvbiIsICJTZXR0aW5ncyIsICJSZXZpZXciLCAiRGVzdGluYXRpb24iLCAiUm9sZSIsICJTdG9yeSIsICJoYW5kbGVJbWFnZVVwbG9hZCIsICJoYW5kbGVDcmVhdGVTdG9yeSIsICJoYW5kbGVHZXREZXN0aW5hdGlvbkJ5U2x1ZyIsICJwYXJzZUJvZHkiLCAic2lnbkp3dCIsICJjb29raWUiLCAiaGFuZGxlciIsICJoYW5kbGVHZXRUb3VyQnlJZCIsICJoYW5kbGVHZXRVc2VySm91cm5leXMiLCAiZGJDb25uZWN0IiwgInBhdGgiXQp9Cg==
