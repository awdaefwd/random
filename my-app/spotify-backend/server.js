// server.js
import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
//import SpotifyAuthService from '../../src/app/services/spotify-auth.service';

const app = express();

const requiredEnv = ['OPENAI_API_KEY', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
for (const name of requiredEnv) {
  if (!process.env[name] || process.env[name].startsWith('replace-with-')) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

app.use(cors({
  origin: ['http://127.0.0.1:8888','http://localhost:4200'], // Ensure your Angular frontend is allowed
  methods: ['GET', 'POST'],
  credentials: true // Optional if you’re using cookies or sessions
}));

app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';
const FRONTEND_URL = process.env.SPOTIFY_FRONTEND_URL || 'http://localhost:4200';

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

function getOpenAIOutputText(data) {
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  if (!Array.isArray(data?.output)) {
    return null;
  }

  const text = data.output
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(content => content?.type === 'output_text' && typeof content.text === 'string')
    .map(content => content.text)
    .join('');

  return text || null;
}

app.post('/api/openai', async (req, res) => {
  const { prompt } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A non-empty prompt is required' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      { model: 'gpt-5.4-mini', input: prompt },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
    );
    const text = getOpenAIOutputText(response.data);
    if (text === null) {
      console.error('OpenAI response did not contain output text:', {
        responseId: response.data?.id,
        status: response.data?.status,
        incompleteReason: response.data?.incomplete_details?.reason,
        outputTypes: Array.isArray(response.data?.output)
          ? response.data.output.map(item => item?.type).filter(Boolean)
          : [],
      });
      return res.status(502).json({ error: 'Invalid response from OpenAI' });
    }
    return res.json({ text });
  } catch (err) {
    console.error('OpenAI request failed:', {
      status: err.response?.status || 'network error',
      type: err.response?.data?.error?.type,
      code: err.response?.data?.error?.code,
      requestId: err.response?.headers?.['x-request-id'],
      message: err.response?.data?.error?.message || err.message || 'unknown',
    });
    return res.status(502).json({ error: 'OpenAI request failed' });
  }
});

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const callbackUrl = new URL('/callback', FRONTEND_URL);

  if (!code) {
    callbackUrl.searchParams.set(
      'auth_error',
      error === 'access_denied' ? 'access_denied' : 'missing_code',
    );
    return res.redirect(callbackUrl.toString());
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    });

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
    });

    
    //console.log('Access Token:', response.data.access_token); // Log the token for debugging
    //res.json(response.data); Send the token response back to the frontend
    const { access_token, refresh_token, expires_in } = response.data;
    if (!access_token || !refresh_token || !expires_in) {
      throw new Error('Spotify token response is missing required fields');
    }

    callbackUrl.hash = new URLSearchParams({
      access_token,
      refresh_token,
      expires_in: String(expires_in),
    }).toString();
    return res.redirect(callbackUrl.toString());
  } catch (err) {
    console.error('Spotify authorization code exchange failed:', {
      status: err.response?.status || 'invalid response',
      error: err.response?.data?.error || err.message || 'unknown',
    });
    callbackUrl.searchParams.set('auth_error', 'token_exchange_failed');
    return res.redirect(callbackUrl.toString());
  }
});



app.post('/api/exchange-code', async (req, res) => {
  console.log('🔥 /api/exchange-code called');
  console.log('Code:', req.body.code);  // Ensure the code is coming from the frontend

  try {
    const { code } = req.body;

    // Token exchange logic
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    });

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      }
    });

    console.log('Access Token:', response.data.access_token); // Log the access token for debugging
    res.json(response.data); // Send the response back to Angular
  } catch (err) {
    console.error('Error in token exchange:', err.message || err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.post('/api/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Refresh token missing' });

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
  });

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
    });

    const { access_token, expires_in, refresh_token: updatedRefreshToken } = response.data;
    res.json({ access_token, expires_in, refresh_token: updatedRefreshToken || refresh_token });
  } catch (err) {
    const spotifyError = err.response?.data?.error;
    console.error('Failed to refresh Spotify token:', {
      status: err.response?.status || 'network error',
      error: spotifyError || err.code || 'unknown',
    });

    if (spotifyError === 'invalid_grant') {
      return res.status(401).json({ error: 'Spotify authorization expired; sign in again.' });
    }
    if (spotifyError === 'invalid_client') {
      return res.status(500).json({ error: 'Spotify app credentials are invalid.' });
    }
    return res.status(502).json({ error: 'Spotify token refresh failed.' });
  }
});

app.listen(8888, () => {
  console.log('Backend running on http://127.0.0.1:8888');
});