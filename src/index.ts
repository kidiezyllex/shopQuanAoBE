import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './config/database.js';
import { registerRoutes } from './routes.js';
import cors from 'cors';
import path from 'path';

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Credentials', 'access-control-allow-origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));
app.use(express.static('public'));

app.use('/_next/image', (req: Request, res: Response) => {
  const urlParam = req.query.url;
  if (typeof urlParam !== 'string') {
    return res.status(400).send('Invalid image url');
  }
  const imageUrl = decodeURIComponent(urlParam);
  if (imageUrl.startsWith('https://')) {
    res.redirect(imageUrl);
  } else {
    const localPath = path.join('public', imageUrl);
    res.sendFile(localPath);
  }
});

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;