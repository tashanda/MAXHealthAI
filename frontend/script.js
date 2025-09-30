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
        dayCheckbox.name = 'schedule';
        dayCheckbox.value = day;
        dayCheckbox.className = "form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300";

        const daySpan = document.createElement('span');
        daySpan.className = "ml-3 text-sm font-medium text-gray-700";
        daySpan.textContent = day;

        dayLabel.appendChild(dayCheckbox);
        dayLabel.appendChild(daySpan);
        scheduleDaysContainer.appendChild(dayLabel);
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const generateBtn = document.getElementById('generate-btn');
        const buttonText = document.getElementById('button-text');
        const spinner = document.getElementById('loading-spinner');

        // Show loading state
        generateBtn.disabled = true;
        buttonText.textContent = 'Generating...';
        spinner.classList.remove('hidden');

        // Gather all data from the new comprehensive form
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const diet = document.getElementById('diet').value;
        const goal = document.querySelector('input[name="goal"]:checked').value;
        const experience = document.querySelector('input[name="experience"]:checked').value;
        const availableDays = Array.from(document.querySelectorAll('#schedule-days input:checked')).map(cb => cb.value);
        const equipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value);
        const healthNotes = document.getElementById('health-notes').value;

        const data = { age, gender, diet, goal, experience, availableDays, equipment, healthNotes };

        fetch('http://localhost:3000/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorPlan => {
                    alert('AI service failed. Displaying a local fallback plan.');
                    displayWorkoutPlan(errorPlan);
                    throw new Error('Server responded with an error, but provided a fallback.');
                });
            }
            return response.json();
        })
        .then(plan => {
            displayWorkoutPlan(plan);
        })
        .catch(error => {
            console.error('Error:', error.message);
        })
        .finally(() => {
            // --- Hide loading state ---
            generateBtn.disabled = false;
            buttonText.textContent = 'Generate Workout Plan';
            spinner.classList.add('hidden');
        });
    });

    // --- THE NEW, PREMIUM DISPLAY FUNCTION ---
    function displayWorkoutPlan(plan) {
        const planOutput = document.getElementById('plan-output');
        const dietOutput = document.getElementById('diet-recommendations');
        planOutput.innerHTML = '';
        dietOutput.innerHTML = '';

        // --- Render Diet Recommendations ---
        if (plan.dietaryRecommendations) {
            const diet = plan.dietaryRecommendations;
            const dietCard = document.createElement('div');
            dietCard.className = 'bg-gray-50 p-6 rounded-xl border border-gray-200';
            
            dietCard.innerHTML = `
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Dietary Protocol</h3>
                <p class="text-gray-700 mb-4">${diet.summary}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-center">
                    <div class="bg-white p-4 rounded-lg border">
                        <p class="text-sm font-medium text-gray-500">Calorie Target</p>
                        <p class="text-xl font-semibold text-indigo-600">${diet.calorieTarget}</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border">
                        <p class="text-sm font-medium text-gray-500">Macro Split (P/C/F)</p>
                        <p class="text-xl font-semibold text-indigo-600">${diet.macroSplit.protein} / ${diet.macroSplit.carbs} / ${diet.macroSplit.fat}</p>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-gray-700 mb-2">Meal Examples</h4>
                    <ul class="space-y-2 text-gray-600">
                        <li><span class="font-semibold">Breakfast:</span> ${diet.mealExamples.breakfast}</li>
                        <li><span class="font-semibold">Lunch:</span> ${diet.mealExamples.lunch}</li>
                        <li><span class="font-semibold">Dinner:</span> ${diet.mealExamples.dinner}</li>
                    </ul>
                </div>
            `;
            dietOutput.appendChild(dietCard);
        }

        // Display the personalized introduction
        if (plan.introduction) {
            const introCard = document.createElement('div');
            introCard.className = 'bg-indigo-600 text-white p-6 rounded-xl shadow-lg mb-8';
            const introText = document.createElement('p');
            introText.className = 'text-lg text-center font-medium';
            introText.textContent = plan.introduction;
            introCard.appendChild(introText);
            planOutput.appendChild(introCard);
        }

        const weeklyPlan = plan.weeklyPlan || plan;

        daysOfWeek.forEach(day => {
            const dayData = weeklyPlan[day];
            if (!dayData) return;

            const dayCard = document.createElement('div');
            dayCard.className = 'bg-gray-50 p-6 rounded-xl border border-gray-200 transition-shadow duration-300 hover:shadow-md';

            // --- Header ---
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-4';
            const dayTitle = document.createElement('h3');
            dayTitle.className = 'text-xl font-bold text-gray-800';
            dayTitle.textContent = day;
            const focusBadge = document.createElement('span');
            const isRestDay = dayData.focus.toLowerCase().includes('rest');
            focusBadge.className = `px-3 py-1 text-sm font-semibold rounded-full ${isRestDay ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`;
            focusBadge.textContent = dayData.focus;
            header.appendChild(dayTitle);
            header.appendChild(focusBadge);
            dayCard.appendChild(header);

            // --- Warm-Up, Exercises, Cool-Down Sections ---
            const sections = [
                { title: 'Warm-Up', data: dayData.warmUp, icon: '🔥' },
                { title: 'Workout', data: dayData.exercises, icon: '💪' },
                { title: 'Cool-Down', data: dayData.coolDown, icon: '🧘' }
            ];

            sections.forEach(section => {
                if (!section.data || section.data.length === 0 || section.data === "N/A") return;

                const sectionTitle = document.createElement('h4');
                sectionTitle.className = 'text-md font-semibold text-gray-600 mt-4 mb-2';
                sectionTitle.textContent = `${section.icon} ${section.title}`;
                dayCard.appendChild(sectionTitle);

                const list = document.createElement('ul');
                list.className = 'space-y-2 text-gray-700 pl-5 border-l-2 border-indigo-200';

                if (Array.isArray(section.data)) {
                    section.data.forEach(exercise => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `<span class="font-semibold">${exercise.name}:</span> ${exercise.details}`;
                        list.appendChild(listItem);
                    });
                } else {
                    const listItem = document.createElement('li');
                    listItem.textContent = section.data;
                    list.appendChild(listItem);
                }
                dayCard.appendChild(list);
            });

            planOutput.appendChild(dayCard);
        });

        workoutPlanSection.classList.remove('hidden');
        workoutPlanSection.scrollIntoView({ behavior: 'smooth' });
    }
});
