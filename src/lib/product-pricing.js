export const attarSizesMl = [3, 5, 10];

const namedAttarImages = {
  'Oud Al Layl': '/attor/oudAlLayl.jpeg',
  'Ameer Al Oud': '/attor/ameerAlOud.jpeg',
  'Hawas Fire': '/attor/hawasFire.jpeg',
  'Vampire Blood': '/attor/vampireBlood.jpeg',
};

export function isAttarProduct(product) {
  return product?.category === 'Attar & Fragrance';
}

export function getSuggestedAttarPrices(tenMlPrice) {
  const price = Number(tenMlPrice);
  if (!Number.isFinite(price) || price < 0) {
    return { 3: 0, 5: 0, 10: 0 };
  }

  return {
    3: Math.round((price * 0.4) / 10) * 10,
    5: Math.round((price * 0.65) / 10) * 10,
    10: price,
  };
}

export function getAttarPrices(product) {
  const suggested = getSuggestedAttarPrices(product?.price);
  const stored = product?.pricesBySize || {};
  return Object.fromEntries(
    attarSizesMl.map((size) => {
      const price = Number(stored[size] ?? stored[String(size)] ?? suggested[size]);
      return [size, Number.isFinite(price) && price >= 0 ? price : suggested[size]];
    }),
  );
}

export function getNamedAttarImage(productName) {
  if (typeof productName !== 'string') return null;
  const entry = Object.entries(namedAttarImages)
    .find(([name]) => productName.toLowerCase().includes(name.toLowerCase()));
  return entry?.[1] || null;
}
