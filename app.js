import cors from 'cors';
import {payloadRouter} from './src/routes/payloadRoutes.js'; 
import express from 'express';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
  })
);

app.use('/api/payload', payloadRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;