import cors from 'cors';
import {payloadRouter} from './src/routes/payloadRoutes.js'; 
import express from 'express';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});


app.use('/api/payload', payloadRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;