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

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

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
    const text = response.data.output_text;
    if (typeof text !== 'string') {
      console.error('OpenAI response did not contain output text');
      return res.status(502).json({ error: 'Invalid response from OpenAI' });
    }
    return res.json({ text });
  } catch (err) {
    console.error('OpenAI request failed:', err.response?.status || err.message || err);
    return res.status(502).json({ error: 'OpenAI request failed' });
  }
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;  // Get the code from the query string

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
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
    const redirectUrl = `http://localhost:4200/callback?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`;
    
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error during token exchange:', err);
    res.status(500).json({ error: 'Token exchange failed' });
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

    const { access_token, expires_in } = response.data;
    res.json({ access_token, expires_in });
  } catch (err) {
    console.error('Failed to refresh token:', err.message || err);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

app.listen(8888, () => {
  console.log('Backend running on http://127.0.0.1:8888');
});