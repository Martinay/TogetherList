1. **Architecture**: Implement Vertical Slice Architecture (Feature Folders). Organize code by feature (e.g., `src/features/my-feature`), grouping components, hooks, api, and styles together. Avoid grouping by type (e.g., `components/`, `hooks/`) at the top level.
2. Typography - Don't just use generic fonts. Pick something interesting.
2. Color & Theme - Commit to a cohesive color palette. Instead of using 10 colors, use 2-3 dominant colors with sharp accents.
3. Motion - Use animations strategically. Do not overload it with animations.
4. Spatial Composition - Break the grid. Use asymmetry. Overlap elements. Create unexpected layouts.
5. Backgrounds & Details - Don't just use solid colors. Add textures, subtle gradients, decorative elements that match your aesthetic.
6. Always have a look at the UX. Create the UI so it is easy to use and intuitive. A 10 year old child should be able to use it without any issues.
7. Make sure that the UI always supports multiple languages. All strings must be loaded from a translation file.
8. **Performance Budgets**: All pages must meet these thresholds:
   - LCP (Largest Contentful Paint): < 2.5 seconds
   - FCP (First Contentful Paint): < 1.8 seconds
   - Initial Bundle size: ≤ 200 KB (compressed)