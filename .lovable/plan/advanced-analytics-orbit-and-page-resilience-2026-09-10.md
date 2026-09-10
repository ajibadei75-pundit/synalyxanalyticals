# Advanced analytics orbit and page resilience

## What will change
- Upgrade the homepage analytics visual with additional recognizable analytics icons, layered orbital paths, animated data particles, and richer live metric readouts.
- Keep the scene clear on phones and desktops, with all motion disabled or softened for reduced-motion preferences.
- Remove the decorative color blobs and keep the animation aligned with the existing Synalyx visual system.
- Strengthen public page loading so data-fetch failures show usable fallback content instead of an empty page.
- Verify the homepage and gallery render without runtime errors at desktop and mobile sizes.

## Technical details
- Extend the current semantic CSS motion system rather than adding a new animation dependency.
- Make public course and content reads resilient to backend failures while preserving existing security controls.
- Preserve the current route structure, navigation, light/dark modes, and admin visibility rules.
