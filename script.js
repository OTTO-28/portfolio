document.addEventListener('DOMContentLoaded', function() {

    // --- TYPING ANIMATION ---
    const typingTextElement = document.getElementById('typing-text');
    const textsToType = ["AI Engineer", "Architecting Intelligent Systems"];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentText = textsToType[textIndex];
        let displayText = '';

        if (isDeleting) {
            displayText = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            displayText = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        typingTextElement.textContent = displayText;

        let typeSpeed = 150;
        if (isDeleting) {
            typeSpeed /= 2;
        }

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % textsToType.length;
            typeSpeed = 500; // Pause before start
        }

        setTimeout(type, typeSpeed);
    }
    
    // --- SCROLL FADE-IN ANIMATION ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Optional: Stop observing once visible
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    fadeElements.forEach(el => {
        observer.observe(el);
    });
    
    // --- ACTIVE NAV LINK ON SCROLL ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('header nav ul li a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 75) { // 75 is header height + buffer
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').substring(1) === current) {
                a.classList.add('active');
            }
        });
    });


    // Start the typing animation after a brief delay
    setTimeout(type, 1000);
});