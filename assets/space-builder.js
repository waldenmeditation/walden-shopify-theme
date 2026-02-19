import { Component } from '@theme/component';

class SpaceBuilder extends Component {
  #state = 'grid';
  #products = [];
  #selectedIndex = -1;

  connectedCallback() {
    super.connectedCallback();

    try {
      this.#products = JSON.parse(this.refs.productData?.textContent || '[]');
    } catch {
      this.#products = [];
    }
  }

  selectSeating({ index }, event) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this.#products.length) return;

    if (this.#state === 'grid') {
      this.#transitionToConfigurator(idx);
    } else {
      this.#updateSelection(idx);
    }
  }

  #transitionToConfigurator(idx) {
    const grid = this.refs.selectionGrid;
    const configurator = this.refs.configurator;

    if (!grid || !configurator) return;

    grid.setAttribute('data-state', 'hidden');
    configurator.removeAttribute('hidden');
    configurator.setAttribute('data-state', 'visible');

    this.#state = 'configurator';
    this.#updateSelection(idx);
  }

  #updateSelection(idx) {
    this.#selectedIndex = idx;

    // Update preview images
    const previews = this.refs.previewImage;
    if (Array.isArray(previews)) {
      previews.forEach((img, i) => {
        img.hidden = i !== idx;
      });
    }

    // Update compact option highlights
    const options = this.refs.compactOption;
    if (Array.isArray(options)) {
      options.forEach((btn, i) => {
        btn.setAttribute('data-selected', String(i === idx));
      });
    }

    // Update text
    const product = this.#products[idx];
    if (!product) return;

    if (this.refs.selectedTitle) {
      this.refs.selectedTitle.textContent = product.title;
    }

    if (this.refs.selectedPrice) {
      this.refs.selectedPrice.textContent = product.priceFormatted;
    }
  }
}

if (!customElements.get('space-builder-component')) {
  customElements.define('space-builder-component', SpaceBuilder);
}
