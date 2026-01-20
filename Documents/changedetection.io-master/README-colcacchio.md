# Col'Cacchio Uber Eats Store Monitoring

## Overview
Automated monitoring system for 50 Col'Cacchio stores on Uber Eats to track products, pricing, promotions, and changes multiple times per day.

## Current Setup
- **Tool:** changedetection.io (self-hosted via Docker)
- **URL:** http://127.0.0.1:5050
- **Browser:** Chrome/Playwright enabled for JavaScript rendering
- **Notifications:** Email via Gmail

## The Problem
Public Uber Eats pages (e.g., `ubereats.com/store/...`) return HTTP 429 errors due to aggressive bot detection. Direct scraping is blocked.

## Solution: Uber Eats Manager Monitoring
Monitor via the restaurant owner dashboard (merchants.ubereats.com) instead of public pages.

### Why This Works
- Legitimate authenticated access
- Contains authoritative menu/pricing data
- Multi-store dashboard supports all 50 locations
- Can export reports (CSV) for detailed analysis

## Quick Start

### Start the monitoring system
```bash
cd /Users/jason/Documents/changedetection.io-master
docker compose up -d
```

### Stop the system
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

### Access the UI
Open http://127.0.0.1:5050

## Configuration

### Docker Compose
The `docker-compose.yml` is configured with:
- changedetection.io container
- Chrome browser (sockpuppetbrowser) for JavaScript sites
- Timezone: Africa/Johannesburg
- Port: 5050

### Email Notifications
Configure in Settings > Notification URL list:
```
mailto://USERNAME:APP_PASSWORD@smtp.gmail.com:587?to=YOUR_EMAIL@gmail.com
```

**Note:** Use a Gmail App Password, not your regular password.

## Implementation Steps (TODO)

### Phase 1: Setup
- [ ] Generate new Gmail App Password (previous one was exposed)
- [ ] Configure email notification in changedetection.io settings
- [ ] Test email notifications

### Phase 2: Uber Eats Manager Monitoring
- [ ] Log into Uber Eats Manager manually to understand the login flow
- [ ] Identify key pages to monitor (Menu Maker, Analytics, etc.)
- [ ] Configure Browser Steps for automated login
- [ ] Set up Visual Selectors for menu/pricing data

### Phase 3: Scale to 50 Stores
- [ ] Option A: Monitor aggregate multi-store dashboard views
- [ ] Option B: Create individual watches per store (resource intensive)
- [ ] Option C: Set up scheduled report downloads (CSV exports)
- [ ] Configure check frequency (every 4-6 hours)

## Monitoring Strategies for 50 Stores

| Strategy | Pros | Cons |
|----------|------|------|
| Aggregate Dashboard | Efficient, single watch | Less granular |
| Per-Store Watches | Detailed tracking | 50 watches, resource heavy |
| Report Downloads | Structured data (CSV) | Manual/scheduled process |

**Recommended:** Start with aggregate dashboard monitoring + weekly report exports.

## Alternative Options (If Needed)

### Residential Proxy Service
If public page monitoring is needed later:
- Bright Data, Oxylabs, or Webshare
- Cost: ~$10-50+/month
- Configure in Settings > CAPTCHA & Proxies

### Uber Eats API
- Requires developer account and approval
- Official endpoints: `GET /eats/stores/{store_id}/menus`
- Best for programmatic access at scale

## Key URLs
- **changedetection.io UI:** http://127.0.0.1:5050
- **Uber Eats Manager:** https://merchants.ubereats.com
- **Test Store:** https://www.ubereats.com/store/colcacchio-go-westlake/yoUAPkXmVMG59qBfX3z_5A

## Files
- `docker-compose.yml` - Docker configuration
- `README-colcacchio.md` - This file

## Resources
- [changedetection.io Wiki](https://github.com/dgtlmoon/changedetection.io/wiki)
- [Browser Steps Guide](https://github.com/dgtlmoon/changedetection.io/wiki/Browser-Steps)
- [Proxy Configuration](https://github.com/dgtlmoon/changedetection.io/wiki/Proxy-configuration)
- [Uber Eats Manager Help](https://help.uber.com/merchants-and-restaurants)
