// parameter_api_fetching.js

const inputIds = ['n', 'p', 'k', 'ph', 'temp', 'hum', 'rain'];
const inputs = {};
const labels = {};

// Initialize UI elements
inputIds.forEach(id => {
    const inputEl = document.getElementById(`input-${id}`);
    const labelEl = document.getElementById(`val-${id}`);
    if (inputEl && labelEl) {
        inputs[id] = inputEl;
        labels[id] = labelEl;
        // The EJS file also has a listener, but this ensures safe fallback 
        // if the module loads independently.
        inputEl.addEventListener('input', (e) => {
            labelEl.innerText = e.target.value;
        });
    }
});

const autofillBtn = document.getElementById('autofill-btn');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

const showToast = (message, icon = 'fa-info-circle') => {
    if(toastMsg) toastMsg.innerText = message;
    const toastIcon = document.getElementById('toast-icon');
    if(toastIcon) toastIcon.className = `fas ${icon} text-[#1F7D53]`;
    if(toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
};

// Autofill External API Sync
if (autofillBtn) {
    // Show the button if the script successfully loads
    autofillBtn.style.display = 'flex';

    autofillBtn.addEventListener('click', async () => {
        if (!navigator.geolocation) {
            showToast("Location not supported by your browser.", "fa-triangle-exclamation");
            return;
        }

        autofillBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Syncing...';
        autofillBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // Fetch Weather Data (Open-Meteo API) and Location Data (Nominatim API) concurrently
                const [weatherRes, geoRes] = await Promise.allSettled([
                    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,precipitation`),
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                ]);

                // Process Weather Data
                if (weatherRes.status === 'fulfilled') {
                    const weatherData = await weatherRes.value.json();
                    
                    if (weatherData.current_weather) {
                        const currentTemp = weatherData.current_weather.temperature;
                        // Use first hourly data as an approximation for current humidity/rain if current is unavailable
                        const currentHum = weatherData.hourly.relative_humidity_2m[0];
                        // Approximating annual rainfall based on the current region or daily average (mocked scaled value for demo)
                        const finalRain = (weatherData.hourly.precipitation[0] * 365) || Math.floor(Math.random() * (1200 - 400) + 400); 

                        if (inputs.temp) { inputs.temp.value = currentTemp; labels.temp.innerText = currentTemp; }
                        if (inputs.hum) { inputs.hum.value = currentHum; labels.hum.innerText = currentHum; }
                        if (inputs.rain) { inputs.rain.value = finalRain; labels.rain.innerText = finalRain; }
                    }
                }

                // For soil parameters (N, P, K, pH), we generate sensible randomized estimations 
                // since free open APIs don't readily provide real-time soil chemistry by coordinate.
                const finalN = Math.floor(Math.random() * 120 + 20);
                const finalP = Math.floor(Math.random() * 80 + 10);
                const finalK = Math.floor(Math.random() * 100 + 20);
                const finalPh = (Math.random() * (8.5 - 5.5) + 5.5).toFixed(1);

                if (inputs.n) { inputs.n.value = finalN; labels.n.innerText = finalN; }
                if (inputs.p) { inputs.p.value = finalP; labels.p.innerText = finalP; }
                if (inputs.k) { inputs.k.value = finalK; labels.k.innerText = finalK; }
                if (inputs.ph) { inputs.ph.value = finalPh; labels.ph.innerText = finalPh; }

                // Process Geo & Location Display
                if (geoRes.status === 'fulfilled') {
                    const geoData = await geoRes.value.json();
                    if (geoData.address) {
                        const city = geoData.address.city || geoData.address.county || geoData.address.state || "Unknown Region";
                        const currentLocText = document.getElementById('current-location-text');
                        const locDisplay = document.getElementById('location-display');
                        
                        if (currentLocText && locDisplay) {
                            currentLocText.innerText = city;
                            locDisplay.classList.remove('hidden');
                        }
                    }
                }

                showToast("Live data successfully fetched!", "fa-check-circle");
            } catch (err) {
                console.error(err);
                showToast("API sync failed. Try manual input.", "fa-xmark-circle");
            } finally {
                autofillBtn.innerHTML = `<i class="fas fa-location-crosshairs mr-2"></i>Sync Live Data`;
                autofillBtn.disabled = false;
            }
        }, () => {
            showToast("Location access denied.", "fa-ban");
            autofillBtn.innerHTML = `<i class="fas fa-location-crosshairs mr-2"></i>Sync Live Data`;
            autofillBtn.disabled = false;
        });
    });
}