import { Component } from '@theme/component';

class SpaceBuilder extends Component {
  #state = 'product-grid';
  #data = { seating: [], aroma: [], platform: null, incense: null, home: [] };
  #history = [];

  // Seating selections
  #selectedProductIndex = -1;
  #selectedVariantIndex = -1;

  // Platform
  #platformAdded = false;

  // Aroma selections
  #selectedAromaProductIndex = -1;
  #selectedAromaVariantIndex = -1;

  // Incense selection
  #selectedIncenseVariantIndex = -1;

  // Aroma skipped
  #aromaSkipped = false;

  // Whether the incense is included free (palo santo set)
  #incenseIncluded = false;

  // Incense skipped
  #incenseSkipped = false;

  // Home selection
  #selectedHomeProductIndex = -1;
  #homeSkipped = false;

  connectedCallback() {
    super.connectedCallback();

    try {
      this.#data = JSON.parse(this.refs.productData?.textContent || '{}');
    } catch {
      this.#data = { seating: [], aroma: [], platform: null, incense: null, home: [] };
    }
  }

  /** Save current state to history before transitioning */
  #pushHistory() {
    this.#history.push({
      state: this.#state,
      productIndex: this.#selectedProductIndex,
      variantIndex: this.#selectedVariantIndex,
      platformAdded: this.#platformAdded,
      aromaProductIndex: this.#selectedAromaProductIndex,
      aromaVariantIndex: this.#selectedAromaVariantIndex,
      incenseVariantIndex: this.#selectedIncenseVariantIndex,
      aromaSkipped: this.#aromaSkipped,
      incenseIncluded: this.#incenseIncluded,
      incenseSkipped: this.#incenseSkipped,
      homeProductIndex: this.#selectedHomeProductIndex,
      homeSkipped: this.#homeSkipped,
    });
  }

  /** Hide all layers */
  #hideAll() {
    this.refs.selectionGrid?.setAttribute('data-state', 'hidden');
    this.refs.platformGrid?.setAttribute('data-state', 'hidden');
    this.refs.aromaGrid?.setAttribute('data-state', 'hidden');
    this.refs.homeGrid?.setAttribute('data-state', 'hidden');
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
    this.#platformAdded = snapshot.platformAdded;
    this.#selectedAromaProductIndex = snapshot.aromaProductIndex;
    this.#selectedAromaVariantIndex = snapshot.aromaVariantIndex;
    this.#selectedIncenseVariantIndex = snapshot.incenseVariantIndex;
    this.#aromaSkipped = snapshot.aromaSkipped;
    this.#incenseIncluded = snapshot.incenseIncluded;
    this.#incenseSkipped = snapshot.incenseSkipped;
    this.#selectedHomeProductIndex = snapshot.homeProductIndex;
    this.#homeSkipped = snapshot.homeSkipped;

    switch (snapshot.state) {
      case 'product-grid':
        this.refs.selectionGrid?.removeAttribute('data-state');
        break;
      case 'variant-grid':
        this.#showGrid('variantGrid', snapshot.productIndex);
        break;
      case 'platform-grid':
        this.refs.platformGrid?.removeAttribute('data-state');
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
      case 'home-grid':
        this.refs.homeGrid?.removeAttribute('data-state');
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

    // Update seating compact option highlights, image, and labels
    const options = this.refs.compactOption;
    const labels = this.refs.compactLabel;
    if (Array.isArray(options)) {
      options.forEach((btn, i) => {
        const selected = i === this.#selectedProductIndex;
        btn.setAttribute('data-selected', String(selected));
        if (selected && seatingVariant.imageUrl) {
          const img = btn.querySelector('img');
          if (img) img.src = seatingVariant.imageUrl;
        }
      });
    }
    if (Array.isArray(labels)) {
      labels.forEach((label, i) => {
        label.textContent = i === this.#selectedProductIndex ? 'Edit' : 'Swap';
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

    // Platform section — always visible once in configurator
    const platformSection = this.refs.platformSection;
    if (platformSection) {
      platformSection.hidden = false;
    }
    const platformCompact = this.refs.platformCompactOption;
    if (platformCompact) {
      platformCompact.setAttribute('data-selected', String(this.#platformAdded));
    }
    const platformSkip = this.refs.platformSkipOption;
    if (platformSkip) {
      platformSkip.setAttribute('data-selected', String(!this.#platformAdded));
    }
    if (this.#platformAdded && this.#data.platform) {
      if (this.refs.platformSelectedTitle) {
        this.refs.platformSelectedTitle.textContent = this.#data.platform.title || '';
      }
      if (this.refs.platformSelectedPrice) {
        this.refs.platformSelectedPrice.textContent = this.#data.platform.priceFormatted || '';
      }
    } else {
      if (this.refs.platformSelectedTitle) {
        this.refs.platformSelectedTitle.textContent = '';
      }
      if (this.refs.platformSelectedPrice) {
        this.refs.platformSelectedPrice.textContent = '';
      }
    }

    // Aroma section
    const hasAroma = this.#selectedAromaVariantIndex >= 0;
    const aromaVisible = hasAroma || this.#aromaSkipped;
    const continueAromaBtn = this.refs.continueToAroma;
    if (continueAromaBtn) {
      continueAromaBtn.hidden = aromaVisible;
    }

    const aromaSection = this.refs.aromaSection;
    if (aromaSection) {
      aromaSection.hidden = !aromaVisible;
    }

    const aromaProduct = hasAroma ? this.#data.aroma?.[this.#selectedAromaProductIndex] : null;
    const aromaVariant = hasAroma ? aromaProduct?.variants?.[this.#selectedAromaVariantIndex] : null;

    const aromaOptions = this.refs.aromaCompactOption;
    const aromaLabels = this.refs.aromaCompactLabel;
    if (Array.isArray(aromaOptions)) {
      aromaOptions.forEach((btn, i) => {
        const selected = hasAroma && i === this.#selectedAromaProductIndex;
        btn.setAttribute('data-selected', String(selected));
        if (selected && aromaVariant?.imageUrl) {
          const img = btn.querySelector('img');
          if (img) img.src = aromaVariant.imageUrl;
        }
      });
    }
    if (Array.isArray(aromaLabels)) {
      aromaLabels.forEach((label, i) => {
        label.textContent = hasAroma && i === this.#selectedAromaProductIndex ? 'Edit' : 'Swap';
      });
    }
    const aromaSkipBtn = this.refs.aromaSkipOption;
    if (aromaSkipBtn) {
      aromaSkipBtn.setAttribute('data-selected', String(this.#aromaSkipped && !hasAroma));
    }

    if (this.refs.aromaSelectedTitle) {
      this.refs.aromaSelectedTitle.textContent = aromaProduct?.title || '';
    }
    if (this.refs.aromaSelectedVariantName) {
      this.refs.aromaSelectedVariantName.textContent = aromaVariant?.name || '';
    }
    if (this.refs.aromaSelectedPrice) {
      this.refs.aromaSelectedPrice.textContent = aromaVariant?.priceFormatted || '';
    }

    // Incense section
    const hasIncense = this.#selectedIncenseVariantIndex >= 0 || this.#incenseIncluded;
    const incenseVisible = hasIncense || this.#incenseSkipped;
    const incenseSection = this.refs.incenseSection;
    if (incenseSection) {
      incenseSection.hidden = !incenseVisible;
    }

    if (hasIncense) {
      let incenseProduct, incenseVariant, priceText;

      if (this.#incenseIncluded) {
        incenseProduct = this.#data.includedIncense;
        incenseVariant = incenseProduct?.variants?.[0];
        priceText = 'Included';
      } else {
        incenseProduct = this.#data.incense;
        incenseVariant = incenseProduct?.variants?.[this.#selectedIncenseVariantIndex];
        priceText = incenseVariant?.priceFormatted || '';
      }

      const incenseBtn = this.refs.incenseCompactOption;
      if (incenseBtn) {
        incenseBtn.setAttribute('data-selected', 'true');
        if (incenseVariant?.imageUrl) {
          const img = incenseBtn.querySelector('img');
          if (img) img.src = incenseVariant.imageUrl;
        }
        incenseBtn.disabled = this.#incenseIncluded;
        incenseBtn.style.cursor = this.#incenseIncluded ? 'default' : '';
      }
      if (this.refs.incenseCompactLabel) {
        this.refs.incenseCompactLabel.textContent = this.#incenseIncluded ? '' : 'Edit';
      }

      const incenseSkipBtn = this.refs.incenseSkipOption;
      if (incenseSkipBtn) {
        incenseSkipBtn.setAttribute('data-selected', 'false');
        incenseSkipBtn.hidden = this.#incenseIncluded;
      }

      if (this.refs.incenseSelectedTitle) {
        this.refs.incenseSelectedTitle.textContent = incenseProduct?.title || '';
      }
      if (this.refs.incenseSelectedVariantName) {
        this.refs.incenseSelectedVariantName.textContent = incenseVariant?.name || '';
      }
      if (this.refs.incenseSelectedPrice) {
        this.refs.incenseSelectedPrice.textContent = priceText;
      }
    } else if (this.#incenseSkipped) {
      const incenseBtn = this.refs.incenseCompactOption;
      if (incenseBtn) {
        incenseBtn.setAttribute('data-selected', 'false');
      }
      const incenseSkipBtn = this.refs.incenseSkipOption;
      if (incenseSkipBtn) {
        incenseSkipBtn.setAttribute('data-selected', 'true');
      }
      if (this.refs.incenseSelectedTitle) {
        this.refs.incenseSelectedTitle.textContent = '';
      }
      if (this.refs.incenseSelectedVariantName) {
        this.refs.incenseSelectedVariantName.textContent = '';
      }
      if (this.refs.incenseSelectedPrice) {
        this.refs.incenseSelectedPrice.textContent = '';
      }
    }

    // Home section
    const hasHome = this.#selectedHomeProductIndex >= 0;
    const homeVisible = hasHome || this.#homeSkipped;
    const continueHomeBtn = this.refs.continueToHome;
    if (continueHomeBtn) {
      continueHomeBtn.hidden = !aromaVisible || homeVisible;
    }

    const homeSection = this.refs.homeSection;
    if (homeSection) {
      homeSection.hidden = !homeVisible;
    }

    const homeProduct = hasHome ? this.#data.home?.[this.#selectedHomeProductIndex] : null;

    const homeOptions = this.refs.homeCompactOption;
    const homeLabels = this.refs.homeCompactLabel;
    if (Array.isArray(homeOptions)) {
      homeOptions.forEach((btn, i) => {
        const selected = hasHome && i === this.#selectedHomeProductIndex;
        btn.setAttribute('data-selected', String(selected));
        if (selected && homeProduct?.imageUrl) {
          const img = btn.querySelector('img');
          if (img) img.src = homeProduct.imageUrl;
        }
      });
    }
    if (Array.isArray(homeLabels)) {
      homeLabels.forEach((label, i) => {
        label.textContent = hasHome && i === this.#selectedHomeProductIndex ? 'Edit' : 'Swap';
      });
    }
    const homeSkipBtn = this.refs.homeSkipOption;
    if (homeSkipBtn) {
      homeSkipBtn.setAttribute('data-selected', String(this.#homeSkipped && !hasHome));
    }

    if (this.refs.homeSelectedTitle) {
      this.refs.homeSelectedTitle.textContent = homeProduct?.title || '';
    }
    if (this.refs.homeSelectedPrice) {
      this.refs.homeSelectedPrice.textContent = homeProduct?.priceFormatted || '';
    }

    // Update total price
    this.#updateTotal();
  }

  /** Calculate and display the total price */
  #updateTotal() {
    const ready = this.#isReady();

    if (this.refs.totalSection) {
      this.refs.totalSection.hidden = !ready;
    }

    if (!ready) return;

    let total = 0;

    const seatingVariant = this.#data.seating?.[this.#selectedProductIndex]?.variants?.[this.#selectedVariantIndex];
    if (seatingVariant) total += seatingVariant.price;

    if (this.#platformAdded && this.#data.platform) {
      total += this.#data.platform.price;
    }

    if (this.#selectedAromaVariantIndex >= 0) {
      const aromaVariant = this.#data.aroma?.[this.#selectedAromaProductIndex]?.variants?.[this.#selectedAromaVariantIndex];
      if (aromaVariant) total += aromaVariant.price;
    }

    if (this.#selectedIncenseVariantIndex >= 0 && !this.#incenseIncluded) {
      const incenseVariant = this.#data.incense?.variants?.[this.#selectedIncenseVariantIndex];
      if (incenseVariant) total += incenseVariant.price;
    }

    if (this.#selectedHomeProductIndex >= 0) {
      const homeProduct = this.#data.home?.[this.#selectedHomeProductIndex];
      if (homeProduct) total += homeProduct.price;
    }

    if (this.refs.totalPrice) {
      this.refs.totalPrice.textContent = this.#formatMoney(total);
    }
  }

  /** Check if all required selections are made */
  #isReady() {
    const seatingDone = this.#selectedVariantIndex >= 0;
    const aromaDone = this.#selectedAromaVariantIndex >= 0 || this.#aromaSkipped;
    const homeDone = this.#selectedHomeProductIndex >= 0 || this.#homeSkipped;
    return seatingDone && aromaDone && homeDone;
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

  /** Pick a seating variant → show platform grid */
  selectVariant({ product, variant }, event) {
    const productIdx = Number(product);
    const variantIdx = Number(variant);

    if (!this.#data.seating?.[productIdx]?.variants?.[variantIdx]) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedProductIndex = productIdx;
    this.#selectedVariantIndex = variantIdx;
    this.#state = 'platform-grid';

    this.refs.platformGrid?.removeAttribute('data-state');
  }

  /** Add platform → go to configurator */
  addPlatform() {
    this.#pushHistory();
    this.#hideAll();

    this.#platformAdded = true;
    this.#state = 'configurator';

    this.#showConfigurator();
  }

  /** Skip platform → go to configurator */
  skipPlatform() {
    this.#pushHistory();
    this.#hideAll();

    this.#platformAdded = false;
    this.#state = 'configurator';

    this.#showConfigurator();
  }

  /** Re-add platform from configurator compact option */
  addPlatformFromConfig() {
    this.#platformAdded = true;
    this.#showConfigurator();
  }

  /** Deselect platform (select skip option) */
  removePlatform() {
    this.#platformAdded = false;
    this.#showConfigurator();
  }

  /** Continue to aroma selection → show aroma product grid */
  continueToAroma() {
    this.#pushHistory();
    this.#hideAll();

    this.#state = 'aroma-grid';
    this.refs.aromaGrid?.removeAttribute('data-state');
  }

  /** Skip aroma selection → select the X option */
  skipAroma() {
    this.#aromaSkipped = true;
    this.#showConfigurator();
  }

  /** Deselect aroma (select skip option) */
  removeAroma() {
    this.#selectedAromaProductIndex = -1;
    this.#selectedAromaVariantIndex = -1;
    this.#selectedIncenseVariantIndex = -1;
    this.#incenseIncluded = false;
    this.#incenseSkipped = false;
    this.#aromaSkipped = true;
    this.#showConfigurator();
  }

  /** Deselect incense (select skip option) */
  removeIncense() {
    if (this.#incenseIncluded) return;
    this.#selectedIncenseVariantIndex = -1;
    this.#incenseSkipped = true;
    this.#showConfigurator();
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

    if (productIdx === 0 && this.#data.incense) {
      this.#incenseIncluded = false;
      this.#state = 'incense-variant-grid';
      this.#showGrid('incenseVariantGrid', 0);
    } else {
      this.#incenseIncluded = this.#data.includedIncense != null;
      this.#selectedIncenseVariantIndex = -1;
      this.#state = 'configurator';
      this.#showConfigurator();
    }
  }

  /** Re-select incense scent from configurator */
  changeIncense() {
    if (!this.#data.incense || this.#incenseIncluded) return;

    this.#pushHistory();
    this.#hideAll();

    this.#state = 'incense-variant-grid';
    this.#showGrid('incenseVariantGrid', 0);
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

  /** Continue to home product selection → show home grid */
  continueToHome() {
    this.#pushHistory();
    this.#hideAll();

    this.#state = 'home-grid';
    this.refs.homeGrid?.removeAttribute('data-state');
  }

  /** Skip home selection → select the X option */
  skipHome() {
    this.#homeSkipped = true;
    this.#showConfigurator();
  }

  /** Pick a home product → return to configurator */
  selectHome({ index }, event) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this.#data.home.length) return;

    this.#pushHistory();
    this.#hideAll();

    this.#selectedHomeProductIndex = idx;
    this.#homeSkipped = false;
    this.#state = 'configurator';

    this.#showConfigurator();
  }

  /** Deselect home product (select skip option) */
  removeHome() {
    this.#selectedHomeProductIndex = -1;
    this.#homeSkipped = true;
    this.#showConfigurator();
  }

  /** Add all selected items to cart and redirect to checkout */
  async checkout() {
    if (!this.#isReady()) return;

    const items = [];

    const seatingVariant = this.#data.seating?.[this.#selectedProductIndex]?.variants?.[this.#selectedVariantIndex];
    if (seatingVariant) items.push({ id: seatingVariant.id, quantity: 1 });

    if (this.#platformAdded && this.#data.platform) {
      const platformVariant = this.#data.platform.variants?.[0];
      if (platformVariant) items.push({ id: platformVariant.id, quantity: 1 });
    }

    if (this.#selectedAromaVariantIndex >= 0) {
      const aromaVariant = this.#data.aroma?.[this.#selectedAromaProductIndex]?.variants?.[this.#selectedAromaVariantIndex];
      if (aromaVariant) items.push({ id: aromaVariant.id, quantity: 1 });
    }

    if (this.#selectedIncenseVariantIndex >= 0 && !this.#incenseIncluded) {
      const incenseVariant = this.#data.incense?.variants?.[this.#selectedIncenseVariantIndex];
      if (incenseVariant) items.push({ id: incenseVariant.id, quantity: 1 });
    }

    if (this.#selectedHomeProductIndex >= 0) {
      const homeProduct = this.#data.home?.[this.#selectedHomeProductIndex];
      const homeVariant = homeProduct?.variants?.[0];
      if (homeVariant) items.push({ id: homeVariant.id, quantity: 1 });
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
