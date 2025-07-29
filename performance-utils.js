/**
 * Performance Optimization Utilities for Travel App
 * Includes lazy loading, intersection observer, and resource optimization
 */

// Performance monitoring
const performanceMetrics = {
  start: performance.now(),
  
  mark(name) {
    performance.mark(name);
  },
  
  measure(name, start, end) {
    performance.measure(name, start, end);
    const measurement = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measurement.duration.toFixed(2)}ms`);
  },
  
  reportVitals() {
    // Core Web Vitals reporting
    if ('web-vital' in window) {
      webVitals.getFCP(console.log);
      webVitals.getLCP(console.log);
      webVitals.getFID(console.log);
      webVitals.getCLS(console.log);
    }
  }
};

// Intersection Observer for lazy loading and animations
class LazyLoader {
  constructor() {
    this.imageObserver = null;
    this.animationObserver = null;
    this.init();
  }
  
  init() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver(
        this.handleImageIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
      
      this.animationObserver = new IntersectionObserver(
        this.handleAnimationIntersection.bind(this),
        {
          rootMargin: '20px 0px',
          threshold: 0.1
        }
      );
      
      this.observeImages();
      this.observeAnimations();
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }
  
  handleImageIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.imageObserver.unobserve(img);
      }
    });
  }
  
  handleAnimationIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        this.animationObserver.unobserve(entry.target);
      }
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src || img.src;
    if (src && src !== img.src) {
      img.src = src;
      img.classList.add('loaded');
    }
  }
  
  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    images.forEach(img => this.imageObserver.observe(img));
  }
  
  observeAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => this.animationObserver.observe(el));
  }
  
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }
}

// Resource preloader
class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Set();
  }
  
  preloadImage(src) {
    if (this.preloadedResources.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    this.preloadedResources.add(src);
  }
  
  preloadCriticalImages() {
    // Preload above-the-fold images
    const criticalImages = document.querySelectorAll('.critical-image');
    criticalImages.forEach(img => {
      const src = img.dataset.src || img.src;
      if (src) this.preloadImage(src);
    });
  }
  
  preloadNextPageResources() {
    // Preload resources for likely next pages
    const nextPageLinks = document.querySelectorAll('a[href$=".html"]');
    nextPageLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const linkElement = document.createElement('link');
        linkElement.rel = 'prefetch';
        linkElement.href = link.href;
        document.head.appendChild(linkElement);
      }, { once: true });
    });
  }
}

// Image optimization utility
class ImageOptimizer {
  static optimizeImageUrl(url, width = 400, quality = 80) {
    // Add optimization parameters to image URLs
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&f=webp`;
  }
  
  static addResponsiveImages() {
    const images = document.querySelectorAll('img[data-size]');
    images.forEach(img => {
      const size = img.dataset.size;
      const [width, height] = size.split('*').map(Number);
      
      if (width && height) {
        // Create responsive srcset
        const baseSrc = img.src || img.dataset.src;
        const srcset = [
          `${this.optimizeImageUrl(baseSrc, width)} 1x`,
          `${this.optimizeImageUrl(baseSrc, width * 2)} 2x`
        ].join(', ');
        
        img.srcset = srcset;
        img.sizes = `${width}px`;
      }
    });
  }
}

// Performance-optimized scroll handler
class ScrollOptimizer {
  constructor() {
    this.ticking = false;
    this.scrollHandlers = [];
  }
  
  addScrollHandler(handler) {
    this.scrollHandlers.push(handler);
    if (this.scrollHandlers.length === 1) {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }
  
  handleScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.scrollHandlers.forEach(handler => handler());
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
}

// Main initialization
class TravelAppOptimizer {
  constructor() {
    this.lazyLoader = new LazyLoader();
    this.resourcePreloader = new ResourcePreloader();
    this.scrollOptimizer = new ScrollOptimizer();
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }
  
  onDOMReady() {
    performanceMetrics.mark('dom-ready');
    
    // Initialize optimizations
    this.resourcePreloader.preloadCriticalImages();
    this.resourcePreloader.preloadNextPageResources();
    ImageOptimizer.addResponsiveImages();
    
    // Add performance monitoring
    window.addEventListener('load', () => {
      performanceMetrics.mark('window-loaded');
      performanceMetrics.measure('total-load-time', 'navigationStart', 'window-loaded');
      
      // Report performance metrics
      setTimeout(() => performanceMetrics.reportVitals(), 0);
    });
    
    // Add service worker for caching
    this.registerServiceWorker();
  }
  
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
      });
    }
  }
}

// Initialize when script loads
new TravelAppOptimizer();

// Export for external use
window.TravelApp = {
  LazyLoader,
  ResourcePreloader,
  ImageOptimizer,
  performanceMetrics
};