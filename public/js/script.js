// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenuBtn && navMenu) {
        // Toggle menu open/close
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            
            if (navMenu.classList.contains('active')) {
                icon.className = 'fas fa-times'; // change to close icon
            } else {
                icon.className = 'fas fa-bars'; // change back to menu icon
            }
        });

        // Close menu when clicking on a nav link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = 'fas fa-bars';
            });
        });
    }
});
