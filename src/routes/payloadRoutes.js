import express from 'express';
import cors from 'cors';
import { runFullEvaluation } from '../services/chain.js';

const router = express.Router();
const doDontGuidelines = `Do's
1. Provide a clear introduction
   - Briefly explain what Milanote is before diving into your project.
2. Highlight general creative uses
   - Emphasize how Milanote can benefit multiple types of creative work, not just YouTube content.
3. Invite viewers to sign up (not download)
   - Direct users to “sign up for free,” avoiding any mention of downloading.
4. Include a strong call to action
   - Encourage viewers to click the link in the description and try Milanote.

DON'TS
1. Mentioning YouTube Planning
   - Avoid talking about YouTube-specific tasks like thumbnails, titles, or posting schedules.
2. Neglecting an introduction
   - Do not skip a basic explanation that “Milanote is an online tool for organizing creative projects.”
3. Sign-Up Instructions
   - Do not tell viewers to “download” Milanote; always say “sign up for free.”
4. Forgetting a Call to Action
   - Remember to explicitly tell viewers to sign up using the link in the description.`;
   
// Use CORS Middleware
router.use(cors());

// Example route for getting all users
router.get('/', (req, res) => {
    res.json({ message: 'Payload received' });
});

// Example route for creating a user
router.post('/', async (req, res) => {
    const { script } = req.body;
    const result = await runFullEvaluation({
            script: script,
            guidelines: doDontGuidelines,
          });
    if (!script) {
        return res.status(400).json({ error: "Script is required in the payload" });
    }    
    res.json({ message: result });
});

export const payloadRouter = router;
