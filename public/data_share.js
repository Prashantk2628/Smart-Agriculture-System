// data_share.js

const predictBtn = document.getElementById('predict-btn');

// Toast Notification Helper
const showToast = (message, icon = 'fa-info-circle') => {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (toastMsg) toastMsg.innerText = message;
    if (toastIcon) toastIcon.className = `fas ${icon} text-[#1F7D53]`;
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
};

predictBtn.addEventListener('click', async () => {
    // 1. Gather Payload from Inputs (Aligned strictly with dataset features and types)
    const payload = {
        N: parseInt(document.getElementById('input-n').value),
        P: parseInt(document.getElementById('input-p').value),
        K: parseInt(document.getElementById('input-k').value),
        temperature: parseFloat(document.getElementById('input-temp').value),
        humidity: parseFloat(document.getElementById('input-hum').value),
        ph: parseFloat(document.getElementById('input-ph').value),
        rainfall: parseFloat(document.getElementById('input-rain').value)
    };

    // 2. Button Loading State
    const originalBtnText = predictBtn.innerHTML;
    predictBtn.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Analyzing Parameters...';
    predictBtn.disabled = true;

    // 3. Trigger UI Animations (Shrink inputs, reveal results panel)
    const inputPanel = document.getElementById('input-panel');
    const resultsColumn = document.getElementById('results-column');
    const resultsSidebar = document.getElementById('results-animated-container');
    
    inputPanel.classList.remove('lg:col-span-12');
    inputPanel.classList.add('lg:col-span-7');
    
    resultsColumn.classList.remove('hidden');
    resultsColumn.classList.add('lg:col-span-5');
    
    // Show loading skeleton/spinner in the results area
    document.getElementById('result-loading').classList.remove('hidden');
    document.getElementById('result-content').classList.add('hidden');

    // Small delay to allow the layout shift to animate smoothly
    setTimeout(() => {
        resultsSidebar.classList.add('active');
    }, 100);

    try {
        // 4. Send request to application backend
        let response;
        try {
            response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // 5. Populate Results
        if (data.recommendations && data.recommendations.length > 0) {
            const topCrop = data.recommendations[0];
            
            // Set Top Recommendation
            document.getElementById('top-crop-name').innerText = topCrop.crop;
            document.getElementById('top-crop-conf').innerText = `${Number(topCrop.confidence).toFixed(2)}% Match Confidence`;

            // Set Alternatives
            const altList = document.getElementById('alternative-list');
            altList.innerHTML = ''; // Clear previous
            
            data.recommendations.slice(1).forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = "flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100";
                itemDiv.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">${index + 2}</span>
                        <span class="font-bold text-slate-700">${item.crop}</span>
                    </div>
                    <span class="text-xs font-black text-[#1F7D53]">${Number(item.confidence).toFixed(2)}%</span>
                `;
                altList.appendChild(itemDiv);
            });
        }

        // 6. Switch from Loader to Content
        document.getElementById('result-loading').classList.add('hidden');
        document.getElementById('result-content').classList.remove('hidden');
        
        showToast("Analysis Successful", "fa-check-circle");

    } catch (error) {
        console.error("Error:", error);
        showToast("Model connection failed. Is the Python server running?", "fa-xmark-circle");
        
        // Optional UI reset on failure: If the API fails, return the UI back to normal
        setTimeout(() => {
            inputPanel.classList.remove('lg:col-span-7');
            inputPanel.classList.add('lg:col-span-12');
            resultsColumn.classList.add('hidden');
            resultsSidebar.classList.remove('active');
            document.getElementById('result-loading').classList.add('hidden');
        }, 2000);

    } finally {
        // Reset Button
        predictBtn.innerHTML = originalBtnText;
        predictBtn.disabled = false;
    }
});