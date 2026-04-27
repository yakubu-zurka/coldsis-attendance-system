# COLDSiS Staff Attendance System

A full-stack staff attendance tracking system built with React (Vite), Node.js (Express), and MongoDB.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB Atlas + Socket.io
- **Geolocation**: Strictly enforces office-only check-ins.

## Port Configuration (Development)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001` (Changed from 5000 to avoid Windows port conflicts)

## Deployment Guide

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Final version for deployment"
git push origin main
```

### Step 2: Backend Deployment (e.g., Render Web Service)
1. New → **Web Service**
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. **Environment Variables**:
   - `PORT`: 5001 (or as assigned)
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `FRONTEND_URL`: The URL of your deployed frontend

### Step 3: Frontend Deployment (e.g., Render Static Site)
1. New → **Static Site**
2. Root Directory: `./` (Root)
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend
   - `VITE_OFFICE_LAT`: Office Latitude
   - `VITE_OFFICE_LNG`: Office Longitude
   - `VITE_ALLOWED_RADIUS_METERS`: Geofence radius (e.g., 100)

---

## AWS Deployment Guide

AWS is more complex but offers robust scaling. We have containerized the app to make this easier.

### Option A: AWS App Runner (Easiest for Containers)
1. Push your code to GitHub.
2. In AWS Console, go to **App Runner**.
3. Create service: Source code repository.
4. For the **Backend**:
   - Source directory: `/backend`
   - Use **Service type: Container Image** and link it to AWS ECR.
5. For the **Frontend**:
   - Deploy as a **Static Site** using **AWS Amplify** or an **S3 Bucket** + **CloudFront**.

### Option B: Docker Compose (Local Testing)
To test the production build locally:
```bash
docker-compose up --build
```

### AWS Environment Variables
Ensure you set the same variables in the AWS console as listed in the Render guide above.
- The `VITE_API_URL` should point to your AWS Backend load balancer or App Runner URL.
