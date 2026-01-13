import { Component } from '@theme/component';
import { onDocumentReady, changeMetaThemeColor } from '@theme/utilities';

/**
 * @typedef {Object} HeaderComponentRefs
 * @property {HTMLDivElement} headerDrawerContainer - The header drawer container element
 * @property {HTMLElement} headerMenu - The header menu element
 * @property {HTMLElement} headerRowTop - The header top row element
 */

/**
 * @typedef {CustomEvent<{ minimumReached: boolean }>} OverflowMinimumEvent
 */

/**
 * A custom element that manages the site header.
 *
 * @extends {Component<HeaderComponentRefs>}
 */

class HeaderComponent extends Component {
  requiredRefs = ['headerDrawerContainer', 'headerMenu', 'headerRowTop'];


  /**
   * An intersection observer for monitoring sticky header position
   * @type {IntersectionObserver | null}
   */
  #intersectionObserver = null;

  /**
   * Whether the header has been scrolled offscreen, when sticky behavior is 'scroll-up'
   * @type {boolean}
   */
  #offscreen = false;

  /**
   * The last recorded scrollTop of the document, when sticky behavior is 'scroll-up
   * @type {number}
   */
  #lastScrollTop = 0;

  /**
   * A timeout to allow for hiding animation, when sticky behavior is 'scroll-up'
   * @type {number | null}
   */
  #timeout = null;

  /**
   * The duration to wait for hiding animation, when sticky behavior is 'scroll-up'
   * @constant {number}
   */
  #animationDelay = 150;

  /**
   * Keeps the global `--header-height` custom property up to date,
   * which other theme components can then consume
   */
  #resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;

    const { height } = entry.target.getBoundingClientRect();
    document.body.style.setProperty('--header-height', `${height}px`);

    // Check if the menu drawer should be hidden in favor of the header menu
  });

  /**
   * Observes the header while scrolling the viewport to track when its actively sticky
   * @param {Boolean} alwaysSticky - Determines if we need to observe when the header is offscreen
   */
  #observeStickyPosition = (alwaysSticky = true) => {
    if (this.#intersectionObserver) return;

    const config = {
      threshold: alwaysSticky ? 1 : 0,
    };

    this.#intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;

      const { isIntersecting } = entry;

      if (alwaysSticky) {
        this.dataset.stickyState = isIntersecting ? 'inactive' : 'active';
        this.#updateThemeColor();

        if (this.dataset.stickyState === 'active') {
          this.classList.add('header--mobile-menu-open');
        } else {
          this.classList.remove('header--mobile-menu-open');
        }
      } else {
        this.#offscreen = !isIntersecting || this.dataset.stickyState === 'active';
      }
    }, config);

    this.#intersectionObserver.observe(this);
  };


  #updateThemeColor = () => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      if (this.classList.contains('header--transparent')) {
        metaThemeColor.setAttribute('content', '#000000');
      } else {
        const newColor = getComputedStyle(this.refs.headerRowTop).getPropertyValue('background-color').trim();
        metaThemeColor.setAttribute('content', newColor);
      }
    }
  };

  #handleWindowScroll = () => {
    const stickyMode = this.getAttribute('sticky');
    if (!this.#offscreen && stickyMode !== 'always') return;

    const scrollTop = document.scrollingElement?.scrollTop ?? 0;
    const isScrollingUp = scrollTop < this.#lastScrollTop;
    if (this.#timeout) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }

    if (stickyMode === 'always') {
      if (isScrollingUp) {
        if (this.getBoundingClientRect().top >= 0) {
          this.dataset.scrollDirection = 'none';
        } else {
          this.dataset.scrollDirection = 'up';
        }
      } else {
        this.dataset.scrollDirection = 'down';
      }

      this.#lastScrollTop = scrollTop;
      this.#updateThemeColor();
      return;
    }

    if (isScrollingUp) {
      this.removeAttribute('data-animating');

      if (this.getBoundingClientRect().top >= 0) {
        // reset sticky state when header is scrolled up to natural position
        this.#offscreen = false;
        this.dataset.stickyState = 'inactive';
        this.dataset.scrollDirection = 'none';
      } else {
        // show sticky header when scrolling up
        this.dataset.stickyState = 'active';
        this.dataset.scrollDirection = 'up';
      }
    } else if (this.dataset.stickyState === 'active') {
      this.dataset.scrollDirection = 'none';
      // delay transitioning to idle hidden state for hiding animation
      this.setAttribute('data-animating', '');

      this.#timeout = setTimeout(() => {
        this.dataset.stickyState = 'idle';
        this.removeAttribute('data-animating');
      }, this.#animationDelay);
    } else {
      this.dataset.scrollDirection = 'none';
      this.dataset.stickyState = 'idle';
    }

    this.#lastScrollTop = scrollTop;
    this.#updateThemeColor();
  };

  connectedCallback() {
    super.connectedCallback();
    this.#resizeObserver.observe(this);

    const stickyMode = this.getAttribute('sticky');
    if (stickyMode) {
      this.#observeStickyPosition(stickyMode === 'always');

      if (stickyMode === 'scroll-up' || stickyMode === 'always') {
        document.addEventListener('scroll', this.#handleWindowScroll);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener('scroll', this.#handleWindowScroll);
    document.body.style.setProperty('--header-height', '0px');
  }
}

if (!customElements.get('header-component')) {
  customElements.define('header-component', HeaderComponent);
}

onDocumentReady(() => {
  const header = document.querySelector('#header-component');
  const headerGroup = document.querySelector('#header-group');

  // Update header group height on resize of any child
  if (headerGroup) {
    const resizeObserver = new ResizeObserver(() => calculateHeaderGroupHeight(header, headerGroup));

    // Observe all children of the header group
    const children = headerGroup.children;
    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      if (element === header || !(element instanceof HTMLElement)) continue;
      resizeObserver.observe(element);
    }

    // Also observe the header group itself for child changes
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Re-observe all children when the list changes
          const children = headerGroup.children;
          for (let i = 0; i < children.length; i++) {
            const element = children[i];
            if (element === header || !(element instanceof HTMLElement)) continue;
            resizeObserver.observe(element);
          }
        }
      }
    });

    mutationObserver.observe(headerGroup, { childList: true });
  }
});
