'use client';

import { useEffect, useMemo, useState } from 'react';
import Product from './Product';
import { getAttarPrices, isAttarProduct } from '../lib/product-pricing';

function getStartingPrice(product) {
  return isAttarProduct(product)
    ? Math.min(...Object.values(getAttarPrices(product)))
    : Number(product.price);
}

export default function ShopCatalog({ products, initialCategory, catalogUnavailable }) {
  const availableCategories = useMemo(
    () => [...new Set(products.map((product) => product.category || 'Other'))].sort(),
    [products],
  );
  const [category, setCategory] = useState(
    availableCategories.includes(initialCategory) ? initialCategory : 'All products',
  );
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!filtersOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') setFiltersOpen(false);
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [filtersOpen]);

  const categoryCounts = useMemo(
    () => products.reduce((counts, product) => {
      const name = product.category || 'Other';
      counts.set(name, (counts.get(name) || 0) + 1);
      return counts;
    }, new Map()),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesCategory = category === 'All products' || product.category === category;
      const matchesAvailability = availability === 'all'
        || (availability === 'in-stock' ? Number(product.stock) > 0 : Number(product.stock) <= 0);
      const matchesQuery = !normalizedQuery
        || [product.name, product.category, product.id]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesAvailability && matchesQuery;
    });

    if (sort === 'price-low') result.sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    if (sort === 'price-high') result.sort((a, b) => getStartingPrice(b) - getStartingPrice(a));
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [availability, category, products, query, sort]);

  function clearFilters() {
    setCategory('All products');
    setQuery('');
    setAvailability('all');
    setSort('featured');
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
      {catalogUnavailable && (
        <p role="alert" className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The live collection is temporarily unavailable. Please try again in a little while.
        </p>
      )}

      {filtersOpen && (
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setFiltersOpen(false)}
          className="fixed inset-0 z-50 bg-[#17231f]/45 lg:hidden"
        />
      )}

      <div className="grid items-start lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <aside
          id="shop-filters"
          role={filtersOpen ? 'dialog' : undefined}
          aria-label="Shop filters"
          aria-modal={filtersOpen ? 'true' : undefined}
          className={`fixed inset-y-0 right-0 z-[60] w-[min(88vw,360px)] overflow-y-auto border-l border-[#e3e7df] bg-white p-5 shadow-2xl transition-[transform,visibility] duration-300 sm:p-6 lg:visible lg:sticky lg:top-24 lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-visible lg:border lg:shadow-none ${
            filtersOpen ? 'visible translate-x-0' : 'invisible translate-x-full lg:visible lg:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[.16em] text-[#17231f]">Refine your search</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#08765b] hover:text-[#17231f]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full px-2 py-1 text-lg leading-none text-[#65746b] hover:bg-[#f1f2ed] lg:hidden"
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
          </div>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[#65746b]">
            Search
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Product or category"
              className="mt-2 min-h-11 w-full border border-[#dfe5df] px-3 text-sm font-normal normal-case tracking-normal text-[#17231f] outline-none placeholder:text-[#9aa49d] focus:border-[#08765b]"
            />
          </label>

          <fieldset className="mt-7">
            <legend className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#65746b]">Collection</legend>
            <div className="mt-3 space-y-1">
              <FilterOption
                label="All products"
                count={products.length}
                selected={category === 'All products'}
                onClick={() => setCategory('All products')}
              />
              {availableCategories.map((name) => (
                <FilterOption
                  key={name}
                  label={name}
                  count={categoryCounts.get(name) || 0}
                  selected={category === name}
                  onClick={() => setCategory(name)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7 border-t border-[#edf0eb] pt-6">
            <legend className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#65746b]">Availability</legend>
            <div className="mt-3 space-y-3">
              {[
                ['all', 'All products'],
                ['in-stock', 'Available now'],
                ['out-of-stock', 'Out of stock'],
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2.5 text-xs text-[#526059]">
                  <input
                    type="radio"
                    name="availability"
                    value={value}
                    checked={availability === value}
                    onChange={() => setAvailability(value)}
                    className="accent-[#08765b]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 border-t border-[#edf0eb] pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#65746b]">Need a hand?</p>
            <p className="mt-2 text-xs leading-5 text-[#748079]">
              Add an item to your cart, then choose your delivery district at checkout.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e7df] pb-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 max-sm:w-full max-sm:flex-none">
              <p aria-live="polite" className="whitespace-nowrap text-xs text-[#748079]">
                Showing <span className="font-semibold text-[#17231f]">{filteredProducts.length}</span>
                {' '}of {products.length} {products.length === 1 ? 'product' : 'products'}
                {category !== 'All products' && <span> in <span className="font-semibold text-[#17231f]">{category}</span></span>}
              </p>
              <button
                type="button"
                aria-controls="shop-filters"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen(true)}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-[#dfe5df] bg-white px-3 text-[10px] font-semibold uppercase tracking-[.1em] text-[#17231f] transition-colors hover:border-[#08765b] hover:text-[#08765b] lg:hidden"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M4 7h16M7 12h10m-7 5h4" />
                </svg>
                Filters
              </button>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.1em] text-[#65746b] max-sm:w-full max-sm:justify-between">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-h-10 border border-[#dfe5df] bg-white px-3 text-xs font-medium normal-case tracking-normal text-[#17231f] outline-none focus:border-[#08765b] max-sm:flex-1"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0 max-[374px]:grid-cols-1 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Product key={product.id} product={{ ...product, title: product.name }} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[#cfd8d1] bg-white px-6 text-center">
              <span className="text-3xl text-[#8ca99a]" aria-hidden="true">⌕</span>
              <h2 className="mt-3 text-lg font-medium text-[#17231f]">No products found</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#748079]">
                Try another search or clear the filters to browse the full collection.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 min-h-10 bg-[#17231f] px-5 text-[10px] font-semibold uppercase tracking-[.13em] text-white transition-colors hover:bg-[#08765b]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterOption({ label, count, selected, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-10 w-full items-center justify-between gap-3 px-2 text-left text-xs transition-colors ${
        selected ? 'bg-[#e7f1eb] font-semibold text-[#08664f]' : 'text-[#5f6d64] hover:bg-[#f7f7f3] hover:text-[#17231f]'
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}
