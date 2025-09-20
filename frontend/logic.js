document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('workout-form');
    const workoutPlanSection = document.getElementById('workout-plan');
    const planOutput = document.getElementById('plan-output');
    const scheduleDaysContainer = document.getElementById('schedule-days');

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Dynamically create day checkboxes
    daysOfWeek.forEach(day => {
        const dayLabel = document.createElement('label');
        dayLabel.className = "flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-indigo-50 has-[:checked]:bg-indigo-100 has-[:checked]:border-indigo-500";
        
        const dayCheckbox = document.createElement('input');
        dayCheckbox.type = 'checkbox';
        dayCheckbox.name = 'day';
        dayCheckbox.value = day;
        dayCheckbox.className = 'form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded';

        const daySpan = document.createElement('span');
        daySpan.className = 'ml-3 text-sm font-medium text-gray-700';
        daySpan.textContent = day;

        dayLabel.appendChild(dayCheckbox);
        dayLabel.appendChild(daySpan);
        scheduleDaysContainer.appendChild(dayLabel);
    });

    // Exercise database
    const exercises = {
        cardio: ['Running', 'Cycling', 'Jumping Jacks', 'Burpees', 'High Knees', 'Swimming'],
        upperBody: ['Push-ups', 'Pull-ups', 'Dumbbell Rows', 'Overhead Press', 'Bicep Curls', 'Tricep Dips'],
        lowerBody: ['Squats', 'Lunges', 'Deadlifts', 'Glute Bridges', 'Calf Raises', 'Leg Press'],
        core: ['Plank', 'Crunches', 'Leg Raises', 'Russian Twists', 'Bicycle Crunches'],
        fullBody: ['Kettlebell Swings', 'Thrusters', 'Clean and Jerk', 'Mountain Climbers']
    };

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Get form values
        const age = parseInt(document.getElementById('age').value);
        const diet = document.getElementById('diet').value;
        const activityLevel = document.querySelector('input[name="activity"]:checked').value;
        const availableDays = Array.from(document.querySelectorAll('input[name="day"]:checked')).map(el => el.value);

        if (availableDays.length === 0) {
             // Replace alert with a more modern notification if desired
             alert('Please select at least one day to work out.');
             return;
        }

        // This is where you would call the AI service in the future.
        // For now, we use the local generator.
        const plan = generatePlan(age, diet, activityLevel, availableDays);
        displayPlan(plan);
    });

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
                exercises: getRandomExercises(workoutType, 3)
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

    function getRandomExercises(type, count) {
        const exerciseList = exercises[type];
        if (!exerciseList) return [];
        
        const shuffled = exerciseList.sort(() => 0.5 - Math.random());
        let selected = shuffled.slice(0, count);

        // Add sets and reps based on activity level
        return selected.map(ex => {
            let setsReps;
            switch (document.querySelector('input[name="activity"]:checked').value) {
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

    function displayPlan(plan) {
        planOutput.innerHTML = ''; // Clear previous plan
        
        daysOfWeek.forEach(day => {
            if (plan[day]) {
                const dayPlan = plan[day];
                const isRestDay = dayPlan.focus === 'Rest Day';

                const card = document.createElement('div');
                card.className = `bg-white p-6 rounded-xl shadow-md border-l-4 ${isRestDay ? 'border-gray-400 bg-gray-50' : 'border-indigo-500'}`;
                
                let exercisesHtml = dayPlan.exercises.map(ex => `<li class="text-gray-600">${ex}</li>`).join('');

                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold ${isRestDay ? 'text-gray-600' : 'text-indigo-700'}">${day}</h3>
                        <span class="text-sm font-semibold ${isRestDay ? 'text-gray-500' : 'text-indigo-600'} bg-indigo-100 px-3 py-1 rounded-full">${dayPlan.focus}</span>
                    </div>
                    <ul class="mt-4 list-disc list-inside space-y-2">
                        ${exercisesHtml}
                    </ul>
                `;
                planOutput.appendChild(card);
            }
        });
        
        workoutPlanSection.classList.remove('hidden');
        workoutPlanSection.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('workout-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const age = document.getElementById('age').value;
        const diet = document.getElementById('diet').value;
        const activityLevel = document.getElementById('activity-level').value;
        const schedule = document.getElementById('schedule').value;

        const userData = {
            age,
            diet,
            activityLevel,
            schedule
        };

        // For now, we'll just log the data to the console.
        // Later, we will send this to the backend.
        console.log(userData);

        // Display a sample plan for now
        const planContent = document.getElementById('plan-content');
        planContent.innerHTML = `
            <h3>Sample Workout Plan</h3>
            <p><strong>Day 1:</strong> Full Body Strength</p>
            <ul>
                <li>Squats: 3 sets of 10</li>
                <li>Push-ups: 3 sets of 15</li>
                <li>Rows: 3 sets of 12</li>
            </ul>
            <p><strong>Day 2:</strong> Cardio</p>
            <ul>
                <li>Running: 30 minutes</li>
            </ul>
        `;
    });
});
