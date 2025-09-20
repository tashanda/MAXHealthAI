const express = require('express');
const cors = require('cors');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const app = express();
const port = 3000;

// --- Vertex AI Configuration ---
// IMPORTANT: You must configure your environment for this to work.
// 1. Replace 'your-gcp-project-id' with your actual Google Cloud Project ID.
// 2. Make sure you have authenticated your environment. See instructions in the response.
const PROJECT_ID = 'your-gcp-project-id';
const LOCATION = 'us-central1'; // e.g., 'us-central1'
const MODEL_ID = 'gemini-pro'; // Or another model you want to use

// Initialize the Vertex AI client.
const clientOptions = {
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);
// --- End of Vertex AI Configuration ---

app.use(cors());
app.use(express.json());

app.post('/generate-plan', async (req, res) => {
    const { age, diet, activityLevel, availableDays } = req.body;
    
    try {
        // ** NEW: Using Vertex AI to generate the plan **
        const plan = await generatePlanWithVertexAI(age, diet, activityLevel, availableDays);
        res.json(plan);
    } catch (error) {
        console.error("Error generating plan with Vertex AI:", error);
        // Fallback to the old logic if Vertex AI fails
        console.log("Falling back to local plan generation.");
        const fallbackPlan = generatePlan(age, diet, activityLevel, availableDays);
        res.status(500).json(fallbackPlan);
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});

async function generatePlanWithVertexAI(age, diet, activityLevel, availableDays) {
    const prompt = `
        Create a personalized weekly workout plan for a ${age}-year-old with a ${diet} diet.
        Their current activity level is ${activityLevel}.
        They are available to work out on the following days: ${availableDays.join(', ')}.

        For each available day, provide a workout focus (e.g., Upper Body, Lower Body, Cardio, Core, Full Body) and 3-4 specific exercises with sets and reps.
        For the days they are not available, label them as "Rest Day".

        Return ONLY a valid JSON object. The keys should be the days of the week (e.g., "Sunday", "Monday").
        Each day's value should be an object with a "focus" (string) and "exercises" (an array of strings).
        Example:
        {
          "Monday": {
            "focus": "Upper Body",
            "exercises": ["Push-ups (3 sets of 12 reps)", "Pull-ups (3 sets of 8 reps)"]
          },
          "Tuesday": {
            "focus": "Rest Day",
            "exercises": ["Light stretching"]
          }
        }
    `;

    const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

    const request = {
        endpoint,
        instances: [{ "prompt": prompt }],
        parameters: {
            "temperature": 0.5,
            "maxOutputTokens": 1024,
            "topP": 0.8,
            "topK": 40
        }
    };

    // This is where the call to the Vertex AI API happens.
    // The following is a placeholder and will not execute without proper authentication.
    // const [response] = await predictionServiceClient.predict(request);
    // const prediction = response.predictions[0].stringValue;
    // return JSON.parse(prediction);

    // For now, we'll return a mocked response so the frontend works.
    // Replace this with the actual API call above once you've set up your credentials.
    console.log("--- MOCKED AI RESPONSE ---");
    return new Promise(resolve => {
        setTimeout(() => {
            const mockPlan = generatePlan(age, diet, activityLevel, availableDays);
            resolve(mockPlan);
        }, 500);
    });
}

// The original local plan generation logic is kept as a fallback.
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// ... (rest of the original code remains the same) ...
function generatePlan(age, diet, activityLevel, availableDays) {
    const workoutPlan = {};
    let workoutTypes = [];

    // Basic logic to determine workout focus
    if (activityLevel === 'sedentary' || activityLevel === 'lightly-active') {
        // Focus on full body and cardio for beginners
        workoutTypes = ['fullBody', 'cardio', 'core', 'lowerBody', 'upperBody', 'cardio'];
    } else {
        // More specialized split for active individuals
        workoutTypes = ['upperBody', 'lowerBody', 'cardio', 'core', 'upperBody', 'lowerBody', 'cardio'];
    }
    
    if (diet === 'high-protein') {
        // Prioritize strength training
        workoutTypes.unshift('upperBody', 'lowerBody');
    } else if (diet === 'low-carb') {
        // Add more cardio for fat burning
        workoutTypes.push('cardio');
    }
    
    // Assign workouts to available days
    let workoutTypeIndex = 0;
    let restDays = daysOfWeek.filter(day => !availableDays.includes(day));

    availableDays.forEach(day => {
        if (workoutTypeIndex >= workoutTypes.length) {
            workoutTypeIndex = 0; // Cycle through workouts if more days than types
        }
        const workoutType = workoutTypes[workoutTypeIndex];
        workoutPlan[day] = {
            focus: workoutType.charAt(0).toUpperCase() + workoutType.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Format focus name
            exercises: getRandomExercises(workoutType, 3, activityLevel)
        };
        workoutTypeIndex++;
    });

    restDays.forEach(day => {
        workoutPlan[day] = {
            focus: 'Rest Day',
            exercises: ['Active recovery like stretching or a light walk is recommended.']
        };
    });
    
    return workoutPlan;
}

function getRandomExercises(type, count, activityLevel) {
    const exerciseList = exercises[type];
    if (!exerciseList) return [];
    
    const shuffled = exerciseList.sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, count);

    // Add sets and reps based on activity level
    return selected.map(ex => {
        let setsReps;
        switch (activityLevel) {
            case 'sedentary':
                setsReps = '2 sets of 10-12 reps';
                break;
            case 'lightly-active':
                setsReps = '3 sets of 10-12 reps';
                break;
            case 'moderately-active':
                setsReps = '3 sets of 12-15 reps';
                break;
            case 'very-active':
                setsReps = '4 sets of 12-15 reps';
                break;
            default:
                 setsReps = '3 sets of 10-12 reps';
        }
        return `${ex} (${setsReps})`;
    });
}
