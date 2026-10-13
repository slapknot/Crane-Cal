import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Parse Crane Load Chart from Image or PDF
app.post('/api/parse-load-chart', async (req, res) => {
  try {
    const { imageBase64, mimeType, filename } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on server.',
        fallbackAvailable: true,
      });
    }

    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const promptText = `
You are an expert heavy crane engineer. Analyze this crane load chart image or PDF document (Table 1 / Lifting Capacity Table).
Extract the structured lifting capacity data:
1. Crane Model name and rated capacity (in Metric Tons).
2. All available Main Boom Lengths in meters (e.g., [11.4, 15.3, 19.3, 25.2, 31.1, 37.0, 43.0]).
3. Working Radius entries in meters with their corresponding rated capacities in kilograms (kg) for each boom length.
Ensure all capacities are in kilograms (kg) (e.g., 7300 for 7.3t, 55000 for 55t).
If a cell is blank or "-" or empty, do not include it or set it undefined.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/png',
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            craneName: { type: Type.STRING, description: 'Crane model name e.g. Zoomlion QY55D 55t' },
            modelCode: { type: Type.STRING, description: 'Model code e.g. QY55D' },
            maxCapacityTon: { type: Type.NUMBER, description: 'Max rated capacity in tons e.g. 55' },
            boomLengths: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: 'Array of boom lengths in meters',
            },
            minRadius: { type: Type.NUMBER },
            maxRadius: { type: Type.NUMBER },
            loadChart: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  radius: { type: Type.NUMBER },
                  capacities: {
                    type: Type.OBJECT,
                    description: 'Key-value map of boom length as string to capacity in kg',
                  },
                },
                required: ['radius', 'capacities'],
              },
            },
          },
          required: ['craneName', 'maxCapacityTon', 'boomLengths', 'loadChart'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (err: any) {
    console.error('Error parsing load chart with Gemini:', err);
    return res.status(500).json({
      error: err.message || 'Failed to extract load chart',
      fallbackAvailable: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CraneLift Pro Server listening on port ${port}`);
  });
}

startServer();
