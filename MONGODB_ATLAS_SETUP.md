# MongoDB Atlas Setup for Render Deployment

## 🚀 Quick Setup Guide

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (choose free tier M0)
4. Wait for cluster creation (takes 3-5 minutes)

### Step 2: Configure Database Access
1. In Atlas dashboard, go to **Database Access**
2. Click **Add New Database User**
3. Create a user with username and password (remember these!)
4. Set privileges to **Read and write to any database**

### Step 3: Configure Network Access
1. Go to **Network Access** in Atlas dashboard
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

### Step 4: Get Connection String
1. Go to **Database** section
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Configure Render Environment Variables
1. In your Render dashboard, go to your service
2. Go to **Environment** tab
3. Add environment variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string (replace `<username>` and `<password>` with your actual credentials)
   
   Example:
   ```
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/bus?retryWrites=true&w=majority
   ```

### Step 6: Redeploy
1. Go to **Manual Deploy** in Render
2. Click **Deploy latest commit**
3. Your app should now connect to MongoDB Atlas successfully!

## 📝 Important Notes

- **Database Name**: Add `/bus` at the end of your connection string to specify the database name
- **Security**: Never commit your MongoDB credentials to GitHub
- **Free Tier**: MongoDB Atlas free tier (M0) provides 512MB storage
- **Connection Limits**: Free tier allows up to 100 connections

## 🔧 Troubleshooting

**If connection still fails:**
1. Double-check your username/password in the connection string
2. Ensure IP whitelist includes 0.0.0.0/0
3. Verify the connection string format
4. Check Render logs for specific error messages

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

## ✅ What We Fixed

- ✅ Added environment variable support for MongoDB URI
- ✅ Created proper database connection function
- ✅ Added error handling for database connections
- ✅ Configured PORT for Render deployment

Your application is now ready for cloud deployment with MongoDB Atlas!
