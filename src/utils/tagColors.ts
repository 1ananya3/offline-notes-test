// Tag color palette
export const TAG_COLORS = [
  '#a991f7', // pastel purple
  '#f7a6c7', // pastel pink
  '#fbbf24', // pastel orange
  '#6ee7b7', // pastel green
  '#60a5fa', // pastel blue
  '#f9a8d4', // pastel magenta
  '#fcd34d', // pastel yellow
  '#5eead4', // pastel teal
  '#c4b5fd', // pastel lavender
  '#fca5a5', // pastel red
];

// Shared tag color map
export const tagColorMap: { [tag: string]: string } = {};

// Assigns colors to tags, ensuring no duplicates until palette is exhausted
export function assignTagColors(tags: string[]) {
  const usedColors = new Set(Object.values(tagColorMap));
  let colorIdx = 0;
  tags.forEach(tag => {
    if (!tagColorMap[tag]) {
      while (usedColors.has(TAG_COLORS[colorIdx]) && colorIdx < TAG_COLORS.length) {
        colorIdx++;
      }
      tagColorMap[tag] = TAG_COLORS[colorIdx % TAG_COLORS.length];
      usedColors.add(tagColorMap[tag]);
      colorIdx++;
    }
  });
} 