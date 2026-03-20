document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            // Hardcoded credentials as requested
            if (username === 'fitlab' && password === 'fitlab2026') {
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'index.html';
            } else {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Invalid username or password.';
            }
        });
    }
});
