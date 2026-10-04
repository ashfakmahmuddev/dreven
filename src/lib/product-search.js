function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function editDistance(left, right) {
  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      currentRow[rightIndex] = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previousRow = currentRow;
  }

  return previousRow[right.length];
}

export function getProductSearchScore(product, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const name = normalizeSearchText(product?.name || product?.title);
  const category = normalizeSearchText(product?.category);
  const id = normalizeSearchText(product?.id);
  const fields = [name, category, id].filter(Boolean);
  if (fields.some((field) => field.includes(normalizedQuery))) {
    return name.includes(normalizedQuery) ? 0 : 1;
  }

  const candidates = [...new Set(fields.flatMap((field) => field.split(' ')))];
  const queryWords = normalizedQuery.split(' ');
  let score = 0;

  for (const word of queryWords) {
    let bestScore = Infinity;
    for (const candidate of candidates) {
      if (candidate === word || (candidate.length > 2 && candidate.startsWith(word))) {
        bestScore = Math.min(bestScore, 0);
        continue;
      }
      if (word.length < 3 || candidate.length < 3) continue;

      const distance = editDistance(word, candidate);
      const threshold = Math.min(2, Math.max(1, Math.floor(Math.max(word.length, candidate.length) * 0.25)));
      if (distance <= threshold) bestScore = Math.min(bestScore, distance + 1);
    }
    if (!Number.isFinite(bestScore)) return null;
    score += bestScore;
  }

  return score + 2;
}
