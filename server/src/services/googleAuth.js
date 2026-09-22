import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (credentialToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId.trim() === '' || clientId.includes('your_google_client_id')) {
    // If not configured, handle gracefully
    throw new Error(
      'Google Client ID is not configured in server/.env. Please configure GOOGLE_CLIENT_ID to use Google Sign-In, or use Quick Demo Login.'
    );
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credentialToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      profilePicture: payload.picture,
    };
  } catch (error) {
    throw new Error(`Google token verification failed: ${error.message}`);
  }
};
