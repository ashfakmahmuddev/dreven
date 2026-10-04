'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  attarSizesMl,
  getAttarPrices,
  getNamedAttarImage,
  isAttarProduct,
} from '../lib/product-pricing';

function formatPrice(price) {
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

export default function ProductDetails({ product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(3);
  const [notice, setNotice] = useState('');
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const isOutOfStock = !Number.isSafeInteger(product.stock) || product.stock <= 0;
  const isAttar = isAttarProduct(product);
  const attarPrices = isAttar ? getAttarPrices(product) : null;
  const unitPrice = isAttar ? attarPrices[selectedSize] : product.price;
  const namedImage = getNamedAttarImage(product.name);
  const images = [...new Set([
    product.image || '/dreven_dv.png',
    namedImage,
  ].filter(Boolean))];

  function updateCart(shouldCheckout) {
    setNotice('');
    try {
      const savedCart = window.localStorage.getItem('dreven-cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      if (!Array.isArray(cart)) throw new Error('Saved cart data is not valid.');

      const existingProduct = cart.find(
        (item) => item.id === product.id && (item.sizeMl || null) === (isAttar ? selectedSize : null),
      );
      const productQuantityInCart = cart
        .filter((item) => item.id === product.id)
        .reduce((total, item) => total + item.quantity, 0);
      const nextQuantity = (existingProduct?.quantity || 0) + quantity;
      if (
        !Number.isSafeInteger(nextQuantity) ||
        productQuantityInCart + quantity > product.stock
      ) {
        setNotice(`Only ${product.stock} item${product.stock === 1 ? '' : 's'} available. Reduce the quantity in your cart first.`);
        return;
      }

      const nextCart = existingProduct
        ? cart.map((item) => item.id === product.id
          && (item.sizeMl || null) === (isAttar ? selectedSize : null)
          ? { ...item, quantity: nextQuantity, price: unitPrice }
          : item)
        : [...cart, {
          id: product.id,
          title: product.name,
          price: unitPrice,
          image: product.image || '/dreven_dv.png',
          quantity,
          ...(isAttar ? { sizeMl: selectedSize } : {}),
        }];

      window.localStorage.setItem('dreven-cart', JSON.stringify(nextCart));
      window.dispatchEvent(new Event('dreven-cart-updated'));
      if (shouldCheckout) {
        router.push('/checkout');
      } else {
        setAdded(true);
        setNotice(`${product.name} added to your cart.`);
      }
    } catch (error) {
      console.error('Could not add the product to the cart.', error);
      setNotice('Could not add this product to your cart. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-neutral-900 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/" className="transition-colors hover:text-emerald-700">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{product.category}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="truncate text-neutral-800">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <button
              type="button"
              onClick={() => setIsImageZoomed(true)}
              aria-label={`Enlarge image of ${product.name}`}
              className="group relative block aspect-square w-full overflow-hidden bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                unoptimized
                className="cursor-zoom-in object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {isOutOfStock && (
                <span className="absolute left-4 top-4 bg-neutral-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-white">
                  Out of stock
                </span>
              )}
            </button>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`relative aspect-square overflow-hidden bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                      selectedImage === index
                        ? 'ring-2 ring-neutral-900 ring-offset-2'
                        : 'opacity-70 transition-opacity hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} image ${index + 1}`}
                      fill
                      sizes="(max-width: 639px) 25vw, 120px"
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="py-1 sm:py-4">
            <p className="text-xs font-medium uppercase tracking-[.18em] text-neutral-500">
              {product.category}
            </p>
            <h1 className="mt-3 text-2xl font-medium uppercase tracking-wide sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-4 text-xl font-medium">{formatPrice(unitPrice)}</p>

            <p className={`mt-5 flex items-center gap-2 text-sm ${isOutOfStock ? 'text-amber-800' : 'text-neutral-700'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isOutOfStock ? 'bg-amber-600' : 'bg-emerald-600'}`} aria-hidden="true" />
              {isOutOfStock ? 'Currently unavailable' : `In stock · ${product.stock} available`}
            </p>

            {isAttar && (
              <fieldset className="mt-8 border-t border-neutral-200 pt-6">
                <legend className="text-sm font-medium">Choose bottle size</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {attarSizesMl.map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-24 border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                        selectedSize === size
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{size}ml</span>
                      <span className="mt-1 block text-xs">{formatPrice(attarPrices[size])}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className={`${isAttar ? 'mt-6' : 'mt-8'} border-t border-neutral-200 pt-6`}>
              <label htmlFor="product-quantity" className="text-sm font-medium">
                Quantity
              </label>
              <div className="mt-3 inline-flex h-12 items-center border border-neutral-200">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="h-full w-12 text-lg transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  −
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  disabled={isOutOfStock}
                  onChange={(event) => {
                    const nextQuantity = Number(event.target.value);
                    if (Number.isSafeInteger(nextQuantity) && nextQuantity >= 1 && nextQuantity <= product.stock) {
                      setQuantity(nextQuantity);
                    }
                  }}
                  className="h-full w-14 border-x border-neutral-200 text-center text-sm outline-none disabled:bg-neutral-100"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={isOutOfStock || quantity >= product.stock}
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  className="h-full w-12 text-lg transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-500">SKU: {product.id}</p>

            {notice && (
              <p role="status" aria-live="polite" className="mt-5 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                {notice}
              </p>
            )}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => updateCart(false)}
                className={`min-h-12 w-full px-5 text-xs font-semibold uppercase tracking-[.12em] text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${isOutOfStock ? 'cursor-not-allowed bg-neutral-400' : added ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-neutral-900 hover:bg-emerald-700'}`}
              >
                {isOutOfStock ? 'Out of stock' : added ? 'Added to cart ✓' : `Add to cart · ${formatPrice(Number(unitPrice) * quantity)}`}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => updateCart(true)}
                className="min-h-12 w-full bg-emerald-600 px-5 text-xs font-semibold uppercase tracking-[.12em] text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Buy it now
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="border border-neutral-200 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[.12em]">Delivery information</h2>
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Delivery charges are calculated at checkout based on your district.
                </p>
              </div>
              <div className="border border-neutral-200 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[.12em]">Cash on delivery</h2>
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Pay the courier when your order is delivered.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      {isImageZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged image of ${product.name}`}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsImageZoomed(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-10"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setIsImageZoomed(false)}
            aria-label="Close enlarged image"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center bg-white text-2xl text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            ×
          </button>
          <div className="relative h-full w-full" onClick={(event) => event.stopPropagation()}>
            <Image
              src={images[selectedImage]}
              alt={`${product.name} enlarged`}
              fill
              sizes="100vw"
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}
