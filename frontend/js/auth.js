// Auth check for protected pages
(function() {
    // If we're on a non-login page and not authenticated, redirect to login
    if (!localStorage.getItem('isAuthenticated')) {
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
})();
