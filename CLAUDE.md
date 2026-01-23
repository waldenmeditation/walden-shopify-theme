# Walden Shopify Theme - Claude Memory

## Product Media Gallery Image Logic

### How variant images are controlled
The product media gallery uses a **position-based "waterfall" approach**, not alt tags:

1. Each variant has a "featured media" (lead image) assigned in Shopify admin
2. Images are assumed to be grouped consecutively by variant in the media library
3. When a variant is selected:
   - Start = that variant's featured media position
   - End = next variant's featured media position
   - Shows all images between start and end

### Key files
- `snippets/product-variant-images-pdp.liquid` - Builds the variant-to-media map (JavaScript)
- `snippets/product-slideshow.liquid` - Renders slideshow and handles variant updates
- `blocks/_product-media-gallery.liquid` - Main gallery block with Liquid rendering logic

### Special alt tag behaviors
- `alt="skip"` - Image is excluded from all variants
- `alt="all"` - Image appears for ALL variants (appended last)

### Important notes for "all" images
- "all" images are always appended AFTER variant-specific images
- For correct scroll order in the carousel, "all" images should be positioned at the end of the media list in Shopify admin (the JS shows/hides slides but doesn't reorder the DOM)

### Unused code
There is orphaned alt-tag matching code in `blocks/_product-details.liquid` (lines 46-53) that builds a `matching_images` array but never uses it. This is dead code.
