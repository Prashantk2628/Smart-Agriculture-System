document.querySelectorAll('.glass-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / card.clientHeight) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  });
});

const mainNav = document.getElementById('main-nav');

if (mainNav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      mainNav.classList.add('nav-scrolled');
    } else {
      mainNav.classList.remove('nav-scrolled');
    }
  });
}

const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.slider-dot');
const nextBtn = document.getElementById('nextSlide');
const prevBtn = document.getElementById('prevSlide');

if (slides.length > 0) {
  let currentSlide = 0;
  let slideInterval;
  const SLIDE_DURATION = 4500; 

  slides.forEach((slide, i) => {
    slide.style.transform = `translateX(${100 * i}%)`;
  });

  function goToSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.transform = `translateX(${100 * (i - index)}%)`;
    });
    
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.remove('w-3', 'bg-white/30', 'hover:bg-white/60');
        dot.classList.add('w-8', 'bg-primary');
      } else {
        dot.classList.remove('w-8', 'bg-primary');
        dot.classList.add('w-3', 'bg-white/30', 'hover:bg-white/60');
      }
    });
    currentSlide = index;
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }

  function prevSlide() {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }

  function startSlideShow() {
    slideInterval = setInterval(nextSlide, SLIDE_DURATION);
  }

  function resetSlideShow() {
    clearInterval(slideInterval);
    startSlideShow();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetSlideShow(); 
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetSlideShow();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      resetSlideShow();
    });
  });

  startSlideShow();
}