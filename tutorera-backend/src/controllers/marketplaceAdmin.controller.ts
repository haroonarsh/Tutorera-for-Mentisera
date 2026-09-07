import { Response } from "express";
import { AuthRequest } from "../types";
import Request from "../models/Request.model";
import Bid from "../models/Bid.model";
import Booking from "../models/Booking.model";
import OfferNegotiation from "../models/OfferNegotiation.model";
import StudentTutorRelationship from "../models/StudentTutorRelationship.model";

export const getMarketplaceAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const [
    totalRequests,
    activeRequests,
    expiredRequests,
    repostedRequests,
    extendedRequests,
    totalOffers,
    zeroOfferRequests,
    requestsWithThreeOffers,
    acceptedOffers,
    bookings,
    completed,
    cancelled,
    disputed,
    firstOffers,
    negotiations,
    activeRelationships,
    repeatRelationships,
    relationships30d,
    relationships60d,
    relationships90d,
    classifiedLostRequests,
    unclassifiedLostRequests,
    lossReasonRows
  ] = await Promise.all([
    Request.countDocuments(),
    Request.countDocuments({ status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, expiresAt: { $gt: now } }),
    Request.countDocuments({ status: "expired" }),
    Request.countDocuments({ repostedFromRequestId: { $exists: true } }),
    Request.countDocuments({ extensionCount: { $gt: 0 } }),
    Bid.countDocuments(),
    Request.aggregate([
      { $match: { isDirect: { $ne: true } } },
      { $lookup: { from: "bids", localField: "_id", foreignField: "request", as: "offers" } },
      { $match: { "offers.0": { $exists: false }, status: { $in: ["open", "published", "receiving_offers", "negotiating"] }, expiresAt: { $gt: now } } },
      { $count: "count" },
    ]),
    Request.aggregate([
      { $match: { isDirect: { $ne: true } } },
      { $lookup: { from: "bids", localField: "_id", foreignField: "request", as: "offers" } },
      { $addFields: { activeOfferCount: { $size: { $filter: { input: "$offers", as: "offer", cond: { $not: [{ $in: ["$$offer.status", ["withdrawn", "rejected", "expired"]] }] } } } } } },
      { $match: { activeOfferCount: { $gte: 3 } } },
      { $count: "count" },
    ]),
    Bid.countDocuments({ status: "accepted" }),
    Booking.find().select("subtotal studentTotal tutorFee platformFee finalAgreedRate amount createdAt").lean(),
    Booking.countDocuments({ status: "completed" }),
    Booking.countDocuments({ status: "cancelled" }),
    Request.countDocuments({ status: "disputed" }),
    Bid.aggregate([{ $group: { _id: "$request", first: { $min: "$createdAt" } } }]),
    OfferNegotiation.countDocuments(),
    StudentTutorRelationship.countDocuments({ relationshipStatus: "active" }),
    StudentTutorRelationship.countDocuments({ repeatBookingCount: { $gt: 0 } }),
    StudentTutorRelationship.countDocuments({ lastSessionAt: { $gte: daysAgo(30) } }),
    StudentTutorRelationship.countDocuments({ lastSessionAt: { $gte: daysAgo(60) } }),
    StudentTutorRelationship.countDocuments({ lastSessionAt: { $gte: daysAgo(90) } }),
    Request.countDocuments({ status: { $in: ["cancelled", "expired", "closed"] }, lossReason: { $exists: true } }),
    Request.countDocuments({ status: { $in: ["cancelled", "expired", "closed"] }, lossReason: { $exists: false } }),
    Request.aggregate([
      { $match: { status: { $in: ["cancelled", "expired", "closed"] }, lossReason: { $exists: true } } },
      { $group: { _id: "$lossReason", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  const requestDates = await Request.find({ _id: { $in: firstOffers.map(x => x._id) } }).select("createdAt").lean(); const dateMap=new Map(requestDates.map(r=>[r._id.toString(),r.createdAt.getTime()]));
  const averageMinutesToFirstOffer=firstOffers.length?firstOffers.reduce((s,x)=>s+Math.max(0,x.first.getTime()-(dateMap.get(x._id.toString())||x.first.getTime())),0)/firstOffers.length/60000:0;
  const acceptedRows=await Bid.find({status:"accepted"}).select("initialStudentRate amount createdAt viewedAt").lean();
  const averageNegotiatedDiscount=acceptedRows.length?acceptedRows.reduce((s,o)=>s+((o.initialStudentRate-o.amount)/o.initialStudentRate*100),0)/acceptedRows.length:0;
  const averageAgreedRate=acceptedRows.length?acceptedRows.reduce((s,o)=>s+o.amount,0)/acceptedRows.length:0;
  const responseRows=await Bid.find({viewedAt:{$exists:true}}).select("createdAt viewedAt").lean(); const averageTutorResponseMinutes=responseRows.length?responseRows.reduce((s,o)=>s+Math.max(0,(o.viewedAt!.getTime()-o.createdAt.getTime())/60000),0)/responseRows.length:0;
  const marketplaceGMV=bookings.reduce((s,b)=>s+(b.studentTotal||b.subtotal||b.amount||0),0); const platformRevenue=bookings.reduce((s,b)=>s+(b.tutorFee||b.platformFee||0),0);
  res.json({
    success: true,
    metrics: {
      totalRequests,
      activeRequests,
      expiredRequests,
      repostedRequests,
      extendedRequests,
      totalOffers,
      zeroOfferRequests: zeroOfferRequests[0]?.count || 0,
      threeOfferCoverageRate: totalRequests ? ((requestsWithThreeOffers[0]?.count || 0) / totalRequests) * 100 : 0,
      averageOffersPerRequest: totalRequests ? totalOffers / totalRequests : 0,
      averageMinutesToFirstOffer,
      offerAcceptanceRate: totalOffers ? acceptedOffers / totalOffers * 100 : 0,
      averageNegotiatedDiscount,
      averageAgreedRate,
      averageTutorResponseMinutes,
      bookingsGenerated: bookings.length,
      conversionRate: totalRequests ? bookings.length / totalRequests * 100 : 0,
      marketplaceGMV,
      platformRevenue,
      completionRate: bookings.length ? completed / bookings.length * 100 : 0,
      cancellationRate: bookings.length ? cancelled / bookings.length * 100 : 0,
      disputeRate: totalRequests ? disputed / totalRequests * 100 : 0,
      negotiationEvents: negotiations,
      activeRelationships,
      repeatRelationships,
      repeatRelationshipRate: activeRelationships ? (repeatRelationships / activeRelationships) * 100 : 0,
      activeRelationships30d: relationships30d,
      activeRelationships60d: relationships60d,
      activeRelationships90d: relationships90d,
      classifiedLostRequests,
      unclassifiedLostRequests,
      lossReasons: lossReasonRows.reduce((acc: Record<string, number>, row: { _id: string; count: number }) => {
        acc[row._id] = row.count;
        return acc;
      }, {}),
    },
  });
};

export const listMarketplaceRequests=async(req:AuthRequest,res:Response):Promise<void>=>{const filter:Record<string,unknown>={};for(const key of ["subject","city","status","teachingMode","lossReason"] as const)if(req.query[key])filter[key]=req.query[key];if(req.query.minPrice||req.query.maxPrice)filter.budget={...(req.query.minPrice?{$gte:Number(req.query.minPrice)}:{}),...(req.query.maxPrice?{$lte:Number(req.query.maxPrice)}:{})};const requests=await Request.find(filter).populate("student","name city").sort("-createdAt").limit(200).lean();res.json({success:true,requests})};
export const listMarketplaceOffers=async(req:AuthRequest,res:Response):Promise<void>=>{const filter:Record<string,unknown>={};if(req.query.status)filter.status=req.query.status;if(req.query.flagged==="true")filter.flaggedForModeration=true;const offers=await Bid.find(filter).populate("tutor","name avatar city").populate("request","subject city level teachingMode budget status").sort("-createdAt").limit(300).lean();res.json({success:true,offers})};
export const getMarketplaceOfferDetail=async(req:AuthRequest,res:Response):Promise<void>=>{const offer=await Bid.findById(req.params.id).populate("tutor","name avatar city").populate("request","subject city level teachingMode budget status student").lean();if(!offer){res.status(404).json({success:false,message:"Offer not found."});return}const history=await OfferNegotiation.find({offer:offer._id}).populate("senderUser","name role").sort("sequenceNumber").lean();res.json({success:true,offer,history})};
