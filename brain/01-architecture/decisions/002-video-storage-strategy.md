# 002. Video Storage Strategy - AWS S3 + CloudFront CDN

**Date:** 2025-12-03
**Status:** Accepted
**Deciders:** Engineering Team, Infrastructure Team
**Tags:** infrastructure, video, storage, cdn

## Context

Scrollio is a video-first application. Users will watch dozens of short educational videos per session. We need a storage and delivery solution that:

**Requirements:**
- **High throughput:** Support thousands of concurrent video streams
- **Low latency:** Videos must start playback within 1 second
- **Global reach:** Users worldwide need fast access
- **Cost-effective:** Video storage and bandwidth can get expensive
- **Scalability:** Support growth from hundreds to millions of videos
- **Security:** Prevent unauthorized access, support pre-signed URLs for uploads
- **Reliability:** 99.99%+ uptime, no data loss

**Constraints:**
- Videos are short (<60 seconds, ~5-20 MB each)
- MVP will have ~1,000 videos, growing to 100K+ over time
- Budget: Keep storage + CDN costs under $500/month for MVP
- Integration with Supabase for metadata storage

## Decision

**We will use AWS S3 for video storage and AWS CloudFront as CDN for video delivery.**

**Architecture:**
```
User uploads video → Supabase Edge Function → AWS S3 (pre-signed URL)
                                           ↓
                                    S3 stores video
                                           ↓
                             Metadata saved to Supabase DB
                                           ↓
User requests video → Supabase DB (get CloudFront URL) → CloudFront → S3
```

**We will:**
- Store all videos in AWS S3
- Serve all videos via CloudFront CDN
- Use pre-signed URLs for secure video uploads
- Store video metadata (title, duration, URL) in Supabase PostgreSQL
- Use S3 lifecycle policies to archive old/unused videos to Glacier
- Implement multiple resolutions (360p, 720p, 1080p) for adaptive streaming (future)

**We will not:**
- Store videos in Supabase Storage (too expensive and slow)
- Serve videos directly from S3 (slow, expensive egress)
- Self-host video storage (operational complexity)
- Use video transcoding initially (MVP uses uploaded format)

## Consequences

### Positive

- **Proven scalability:** S3 + CloudFront proven at massive scale (Netflix, etc.)
- **Global performance:** CloudFront edge locations worldwide = low latency
- **Cost-effective storage:** S3 is cheap ($0.023/GB/month)
- **High reliability:** 99.999999999% durability (S3), 99.99% availability (CloudFront)
- **Security:** IAM policies, bucket policies, pre-signed URLs for access control
- **Lifecycle management:** Auto-archive old videos to Glacier ($0.004/GB/month)
- **Bandwidth:** CloudFront pricing reasonable for video ($0.085/GB)
- **Integration:** Works seamlessly with Supabase Edge Functions for upload webhooks
- **Future-proof:** Easy to add video transcoding (AWS MediaConvert) later

### Negative

- **AWS complexity:** Need to manage IAM roles, bucket policies, CloudFront distributions
- **Cost unpredictability:** Bandwidth costs can spike with high usage
- **Multi-cloud:** Adds AWS to our stack (Supabase, AWS)
- **Learning curve:** Team needs to learn AWS S3 and CloudFront

**Mitigations:**
- Use Infrastructure as Code (Terraform) to manage AWS resources
- Set up CloudWatch alerts for unusual bandwidth spikes
- Cache videos aggressively (1 week) to reduce S3 requests
- Document all AWS configurations in `brain/03-api/aws/`

### Neutral

- **Vendor diversity:** Using AWS and Supabase reduces single-vendor risk
- **Edge Functions:** Supabase Edge Functions handle upload webhooks to S3

## Alternatives Considered

### Alternative 1: Supabase Storage

**Pros:**
- Integrated with Supabase (single platform)
- Built-in access control with RLS
- Easy to use

**Cons:**
- **Cost:** Storage is $0.021/GB + $0.09/GB egress (vs S3 $0.023/GB storage + CloudFront $0.085/GB)
- **Performance:** No global CDN (slower for international users)
- **Scalability:** Not designed for high-bandwidth video delivery
- **Bandwidth:** Egress costs higher than CloudFront

**Why rejected:**
Supabase Storage is great for user avatars and thumbnails, but not optimized for video delivery. S3 + CloudFront is faster and more cost-effective at scale.

**What we'll use Supabase Storage for:** User avatars, video thumbnails (small files <1 MB)

---

### Alternative 2: Cloudflare R2 + Cloudflare CDN

**Pros:**
- S3-compatible API (easy migration from S3)
- **Zero egress fees** (huge cost savings)
- Global CDN included
- Competitive storage pricing

**Cons:**
- Less mature than AWS S3 (launched 2022)
- Smaller ecosystem (fewer integrations)
- Less battle-tested at scale
- Team has more AWS experience

**Why rejected (for now):**
Cloudflare R2 is very promising, especially with zero egress fees. We'll revisit this when we outgrow AWS pricing or if egress costs become prohibitive. For MVP, AWS S3 + CloudFront is the safer, more proven choice.

**Future consideration:** Migrate to Cloudflare R2 if AWS egress costs exceed $500/month.

---

### Alternative 3: Google Cloud Storage + Cloud CDN

**Pros:**
- Similar to AWS S3 + CloudFront
- Good performance and reliability
- Competitive pricing

**Cons:**
- Team has less GCP experience
- Less ecosystem integration than AWS
- No significant advantages over AWS for our use case

**Why rejected:**
No compelling reason to choose GCP over AWS. Team familiarity with AWS makes S3 + CloudFront the better choice.

---

### Alternative 4: Self-Hosted Video Storage

**Pros:**
- Full control over infrastructure
- No per-GB costs (fixed server costs)

**Cons:**
- **Operational complexity:** Need to manage servers, backups, scaling, CDN setup
- **Reliability risk:** Hard to achieve 99.99% uptime without significant DevOps effort
- **Upfront costs:** Need to provision servers, storage, bandwidth
- **Not cost-effective at small scale:** Fixed costs higher than S3 for <100K users

**Why rejected:**
Far too much operational overhead for a small team. S3 + CloudFront lets us focus on product, not infrastructure.

---

### Alternative 5: Specialized Video Platforms (Vimeo, Wistia, Mux)

**Pros:**
- Purpose-built for video delivery
- Built-in player, analytics, adaptive streaming
- Easy to use

**Cons:**
- **Expensive:** $0.10-0.30/GB for delivery (vs CloudFront $0.085/GB)
- **Vendor lock-in:** Hard to migrate videos out
- **Overkill for MVP:** We don't need advanced video analytics yet

**Why rejected:**
Too expensive for MVP scale. We can add specialized video features (adaptive streaming, analytics) later using AWS services if needed.

## Implementation Notes

### S3 Bucket Structure

```
scrollio-videos/
├── raw/                      # Original uploaded videos
│   └── {video-id}.mp4
├── transcoded/               # Future: multiple resolutions
│   ├── 360p/
│   ├── 720p/
│   └── 1080p/
└── thumbnails/               # Video thumbnails (generated)
    └── {video-id}.jpg
```

### S3 Bucket Configuration

- **Region:** us-east-1 (or closest to majority of users)
- **Versioning:** Disabled (videos are immutable)
- **Encryption:** AES-256 (at rest)
- **Public access:** Blocked (all access via CloudFront)
- **CORS:** Enabled for browser uploads

### CloudFront Configuration

- **Origin:** S3 bucket (`scrollio-videos.s3.amazonaws.com`)
- **Caching:** 1 week (videos are immutable)
- **Compression:** Gzip enabled
- **HTTPS only:** Enforce SSL
- **Price class:** Use all edge locations (global reach)
- **Signed URLs:** Not used initially (all videos public), add later for premium content

### Upload Flow

1. User requests upload URL from Supabase Edge Function
2. Edge Function generates S3 pre-signed URL (valid for 15 minutes)
3. User uploads video directly to S3 using pre-signed URL
4. S3 triggers webhook to Supabase Edge Function on upload completion
5. Edge Function extracts metadata (duration, resolution) and saves to Supabase DB
6. Supabase DB stores video metadata with CloudFront URL

### Video Delivery Flow

1. User requests video list from Supabase DB
2. Supabase returns video metadata with CloudFront URLs
3. User plays video from CloudFront (not S3 directly)
4. CloudFront caches video at edge location for 1 week
5. Subsequent users in same region get cached video (fast!)

### Cost Estimates (MVP, 1,000 users)

**Assumptions:**
- 1,000 videos @ 10 MB each = 10 GB storage
- Each user watches 20 videos/day
- 1,000 users × 20 videos/day × 10 MB = 200 GB/day = 6 TB/month bandwidth

**Costs:**
- S3 storage: 10 GB × $0.023/GB = **$0.23/month**
- CloudFront bandwidth: 6,000 GB × $0.085/GB = **$510/month**
- S3 requests: Negligible (<$1/month with CloudFront caching)

**Total: ~$511/month** (within budget)

**At 10,000 users:**
- Storage: 100 GB × $0.023 = $2.30/month
- Bandwidth: 60 TB × $0.085 = $5,100/month
- **Total: ~$5,102/month**

**Cost optimization strategies:**
- Aggressive caching (reduce S3 requests)
- Compress videos before upload (reduce bandwidth)
- Implement adaptive bitrate (serve lower quality when needed)
- Archive old/unused videos to Glacier

### Future Enhancements

**Phase 2: Video Transcoding (Months 4-6)**
- Use AWS MediaConvert to transcode videos into multiple resolutions (360p, 720p, 1080p)
- Implement adaptive bitrate streaming (HLS or DASH)
- Reduce bandwidth costs by serving appropriate quality

**Phase 3: Advanced Features (Months 7-9)**
- Video thumbnails auto-generation
- Video compression optimization
- Cloudflare R2 migration (if costs too high)
- Pre-loading next video in feed (reduce perceived latency)

## Related Decisions

- [ADR-001: Database Choice](./001-database-choice.md) - Supabase for metadata storage
- [ADR-007: Video Playback](./007-video-playback-expo-av.md) - expo-av for video playback

## References

- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [AWS CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [S3 Video Streaming Best Practices](https://aws.amazon.com/blogs/media/streaming-videos-to-mobile-app-users-via-amazon-cloudfront-cdn/)
- [Cloudflare R2 Pricing](https://www.cloudflare.com/products/r2/)

## Review Schedule

**Next review:** Q2 2026 or when bandwidth costs exceed $1,000/month
**Review frequency:** Quarterly review of costs and performance

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-03 | Initial decision | Engineering Team |
