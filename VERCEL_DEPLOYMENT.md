# Vercel Deployment Guide

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **API Keys**: Prepare your API keys for environment variables

## Required Environment Variables

Set these in your Vercel dashboard (Project Settings > Environment Variables):

```bash
GOOGLE_API_KEY=your_google_api_key_here
AZURE_TTS_KEY=your_azure_tts_key_here  
AZURE_TTS_REGION=your_azure_region
YOUTUBE_API_KEY=your_youtube_api_key_here
ENVIRONMENT=production
```

## Deployment Steps

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: pdf-insights-platform
# - Directory: ./
# - Override settings? No
```

### Method 2: GitHub Integration
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

### Method 3: Direct Upload
1. Run `vercel` in project root
2. Upload files when prompted
3. Configure environment variables in dashboard

## Post-Deployment Configuration

### 1. Environment Variables
Add these in Vercel Dashboard > Project > Settings > Environment Variables:
- `GOOGLE_API_KEY`
- `AZURE_TTS_KEY`
- `AZURE_TTS_REGION`
- `YOUTUBE_API_KEY`
- `ENVIRONMENT=production`

### 2. Domain Configuration
- Your app will be available at `https://your-project-name.vercel.app`
- Configure custom domain in Project Settings if needed

### 3. Function Configuration
- API routes are automatically configured as serverless functions
- Each API endpoint will run as a separate function
- Functions have 10-second timeout by default

## Troubleshooting

### Build Issues
```bash
# If frontend build fails
cd frontend
npm install
npm run build

# Check for missing dependencies
npm audit fix
```

### API Issues
- Check Vercel function logs in dashboard
- Verify environment variables are set
- Ensure API keys are valid and have proper permissions

### File Upload Issues
- Vercel has file size limits for uploads
- Large files should use external storage (AWS S3, etc.)
- Consider implementing file streaming for large PDFs

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and usage metrics
- Track function execution times

### Logs
- View real-time logs in Vercel dashboard
- Use `vercel logs` command for CLI access
- Monitor API errors and performance

## Scaling Considerations

### Function Limits
- 10-second execution timeout
- 50MB deployment size limit
- Consider breaking large operations into smaller functions

### Storage
- Vercel is stateless - files don't persist between requests
- Use external storage for uploaded PDFs and generated content
- Consider databases for metadata and search indices

## Performance Optimization

### Frontend
- Vite build optimization is already configured
- Code splitting and lazy loading implemented
- Static assets are served from CDN

### Backend
- API functions are automatically cached
- Consider implementing Redis for session data
- Use CDN for static content delivery

## Security

### API Keys
- Never commit API keys to version control
- Use Vercel environment variables
- Rotate keys regularly

### CORS
- Configure CORS origins for production
- Limit to your domain for security

### File Uploads
- Implement file type validation
- Set file size limits
- Scan for malicious content

## Support

If you encounter issues:
1. Check Vercel documentation
2. Review function logs in dashboard
3. Test API endpoints individually
4. Verify environment variables

For project-specific issues, check the main README.md for additional configuration details.
