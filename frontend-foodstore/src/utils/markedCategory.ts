export function syncMarkedCategory(
  selectedCategory: string,
  categoriesContainer: HTMLElement | null,
) {
  if (!categoriesContainer) return;

  const anchors = Array.from(categoriesContainer.querySelectorAll("a"));

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    const hrefParams = new URL(href, window.location.href).searchParams;
    const anchorCategory = (
      anchor.getAttribute("data-category-name") ||
      hrefParams.get("categoria") ||
      ""
    ).toLowerCase();

    const shouldMark = selectedCategory
      ? anchorCategory === selectedCategory
      : !anchorCategory;

    anchor.classList.toggle("marked", shouldMark);
  });
}
