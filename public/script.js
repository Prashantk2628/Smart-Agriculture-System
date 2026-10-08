function toggleForm(mode) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}

window.onload = function() {
    const popup = document.getElementById('popup-message');
    
    if (popup) {
        // Wait 4 seconds, then animate it out
        setTimeout(() => {
            popup.style.animation = 'popOut 0.5s ease forwards';
            
            // Remove the element from the DOM after the animation finishes
            setTimeout(() => {
                popup.remove();
            }, 500);
        }, 4000);
    }
};