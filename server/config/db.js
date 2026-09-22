import mongoose from 'mongoose';
import dns from 'dns';
import { encryptLegacyPlaintextPasswords, syncEmailVerificationStatus } from '../services/dataStore.js';

// Resolve MongoDB Atlas SRV records on Windows networks where local DNS blocks querySrv
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS is not permitted
}

let connectionPromise = null;

export const connectDB = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  // If a connection attempt is in-flight, await it
  if (connectionPromise) {
    return await connectionPromise;
  }

  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    console.warn('\n⚠️  [MongoDB Warning]: MONGO_URI is not set in server/.env');
    console.warn('👉 Please set your MongoDB Atlas connection string in server/.env to enable database features.\n');
    return false;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: process.env.MONGO_DB_NAME || 'ExpenseX',
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Atlas Connected (${conn.connection.name})...✅`);
      // Ensure any legacy plaintext passwords are encrypted with bcrypt immediately
      await encryptLegacyPlaintextPasswords();
      // Ensure Google accounts and verified emails have isEmailVerified: true in database
      await syncEmailVerificationStatus();
      return true;
    } catch (error) {
      console.error('Check that your IP address is whitelisted in MongoDB Atlas Network Access (e.g., allow 0.0.0.0/0 for dev) and your credentials are correct.\n');
      connectionPromise = null;
      return false;
    }
  })();

  return await connectionPromise;
};

export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  return {
    stateCode: state,
    status: states[state] || 'unknown',
    isConfigured: Boolean(process.env.MONGO_URI && process.env.MONGO_URI.trim() !== ''),
  };
};
