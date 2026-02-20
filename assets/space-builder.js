import { Component } from '@theme/component';

class SpaceBuilder extends Component {
  #state = 'product-grid';
  #data = { seating: [], aroma: [], incense: null };
  #history = [];

  // Seating selections
  #selectedProductIndex = -1;
  #selectedVariantIndex = -1;

  // Aroma selections
  #selectedAromaProductIndex = -1;
  #selectedAromaVariantIndex = -1;

  // Incense selection
  #selectedIncenseVariantIndex = -1;

  // Aroma skipped
  #aromaSkipped = false;

  connectedCallback() {
    super.connectedCallback();

    try {
      this.#data = JSON.parse(this.refs.productData?.textContent || '{}');
    } catch {
      this.#data = { seating: [], aroma: [], incense: null };
    }
  }

  /** Save current state to history before transitioning */
  #pushHistory() {
    this.#history.push({
      state: this.#state,
      productIndex: this.#selectedProductIndex,
      variantIndex: this.#selectedVariantIndex,
      aromaProductIndex: this.#selectedAromaProductIndex,
      aromaVariantIndex: this.#selectedAromaVariantIndex,
      incenseVariantIndex: this.#selectedIncenseVariantIndex,
      aromaSkipped: this.#aromaSkipped,
    });
  }

  /** Hide all layers */
  #hideAll() {
    this.refs.selectionGrid?.setAttribute('data-state', 'hidden');
    this.refs.aromaGrid?.setAttribute('data-state', 'hidden');
    this.refs.configurator?.setAttribute('data-state', 'hidden');

    for (const key of ['variantGrid', 'aromaVariantGrid', 'incenseVariantGrid']) {
      const grids = this.refs[key];
      if (Array.isArray(grids)) {
        grids.forEach((g) => g.setAttribute('data-state', 'hidden'));
      }
    }
  }

  /** Show a specific grid from an array ref by data-product-index */
  #showGrid(refName, productIndex) {
    const grids = this.refs[refName];
    if (Array.isArray(grids)) {
      const target = grids.find((g) => g.dataset.productIndex === String(productIndex));
      target?.removeAttribute('data-state');
    }
  }

  /** Restore a given state snapshot (used by goBack) */
  #restore(snapshot) {
    this.#hideAll();

    this.#state = snapshot.state;
    this.#selectedProductIndex = snapshot.productIndex;
    this.#selectedVariantIndex = snapshot.variantIndex;
    this.#selectedAromaProductIndex = snapshot.aromaProductIndex;
    this.#selectedAromaVariantIndex = snapshot.aromaVariantIndex;
    this.#selectedIncenseVariantIndex = snapshot.incenseVariantIndex;
    this.#aromaSkipped = snapshot.aromaSkipped;

    switch (snapshot.state) {
      case 'product-grid':
        this.refs.selectionGrid?.removeAttribute('data-state');
        break;
      case 'variant-grid':
        this.#showGrid('variantGrid', snapshot.productIndex);
        break;
      case 'configurator':
        this.#showConfigurator();
        break;
      case 'aroma-grid':
        this.refs.aromaGrid?.removeAttribute('data-state');
        break;
      case 'aroma-variant-grid':
        this.#showGrid('aromaVariantGrid', snapshot.aromaProductIndex);
        break;
      case 'incense-variant-grid':
        this.#showGrid('incenseVariantGrid', 0);
        break;
    }
  }

  /** Render the configurator with current selections */
  #showConfigurator() {
    const seatingProduct = this.#data.seating?.[this.#selectedProductIndex];
    const seatingVariant = seatingProduct?.variants?.[this.#selectedVariantIndex];
    if (!seatingProduct || !seatingVariant) return;

    const configurator = this.refs.configurator;
    if (configurator) {
      configurator.removeAttribute('hidden');
      configurator.setAttribute('data-state', 'visible');
    }

    // Update seating preview image
    const previews = this.refs.previewImage;
    if (Array.isArray(previews)) {
      previews.forEach((img, i) => {
        img.hidden = i !== this.#selectedProductIndex;
        if (i === this.#selectedProductIndex && seatingVariant.imageUrl) {
          img.src = seatingVariant.imageUrl;
        }
      });
    }

    // Update seating compact option highlights and image
    const options = this.refs.compactOption;
    if (Array.isArray(options)) {
      options.forEach((btn, i) => {
        btn.setAttribute('data-selected', String(i === this.#selectedProductIndex));
        if (i === this.#selectedProductIndex && seatingVariant.imageUrl) {
          const img = btn.querySelector('img');
          if (img) img.src = seatingVariant.imageUrl;
        }
      });
    }

    // Update seating text
    if (this.refs.selectedTitle) {
      this.refs.selectedTitle.textContent = seatingProduct.title;
    }
    if (this.refs.selectedVariantName) {
      this.refs.selectedVariantName.textContent = seatingVariant.name;
    }
    if (this.refs.selectedPrice) {
      this.refs.selectedPrice.textContent = seatingVariant.priceFormatted;
    }

    // Aroma section visibility
    const hasAroma = this.#selectedAromaVariantIndex >= 0;
    const aromaSection = this.refs.aromaSection;
    if (aromaSection) {
      aromaSection.hidden = !hasAroma;
    }

    if (hasAroma) {
      const aromaProduct = this.#data.aroma?.[this.#selectedAromaProductIndex];
      const aromaVariant = aromaProduct?.variants?.[this.#selectedAromaVariantIndex];

      // Update aroma compact options
      const aromaOptions = this.refs.aromaCompactOption;
      if (Array.isArray(aromaOptions)) {
        aromaOptions.forEach((btn, i) => {
          btn.setAttribute('data-selected', String(i === this.#selectedAromaProductIndex));
          if (i === this.#selectedAromaProductIndex && aromaVariant?.imageUrl) {
            const img = btn.querySelector('img');
            if (img) img.src = aromaVariant.imageUrl;
          }
        });
      }

      // Update aroma text
      if (this.refs.aromaSelectedTitle) {
        this.refs.aromaSelectedTitle.textContent = aromaProduct?.title || '';
      }
      if (this.refs.aromaSelectedVariantName) {
        this.refs.aromaSelectedVariantName.textContent = aromaVariant?.name || '';
      }
      if (this.refs.aromaSelectedPrice) {
        this.refs.aromaSelectedPrice.textContent = aromaVariant?.priceFormatted || '';
      }
    }

    // Incense section visibility
    const hasIncense = this.#selectedIncenseVariantIndex >= 0;
    const incenseSection = this.refs.incenseSection;
    if (incenseSection) {
      incenseSection.hidden = !hasIncense;
    }

    if (hasIncense) {
      const incenseProduct = this.#data.incense;
      const incenseVariant = incenseProduct?.variants?.[this.#selectedIncenseVariantIndex];

      if (this.refs.incenseSelectedTitle) {
        this.refs.incenseSelectedTitle.textContent = incenseProduct?.title || '';
      }
      if (this.refs.incenseSelectedVariantName) {
        this.refs.incenseSelectedVariantName.textContent = incenseVariant?.name || '';
      }
      if (this.refs.incenseSelectedPrice) {
        this.refs.incenseSelectedPrice.textContent = incenseVariant?.priceFormatted || '';
      }
    }

    // Show/hide "Continue to Aroma" button
    const continueBtn = this.refs.continueToAroma;
    if (continueBtn) {
      continueBtn.hidden = hasAroma;
    }

    // Update total price
    this.#updateTotal();
  }

  /** Calculate and display the total price */
  #updateTotal() {
    let total = 0;

    const seatingVariant = this.#data.seating?.[this.#selectedProductIndex]?.variants?.[this.#selectedVariantIndex];
    if (seatingVariant) total += seatingVariant.price;

    if (this.#selectedAromaVariantIndex >= 0) {
      const aromaVariant = this.#data.aroma?.[this.#selectedAromaProductIndex]?.variants?.[this.#selectedAromaVariantIndex];
      if (aromaVariant) total += aromaVariant.price;
    }

    if (this.#selectedIncenseVariantIndex >= 0) {
      const incenseVariant = this.#data.incense?.variants?.[this.#selectedIncenseVariantIndex];
      if (incenseVariant) total += incenseVariant.price;
    }

    if (this.refs.totalPrice) {
      this.refs.totalPrice.textContent = this.#formatMoney(total);
    }

    // Checkout button ready state
    if (this.refs.checkoutBtn) {
      this.refs.checkoutBtn.setAttribute('data-ready', String(this.#isReady()));
    }
  }

  /** Check if all required selections are made */
  #isReady() {
    return this.#selectedVariantIndex >= 0 && (this.#selectedAromaVariantIndex >= 0 || this.#aromaSkipped);
  }

  /** Format cents as currency */
  #formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  /** Pick a seating product → show its variant grid */
  selectSeating({ index }, event) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this.#data.seating.length) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedProductIndex = idx;
    this.#state = 'variant-grid';

    this.#showGrid('variantGrid', idx);
  }

  /** Pick a seating variant → show the configurator */
  selectVariant({ product, variant }, event) {
    const productIdx = Number(product);
    const variantIdx = Number(variant);

    if (!this.#data.seating?.[productIdx]?.variants?.[variantIdx]) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedProductIndex = productIdx;
    this.#selectedVariantIndex = variantIdx;
    this.#state = 'configurator';

    this.#showConfigurator();
  }

  /** Continue to aroma selection → show aroma product grid */
  continueToAroma() {
    this.#pushHistory();
    this.#hideAll();

    this.#state = 'aroma-grid';
    this.refs.aromaGrid?.removeAttribute('data-state');
  }

  /** Skip aroma selection → activate checkout */
  skipAroma() {
    this.#aromaSkipped = true;

    const continueBtn = this.refs.continueToAroma;
    if (continueBtn) {
      continueBtn.hidden = true;
    }

    this.#updateTotal();
  }

  /** Pick an aroma product → show its variant grid */
  selectAroma({ index }, event) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this.#data.aroma.length) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedAromaProductIndex = idx;
    this.#state = 'aroma-variant-grid';

    this.#showGrid('aromaVariantGrid', idx);
  }

  /** Pick an aroma variant → show incense grid (if product 0) or return to configurator */
  selectAromaVariant({ product, variant }, event) {
    const productIdx = Number(product);
    const variantIdx = Number(variant);

    if (!this.#data.aroma?.[productIdx]?.variants?.[variantIdx]) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedAromaProductIndex = productIdx;
    this.#selectedAromaVariantIndex = variantIdx;

    // If first aroma product (block incense holder), show incense scent selection
    if (productIdx === 0 && this.#data.incense) {
      this.#state = 'incense-variant-grid';
      this.#showGrid('incenseVariantGrid', 0);
    } else {
      this.#state = 'configurator';
      this.#showConfigurator();
    }
  }

  /** Pick an incense scent → return to configurator */
  selectIncense({ product, variant }, event) {
    const variantIdx = Number(variant);

    if (!this.#data.incense?.variants?.[variantIdx]) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedIncenseVariantIndex = variantIdx;
    this.#state = 'configurator';

    this.#showConfigurator();
  }

  /** Add all selected items to cart and redirect to checkout */
  async checkout() {
    if (!this.#isReady()) return;

    const items = [];

    const seatingVariant = this.#data.seating?.[this.#selectedProductIndex]?.variants?.[this.#selectedVariantIndex];
    if (seatingVariant) items.push({ id: seatingVariant.id, quantity: 1 });

    if (this.#selectedAromaVariantIndex >= 0) {
      const aromaVariant = this.#data.aroma?.[this.#selectedAromaProductIndex]?.variants?.[this.#selectedAromaVariantIndex];
      if (aromaVariant) items.push({ id: aromaVariant.id, quantity: 1 });
    }

    if (this.#selectedIncenseVariantIndex >= 0) {
      const incenseVariant = this.#data.incense?.variants?.[this.#selectedIncenseVariantIndex];
      if (incenseVariant) items.push({ id: incenseVariant.id, quantity: 1 });
    }

    if (items.length === 0) return;

    try {
      await fetch((window.Theme?.routes?.root || '/') + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      window.location.href = (window.Theme?.routes?.root || '/') + 'checkout';
    } catch {
      // Fallback: redirect to cart page
      window.location.href = (window.Theme?.routes?.root || '/') + 'cart';
    }
  }

  /** Pop history and restore previous state */
  goBack() {
    const prev = this.#history.pop();
    if (prev) {
      this.#restore(prev);
    }
  }
}

if (!customElements.get('space-builder-component')) {
  customElements.define('space-builder-component', SpaceBuilder);
}
