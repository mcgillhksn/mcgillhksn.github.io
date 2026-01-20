// Preload critical parallax images before showing the header
(function() {
    const FALLBACK_TIMEOUT = 3000; // 3 seconds max wait time
    const MIN_DISPLAY_TIME = 500;  // Minimum time before showing (for smooth fade)
    const startTime = Date.now();
    const HAS_LOADED_KEY = 'hksn_has_loaded_this_session';

    // Check if already loaded in this session
    const hasLoadedThisSession = sessionStorage.getItem(HAS_LOADED_KEY) === 'true';

    // If already loaded this session, skip preloader immediately
    if (hasLoadedThisSession) {
        const header = document.querySelector('header');
        const spinner = document.getElementById('preloader-spinner');
        
        if (header) {
            header.classList.remove('preloading');
            header.classList.add('preloaded');
            header.style.opacity = '1';
            header.style.visibility = 'visible';
        }
        
        if (spinner) {
            spinner.remove();
        }
        
        return; // Exit early, no need to preload
    }

    // Mark as loaded for this session
    sessionStorage.setItem(HAS_LOADED_KEY, 'true');

    // List of critical images to preload
    const criticalImages = [
        './assets/home/bg.png',
        './assets/home/layer1.png',
        './assets/home/layer2.png',
        './assets/home/layer3.png',
        './assets/home/layer4.png',
        './assets/home/layer5.png',
        './assets/home/layer6.png',
        './assets/home/layer7.png',
        './assets/home/layer8.png',
        './assets/logo/logoTextWhite.png'
    ];

    // Preload a single image and return a promise
    function preloadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ src, status: 'loaded' });
            img.onerror = () => resolve({ src, status: 'error' });
            img.src = src;
        });
    }

    // Show the header with fade-in effect and hide spinner
    function showHeader() {
        const header = document.querySelector('header');
        const spinner = document.getElementById('preloader-spinner');
        
        if (header) {
            header.classList.remove('preloading');
            header.classList.add('preloaded');
        }
        
        if (spinner) {
            spinner.classList.add('hidden');
            // Remove spinner from DOM after transition completes
            setTimeout(() => {
                spinner.remove();
            }, 300);
        }
    }

    // Ensure minimum display time has passed before showing
    function showHeaderWithMinTime() {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        
        setTimeout(() => {
            showHeader();
        }, remaining);
    }

    // Create timeout promise for fallback
    function createTimeout(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ timeout: true });
            }, ms);
        });
    }

    // Main preload function
    async function preloadCriticalImages() {
        const imagePromises = criticalImages.map(preloadImage);
        const allImagesPromise = Promise.all(imagePromises);
        const timeoutPromise = createTimeout(FALLBACK_TIMEOUT);

        // Race between all images loading and the timeout
        const result = await Promise.race([allImagesPromise, timeoutPromise]);

        if (result.timeout) {
            console.warn('Image preloader: Fallback timeout reached. Showing page with potentially incomplete images.');
        } else {
            const failed = result.filter(r => r.status === 'error');
            if (failed.length > 0) {
                console.warn('Image preloader: Some images failed to load:', failed.map(f => f.src));
            }
        }

        showHeaderWithMinTime();
    }

    // Start preloading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preloadCriticalImages);
    } else {
        preloadCriticalImages();
    }
})();
