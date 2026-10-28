function initMagic() {
    if (window._magicInitialized) return;
    window._magicInitialized = true;

    // === Cursor Glow Follower ===
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';

        // Create Trail Particles frequently
        if (Math.random() > 0.3) {
            createParticle(e.clientX, e.clientY);
        }
    });

    // === Click Burst ===
    document.addEventListener('click', (e) => {
        createBurst(e.clientX, e.clientY);
    });

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'magic-particle';
        document.body.appendChild(particle);

        const size = Math.random() * 5 + 3; // 3px to 8px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Golden / magical colors
        const colors = ['#ffb800', '#fbbf24', '#ffffff', '#e2e8f0', '#f59e0b'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px ${particle.style.background}`;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    function createBurst(x, y) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'magic-burst-particle';
            document.body.appendChild(p);

            const size = Math.random() * 5 + 3;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.backgroundColor = '#ffb800';
            p.style.boxShadow = '0 0 6px #ffb800';

            p.style.left = `${x}px`;
            p.style.top = `${y}px`;

            const angle = (i / particleCount) * 2 * Math.PI;
            const velocity = Math.random() * 50 + 30;

            const tx = x + Math.cos(angle) * velocity;
            const ty = y + Math.sin(angle) * velocity;

            requestAnimationFrame(() => {
                p.style.transform = `translate(${tx - x}px, ${ty - y}px) scale(0)`;
                p.style.opacity = '0';
            });

            setTimeout(() => {
                p.remove();
            }, 600);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagic);
} else {
    initMagic();
}
