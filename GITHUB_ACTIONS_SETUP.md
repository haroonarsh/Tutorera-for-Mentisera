# GitHub Actions CI/CD Setup Guide

This document explains how to set up the automated deployment workflows for Tutorera.

## 📋 Overview

Four GitHub Actions workflows are configured:

1. **`ci.yml`** - Build & Test (existing)
   - Runs on: All pushes and PRs to main
   - Tests backend, frontend, and code quality

2. **`deploy-backend.yml`** - Deploy to Render
   - Runs on: Push to main (backend changes)
   - Deploys Node.js backend to Render hosting

3. **`deploy-frontend.yml`** - Deploy to Vercel
   - Runs on: Push to main (frontend changes)
   - Deploys Next.js frontend to Vercel

4. **`deploy-cloudflare.yml`** - Deploy to Cloudflare
   - Runs on: Push to main (worker changes)
   - Deploys SafePay worker to Cloudflare

5. **`deploy-all.yml`** - Master Orchestration
   - Runs on: Manual trigger or all main pushes
   - Coordinates all three deployments
   - Sends consolidated Slack notifications

---

## 🔑 Required Secrets

Configure these in **GitHub Settings → Secrets and Variables → Actions**:

### Render Deployment
```
RENDER_SERVICE_ID     - Your Render service ID
RENDER_API_KEY        - Your Render API key
```

**How to get:**
1. Go to [render.com](https://render.com)
2. Navigate to your backend service
3. Copy Service ID from URL or settings
4. Create API key in Account Settings

### Vercel Deployment
```
VERCEL_TOKEN          - Your Vercel authentication token
VERCEL_ORG_ID         - Your Vercel organization ID
VERCEL_PROJECT_ID     - Your frontend project ID
```

**How to get:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token (scopes: all)
3. Copy token and org/project IDs from dashboard

### Cloudflare Deployment
```
CLOUDFLARE_API_TOKEN       - Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID      - Your Cloudflare account ID
```

**How to get:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Account → API Tokens → Create Token
3. Copy Account ID from Overview page

### Slack Notifications (Optional)
```
SLACK_WEBHOOK_DEPLOY  - Slack webhook URL for deployment notifications
```

**How to get:**
1. Go to Slack Workspace Settings
2. Create incoming webhook for #deployments channel
3. Copy webhook URL

---

## 🚀 Setting Up Secrets

### Via GitHub Web UI:

1. Go to your repository
2. **Settings → Secrets and Variables → Actions**
3. Click **New repository secret**
4. Add each secret above

### Via GitHub CLI:

```bash
gh secret set RENDER_SERVICE_ID --body "your-service-id"
gh secret set RENDER_API_KEY --body "your-api-key"
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set CLOUDFLARE_API_TOKEN --body "your-api-token"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id"
gh secret set SLACK_WEBHOOK_DEPLOY --body "your-webhook-url"
```

---

## 📊 Workflow Behaviors

### When You Push to Main

1. **`ci.yml` runs immediately**
   - Tests backend (tsc, jest)
   - Tests frontend (lint, build)
   - **Required to pass before deployment**

2. **`deploy-backend.yml` runs if:**
   - Changes in `tutorera-backend/**`
   - `ci.yml` passed
   - Deploys to Render, waits for live status

3. **`deploy-frontend.yml` runs if:**
   - Changes in `tutorera-frontend/**`
   - `ci.yml` passed
   - Deploys to Vercel, verifies with health check

4. **`deploy-cloudflare.yml` runs if:**
   - Changes in `my-safepay-app/**`
   - `ci.yml` passed
   - Deploys to Cloudflare Workers, verifies response

### Manual Deployment

To manually trigger all deployments:

```bash
# Via GitHub CLI
gh workflow run deploy-all.yml

# Or via GitHub Web UI:
# Actions → Deploy All Services → Run workflow
```

---

## 📈 Monitoring Deployments

### GitHub Actions Dashboard

1. Go to **Actions** tab in your repository
2. Click on workflow name to see:
   - Build status (✅ success or ❌ failed)
   - Deployment logs
   - Timing and duration
   - Deployment URLs

### Slack Notifications

When configured, you'll receive:
- ✅ Success notifications with deployment URLs
- ❌ Failure alerts with links to logs
- Summary of all three services

### Live URLs After Deployment

- **Backend:** `https://tutorera-backend.onrender.com`
- **Frontend:** Check Vercel dashboard or Slack notification
- **Worker:** `https://my-safepay-app.[ACCOUNT_ID].workers.dev`

---

## 🔧 Customization

### Skip Deployment for Specific Commit

Add `[skip-deploy]` to commit message:
```bash
git commit -m "fix: minor typo [skip-deploy]"
```

The workflows will still build/test but skip deployment steps.

### Change Deployment Trigger

Edit the `on.push.paths` in each workflow file:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'tutorera-backend/**'      # Only trigger on backend changes
      - '.github/workflows/**'      # Or workflow changes
```

### Modify Health Check Timeout

In `deploy-backend.yml`, change the wait loop count:
```yaml
for i in {1..60}; do  # 60 attempts × 10 seconds = 10 minutes
```

### Change Build Node Version

Update `actions/setup-node@v4` with version:
```yaml
with:
  node-version: 22  # Change to 20, 18, etc.
```

---

## ⚠️ Troubleshooting

### Deployment Fails with "Secret not found"

**Solution:** Verify all secrets are configured in GitHub Settings

```bash
# Check what secrets are set
gh secret list
```

### Build Fails with "Module not found"

**Solution:** Run locally to verify:
```bash
cd tutorera-backend
npm ci
npm run build
```

### Render Deployment Hangs

**Solution:** Check Render dashboard for build errors
- Increase timeout in `deploy-backend.yml`
- Verify environment variables are set in Render

### Vercel Deployment Fails

**Solution:** Check Vercel project settings
- Verify build command: `next build --webpack`
- Check environment variables
- Review deployment logs in Vercel dashboard

### Cloudflare Deployment Fails

**Solution:** Verify Cloudflare setup
```bash
# Test locally
cd my-safepay-app
npx wrangler deploy

# Check worker logs
npx wrangler tail
```

---

## 📝 Workflow Files

All workflow files are in `.github/workflows/`:

```
.github/workflows/
├── ci.yml                    # Build & test
├── deploy-backend.yml        # → Render
├── deploy-frontend.yml       # → Vercel
├── deploy-cloudflare.yml     # → Cloudflare
└── deploy-all.yml           # Master orchestration
```

---

## 🔄 Typical Deployment Flow

```
1. Developer pushes to main
   ↓
2. GitHub triggers all workflows
   ↓
3. CI workflow runs (test/lint)
   ↓
4. If CI passes:
   ├─→ Backend deployment to Render
   ├─→ Frontend deployment to Vercel
   └─→ Worker deployment to Cloudflare
   ↓
5. All notify Slack (success/failure)
   ↓
6. Developer sees summary in Actions tab
```

---

## ✅ Health Checks Performed

Each workflow includes automated health checks:

- **Backend:** Checks if Render service is "live"
- **Frontend:** HTTP 200 response from Vercel URL
- **Worker:** Any successful HTTP response

If health checks fail, the workflow alerts you but doesn't block subsequent deployments.

---

## 🎯 Best Practices

1. **Always run CI locally before pushing:**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

2. **Use meaningful commit messages:**
   ```bash
   git commit -m "feat(admin): add curriculum management"
   ```

3. **Watch the Actions tab during deployment:**
   - First deployment takes longer
   - Subsequent deployments are faster due to caching

4. **Set up Slack notifications:**
   - Keeps team informed of deployments
   - Alerts on failures immediately

5. **Test environment variables:**
   - Verify all secrets are set before first deployment
   - Test database connections after deployment

---

## 📞 Support

If workflows fail:

1. Check the **Actions → [Workflow Name]** tab
2. Click on the failed job
3. Expand the failing step for full logs
4. Common issues are usually environment variables or credential problems

For detailed help:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deployment Docs](https://render.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers)

