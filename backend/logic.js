const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config(); // <-- Add this line at the top

const app = express();
const port = 3000;

// --- SECURE CONFIGURATION: Loading from .env file ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // <-- This loads the key securely

app.use(cors());
app.use(express.json());

// --- UNCONVENTIONAL AI GENERATION FUNCTION ---
// CORRECTED: The function now accepts all the new data points.
async function generatePlanWithVertexAI(age, gender, diet, availableDays, goal, experience, equipment, healthNotes) {
    console.log("Attempting UNCONVENTIONAL generation with Google AI Studio...");

    const model = 'gemini-1.5-pro-latest';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
        Act as an elite virtual personal trainer and nutritionist creating a premium, detailed, weekly fitness protocol in a strict JSON format.

        CLIENT DATA:
        - Age: ${age}
        - Gender: ${gender}
        - Primary Goal: ${goal}
        - Experience Level: ${experience}
        - Diet: ${diet}
        - Available Days: ${availableDays.join(', ')}
        - Available Equipment: ${equipment.join(', ')}
        - Health Notes: ${healthNotes || 'None'}

        INSTRUCTIONS:
        Create a comprehensive plan based on ALL the client data. The JSON response MUST have the following structure:
        1. A root object.
        2. A key "introduction" (string) with a short, encouraging, personalized message that acknowledges the user's goal and age.
        3. A key "dietaryRecommendations" (object) containing:
            - "summary" (string): A paragraph explaining the dietary approach based on the user's goal (cutting, bulking).
            - "calorieTarget" (string): An estimated daily calorie target (e.g., "2200-2400 kcal").
            - "macroSplit" (object): An object with "protein", "carbs", and "fat" keys, with string values representing percentages (e.g., "40%", "40%", "20%").
            - "mealExamples" (object): An object with "breakfast", "lunch", and "dinner" keys, each with a string value giving a sample meal idea that fits the diet type and goal.
        4. A key "weeklyPlan" which is an object containing keys for each day of the week.
        5. Each day object MUST contain:
            - "focus" (string): The main goal for the day (e.g., "Hypertrophy: Upper Body", "High-Intensity Interval Training").
            - "warmUp" (string): A brief, specific warm-up routine.
            - "exercises" (array): An array of exercise objects.
            - "coolDown" (string): A brief, specific cool-down routine.
        6. Each object inside the "exercises" array MUST contain:
            - "name" (string): The name of the exercise.
            - "details" (string): The specific sets, reps, or duration.
            - "alternative" (string): Suggest a simpler or different-equipment alternative.

        Output ONLY the raw JSON object. Do not include any text, notes, or markdown formatting.
    `;

    const body = {
        "contents": [{
            "parts": [{ "text": prompt }]
        }]
    };

    console.log(`Sending request to Google AI Studio endpoint with model: ${model}...`);
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    console.log("Received successful response from Google AI Studio.");
    
    // --- AGGRESSIVE JSON CLEANING ---
    // The AI sometimes wraps its response in markdown. We must aggressively extract the raw JSON.
    const rawPrediction = data.candidates[0].content.parts[0].text;
    
    const firstBrace = rawPrediction.indexOf('{');
    const lastBrace = rawPrediction.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("AI response did not contain a valid JSON object.");
    }
    
    // Extract the JSON string from the first '{' to the last '}'
    const cleanedJsonString = rawPrediction.substring(firstBrace, lastBrace + 1);
    
    // Now, parse the cleaned string
    return JSON.parse(cleanedJsonString);
}


app.post('/generate-plan', async (req, res) => {
    // CORRECTED: We now destructure ALL the data from the request body.
    const { age, gender, diet, goal, experience, availableDays, equipment, healthNotes } = req.body;
    
    try {
        // CORRECTED: We now pass ALL the data to the generation function.
        const plan = await generatePlanWithVertexAI(age, gender, diet, availableDays, goal, experience, equipment, healthNotes);
        res.json(plan);
    } catch (error) {
        console.error("--- FULL AI STUDIO ERROR ---");
        console.error(error.message);
        console.error("----------------------------");
        console.log("Falling back to local plan generation.");
        // The fallback plan doesn't use the new data, which is okay for a fallback.
        const fallbackPlan = generatePlan(age, diet, availableDays, goal, experience);
        res.status(500).json(fallbackPlan);
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});


// --- Fallback Logic (updated slightly to be more aware) ---
function generatePlan(age, diet, availableDays, goal, experience) {
    const plan = {};
    const workoutDays = daysOfWeek.filter(day => availableDays.includes(day));
    let exercisesPerDay;
    switch (experience) {
        case 'beginner': exercisesPerDay = 3; break;
        case 'intermediate': exercisesPerDay = 4; break;
        case 'advanced': exercisesPerDay = 5; break;
        default: exercisesPerDay = 4;
    }
   const workoutTypes = ['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Cardio'];
    const weeklyPlan = {};
    workoutDays.forEach((day, index) => {
        const type = workoutTypes[index % workoutTypes.length];
        weeklyPlan[day] = {
            focus: type,
            warmUp: "5 minutes of light cardio (jogging in place).",
            exercises: getRandomExercises(type, exercisesPerDay).map(ex => ({ name: ex, details: "3 sets of 12 reps", alternative: "N/A" })),
            coolDown: "5 minutes of full-body stretching."
        };
    });
    daysOfWeek.forEach(day => {
        if (!weeklyPlan[day]) {
            weeklyPlan[day] = { focus: 'Rest & Recovery', warmUp: "N/A", exercises: [{name: "Light walk or stretching", details: "20 minutes", alternative: "N/A"}], coolDown: "N/A" };
        }
    });
    plan.introduction = "The AI service is currently unavailable. Here is a standard fallback plan based on your experience level.";
    plan.weeklyPlan = weeklyPlan;
    return plan;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const exercises = {
    'Upper Body': ['Push-ups', 'Dumbbell Rows', 'Overhead Press'],
    'Lower Body': ['Squats', 'Lunges', 'Glute Bridges'],
    'Cardio': ['Jumping Jacks', 'High Knees', 'Burpees'],
    'Core': ['Plank', 'Crunches', 'Leg Raises'],
    'Full Body': ['Squats', 'Push-ups', 'Dumbbell Rows']
};

function getRandomExercises(category, count) {
    const categoryExercises = exercises[category];
    if (!categoryExercises) return [];
    const shuffled = categoryExercises.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
