const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/generate-workout', (req, res) => {
    const userData = req.body;
    console.log('Received user data:', userData);

    // Placeholder for Vertex AI logic
    const workoutPlan = {
        title: "Your Personalized Workout Plan",
        plan: [
            { day: "Monday", activity: "Full Body Strength Training" },
            { day: "Wednesday", activity: "Cardio and Core" },
            { day: "Friday", activity: "Full Body Strength Training" }
        ]
    };

    res.json(workoutPlan);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
