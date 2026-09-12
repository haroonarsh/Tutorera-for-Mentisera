# 🚀 Deployment Checklist

Complete these steps to activate automated deployments.

## ✅ Quick Setup (5 minutes)

### Step 1: Gather Required Secrets

#### 🔴 Render (Backend)
- [ ] `RENDER_SERVICE_ID` - Copy from Render dashboard > Services > Your service
- [ ] `RENDER_API_KEY` - Create in Account Settings > API Keys

#### 🔵 Vercel (Frontend)
- [ ] `VERCEL_TOKEN` - Create at [vercel.com/account/tokens](https://vercel.com/account/tokens)
- [ ] `VERCEL_ORG_ID` - Find in account settings
- [ ] `VERCEL_PROJECT_ID` - Find in project settings

#### 🟠 Cloudflare (Workers)
- [ ] `CLOUDFLARE_API_TOKEN` - Create in Account > API Tokens
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Copy from Overview page

#### 💬 Slack (Notifications - Optional but Recommended)
- [ ] `SLACK_WEBHOOK_DEPLOY` - Create incoming webhook in Slack workspace

### Step 2: Add Secrets to GitHub

Go to: **GitHub.com → Your Repo → Settings → Secrets and Variables → Actions**

Add each secret:
```
Repository Secret Name          | Value
------------------------------- | -----
RENDER_SERVICE_ID              | [from above]
RENDER_API_KEY                 | [from above]
VERCEL_TOKEN                   | [from above]
VERCEL_ORG_ID                  | [from above]
VERCEL_PROJECT_ID              | [from above]
CLOUDFLARE_API_TOKEN           | [from above]
CLOUDFLARE_ACCOUNT_ID          | [from above]
SLACK_WEBHOOK_DEPLOY           | [from above - optional]
```

### Step 3: Test the Setup

Push a test commit to main:
```bash
git commit --allow-empty -m "test: trigger deployment workflows"
git push origin main
```

Check GitHub Actions tab to verify all workflows start.

---

## 📋 Workflow Verification

Once secrets are configured, verify each workflow:

| Workflow | Status | When It Runs |
|----------|--------|--------------|
| `ci` | ✅ Should exist | Every push |
| `deploy-backend` | ⏳ After setup | Backend changes |
| `deploy-frontend` | ⏳ After setup | Frontend changes |
| `deploy-cloudflare` | ⏳ After setup | Worker changes |
| `deploy-all` | ⏳ After setup | Manual or any push |

**How to verify:**
1. Go to **Actions** tab in GitHub
2. Look for the workflow names
3. Click on any workflow to see status
4. Green ✅ = working, Red ❌ = failed

---

## 🎯 What Happens Next

### When you push to main:

```
Your Code Push
    ↓
CI Workflow Runs (Build + Test)
    ↓ (only if tests pass)
├─→ Backend deployment to Render
├─→ Frontend deployment to Vercel  
└─→ Worker deployment to Cloudflare
    ↓
Slack notification sent
```

**Expected duration:** 3-5 minutes per service

### What to expect:

✅ **Success:**
- Green checkmarks in Actions tab
- New deployment live at:
  - Backend: https://tutorera-backend.onrender.com
  - Frontend: See Slack or Vercel dashboard
  - Worker: https://my-safepay-app.[ID].workers.dev
- Slack message with ✅ status

❌ **Failure:**
- Red X in Actions tab
- Click on failed job to see error logs
- Slack message with ❌ status and link to logs
- Previous deployment still live (automatic rollback on failure)

---

## 🔄 Common Workflows

### Deploy Just Backend

```bash
# Make a backend change
cd tutorera-backend
echo "# comment" >> src/server.ts
git add -A
git commit -m "fix(backend): some fix"
git push origin main
# Only deploy-backend.yml runs
```

### Deploy Just Frontend

```bash
# Make a frontend change
cd tutorera-frontend
echo "// comment" >> src/lib/axios.ts
git add -A
git commit -m "fix(frontend): some fix"
git push origin main
# Only deploy-frontend.yml runs
```

### Deploy Everything

```bash
# Make changes to any/all parts
# or manually trigger
gh workflow run deploy-all.yml
# All three deployments run in parallel
```

### Skip Deployment

```bash
# Add [skip-deploy] to commit message
git commit -m "docs: update README [skip-deploy]"
# Workflows run but skip deployment steps
```

---

## ⚠️ Troubleshooting

### Workflows don't appear in Actions tab

**Solution:** Secrets might not be set. Verify:
```bash
gh secret list
```

Should show all 8 secrets (or 7 without Slack).

### Build fails with "npm: not found"

**Solution:** Node.js cache issue. Check:
- [ ] `package-lock.json` exists in project root
- [ ] Correct working directory in workflow

### Deployment fails with 403 Unauthorized

**Solution:** API key or token is invalid
1. Regenerate the secret from source platform
2. Update GitHub secret
3. Retry deployment

### Slack notifications not sending

**Solution:** Optional feature, doesn't block deployment
1. Verify webhook URL is correct
2. Test webhook with:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test"}' \
     ${{ secrets.SLACK_WEBHOOK_DEPLOY }}
   ```

### Stuck in "Waiting for deployment"

**Solution:** Deployment taking longer than expected
1. Check Render/Vercel/Cloudflare dashboard
2. Look for build errors in those platforms
3. Increase timeout in workflow file (advanced)

---

## 📊 Deployment Dashboard

View all deployments:

**GitHub Actions Dashboard:**
```
https://github.com/[owner]/[repo]/actions
```

**Render Dashboard:**
```
https://dashboard.render.com/services/[your-service]
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard/[org]/[project]
```

**Cloudflare Dashboard:**
```
https://dash.cloudflare.com/account/workers
```

---

## 🎓 Learning Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Render Deployment](https://render.com/docs/deploy-node-express-app)
- [Vercel Deployment](https://vercel.com/docs/concepts/deployments)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Full Setup Guide](./GITHUB_ACTIONS_SETUP.md)

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] All 7-8 secrets added to GitHub
- [ ] First test push triggers workflows
- [ ] Backend deployment succeeds (Render)
- [ ] Frontend deployment succeeds (Vercel)
- [ ] Worker deployment succeeds (Cloudflare)
- [ ] Slack notifications working (if configured)
- [ ] URLs are live and responding
- [ ] Team members notified of auto-deployment setup

---

## 📞 Need Help?

1. Check **GITHUB_ACTIONS_SETUP.md** for detailed instructions
2. Review workflow logs in **Actions** tab
3. Check platform dashboards (Render/Vercel/Cloudflare)
4. Read troubleshooting section above

**Setup is complete when you see deployments running automatically on each push!** 🎉

