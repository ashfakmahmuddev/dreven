'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAttarPrices, isAttarProduct } from '../lib/product-pricing';

const menu = [
  { id: 'Overview', label: 'Overview', icon: 'grid' },
  { id: 'Orders', label: 'Orders', icon: 'orders' },
  { id: 'Products', label: 'Products', icon: 'box' },
  { id: 'Customers', label: 'Customers', icon: 'users' },
  { id: 'Delivery', label: 'Delivery', icon: 'truck' },
];

const statusStyles = {
  Pending: 'bg-white text-black ring-1 ring-inset ring-black/15',
  Processing: 'bg-black text-white',
  Shipped: 'bg-neutral-700 text-white',
  Delivered: 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-black/10',
  Cancelled: 'bg-neutral-200 text-neutral-500',
};

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    orders: <><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M8 12h8M8 16h5" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18.5" r="1.5" /><circle cx="17.5" cy="18.5" r="1.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6M10 11v5m4-5v5" /></>,
    edit: <><path d="m16 4 4 4L9 19l-5 1 1-5L16 4Z" /><path d="m14 6 4 4" /></>,
  };

  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatPrice(price) {
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

export default function AdminDashboard() {
  const [section, setSection] = useState('Overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [query, setQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All orders');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downloadingInvoices, setDownloadingInvoices] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    const response = await fetch('/api/admin/products', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Products could not be loaded.');
    setProducts(result.products);
  }, []);

  const loadOrders = useCallback(async () => {
    const response = await fetch('/api/admin/orders', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Orders could not be loaded.');
    setOrders(result.orders);
  }, []);

  const migrateLegacyProducts = useCallback(async () => {
    const migrationKey = 'dreven-admin-products-migrated';
    if (window.localStorage.getItem(migrationKey)) return;

    const savedProducts = window.localStorage.getItem('dreven-admin-products');
    if (!savedProducts) return;
    const legacyProducts = JSON.parse(savedProducts);
    if (!Array.isArray(legacyProducts)) {
      throw new Error('Previously saved product data is not valid and was not changed.');
    }

    const response = await fetch('/api/admin/products', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Saved products could not be imported.');

    const existingProducts = new Map(result.products.map((product) => [product.id, product]));
    let importedCount = 0;
    for (const product of legacyProducts) {
      const existingProduct = product?.id ? existingProducts.get(product.id) : null;
      if (
        !product ||
        typeof product.id !== 'string' ||
        typeof product.name !== 'string'
      ) {
        continue;
      }
      if (
        existingProduct &&
        existingProduct.name === product.name &&
        existingProduct.category === product.category &&
        Number(existingProduct.price) === Number(product.price) &&
        Number(existingProduct.stock) === Number(product.stock) &&
        existingProduct.image === product.image
      ) {
        continue;
      }

      const formData = new FormData();
      formData.set('id', product.id);
      formData.set('name', product.name);
      formData.set('category', product.category || 'Other');
      formData.set('price', String(product.price));
      formData.set('stock', String(product.stock));

      if (typeof product.image === 'string' && product.image.startsWith('data:image/')) {
        const imageResponse = await fetch(product.image);
        const imageBlob = await imageResponse.blob();
        formData.set('imageFile', new File([imageBlob], 'imported-product-image', { type: imageBlob.type }));
      } else {
        formData.set('image', typeof product.image === 'string' ? product.image : '/dreven_dv.png');
      }

      const importResponse = await fetch('/api/admin/products', {
        method: existingProduct ? 'PATCH' : 'POST',
        body: formData,
      });
      const importResult = await importResponse.json();
      if (!importResponse.ok && importResponse.status !== 409) {
        throw new Error(importResult.error || `Could not import ${product.name}.`);
      }
      if (importResponse.ok) {
        importedCount += 1;
        existingProducts.set(product.id, importResult.product);
      }
    }

    window.localStorage.setItem(migrationKey, 'true');
    if (importedCount > 0) {
      await loadProducts();
      setNotice(`${importedCount} previously saved product${importedCount === 1 ? '' : 's'} imported into the live catalogue.`);
    }
  }, [loadProducts]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        const result = await response.json();
        if (response.status === 401 || result.authenticated === false) return;
        if (!response.ok) throw new Error(result.error || 'Admin sign-in is unavailable.');

        setAuthenticated(true);
        if (!active) return;
        await loadProducts();
        await migrateLegacyProducts();
        await loadOrders();
      } catch (error) {
        console.error('Could not load the admin dashboard.', error);
        if (active) {
          setNotice(error.message || 'The admin dashboard could not be loaded.');
          if (error.message?.includes('authentication is not configured')) {
            setAuthError(error.message);
          }
        }
      } finally {
        if (active) setReady(true);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [loadOrders, loadProducts, migrateLegacyProducts]);

  async function handleLogin(password) {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Admin sign-in failed.');

    setAuthenticated(true);
    setAuthError('');
    setNotice('');
    try {
      await loadProducts();
      await migrateLegacyProducts();
      await loadOrders();
    } catch (error) {
      console.error('Could not load products after admin sign-in.', error);
      setNotice(error.message || 'Products could not be loaded.');
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Could not sign out.');
      setAuthenticated(false);
      setProducts([]);
    } catch (error) {
      console.error('Admin sign-out failed.', error);
      setNotice(error.message || 'Could not sign out.');
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Order status could not be saved.');
      setOrders((currentOrders) => currentOrders.map((order) =>
        order.id === id ? { ...order, status } : order,
      ));
      setNotice(`Order ${id} updated to ${status}.`);
    } catch (error) {
      console.error('Could not update order status.', error);
      setNotice(error.message || 'Order status could not be saved.');
    }
  }

  async function saveOrderItems(id, items) {
    const response = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Order items could not be saved.');

    const updatedOrder = { ...selectedOrder, ...result.order };
    setOrders((currentOrders) => currentOrders.map((order) =>
      order.id === id ? { ...order, ...result.order } : order,
    ));
    setSelectedOrder(updatedOrder);
    try {
      await loadProducts();
    } catch (error) {
      console.error('Order was saved, but updated product stock could not be refreshed.', error);
    }
    setNotice(`Order ${id} items and total updated.`);
    return updatedOrder;
  }

  async function downloadInvoices(ordersToDownload, filename) {
    if (!ordersToDownload.length || downloadingInvoices) return false;
    setDownloadingInvoices(true);
    try {
      const { downloadInvoicesPdf } = await import('../lib/invoice-pdf');
      downloadInvoicesPdf(ordersToDownload, filename);
      setNotice(`${ordersToDownload.length} invoice${ordersToDownload.length === 1 ? '' : 's'} downloaded.`);
      return true;
    } catch (error) {
      console.error('Could not generate order invoices.', error);
      setNotice(error.message || 'Invoices could not be generated.');
      return false;
    } finally {
      setDownloadingInvoices(false);
    }
  }

  const visibleProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.customer} ${order.email} ${order.phone}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = orderFilter === 'All orders' || order.status === orderFilter;
    return matchesQuery && matchesStatus;
  }), [orders, query, orderFilter]);

  const customers = useMemo(() => {
    const unique = new Map();
    orders.forEach((order) => {
      const customerKey = order.email || order.phone || order.customer;
      if (!unique.has(customerKey)) unique.set(customerKey, { ...order, ordersCount: 0, spent: 0 });
      const customer = unique.get(customerKey);
      customer.ordersCount += 1;
      customer.spent += order.total;
    });
    return [...unique.values()].filter((customer) =>
      `${customer.customer} ${customer.email || ''} ${customer.phone || ''}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [orders, query]);

  function changeSection(nextSection) {
    setSection(nextSection);
    setMobileNavOpen(false);
    setQuery('');
  }

  function openProductForm(product = null) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function saveProduct(event) {
    const formData = new FormData(event.currentTarget);
    if (editingProduct) formData.set('id', editingProduct.id);

    const response = await fetch('/api/admin/products', {
      method: editingProduct ? 'PATCH' : 'POST',
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The product could not be saved.');

    setProducts((currentProducts) => editingProduct
      ? currentProducts.map((item) => item.id === editingProduct.id ? result.product : item)
      : [result.product, ...currentProducts]);
    setNotice(result.warning || 'Product saved to the live catalogue.');
  }

  async function updateProductStock(id, stock) {
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Product stock could not be updated.');

    setProducts((currentProducts) => currentProducts.map((product) =>
      product.id === id ? result.product : product,
    ));
    setNotice(stock === 0
      ? 'Stock updated. This product remains visible on the storefront and is marked out of stock.'
      : `Stock updated to ${stock}. This product is available to order on the storefront.`);
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Remove "${product.name}" from your product list?`)) return;
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The product could not be deleted.');

      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
      setNotice(result.warning || 'Product removed from the live catalogue.');
    } catch (error) {
      console.error('Could not delete the product.', error);
      setNotice(error.message || 'The product could not be deleted.');
    }
  }

  const pendingCount = orders.filter((order) => ['Pending', 'Processing'].includes(order.status)).length;
  const revenue = orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock < 5);

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">Loading admin dashboard…</main>;
  }

  if (!authenticated) {
    return <AdminLogin initialError={authError} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-black text-white transition-transform lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Dreven home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-bold text-black">D</span>
            <span className="text-lg font-semibold tracking-wide">dreven<span className="ml-2 text-xs font-normal text-white/45">ADMIN</span></span>
          </Link>
          <button className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><Icon name="close" /></button>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-white/40">Workspace</p>
          <nav aria-label="Admin navigation" className="space-y-1">
            {menu.map((item) => (
              <button key={item.id} onClick={() => changeSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${section === item.id ? 'bg-white font-semibold text-black shadow-sm' : 'text-white/65 hover:bg-white/[.08] hover:text-white'}`}>
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
                {item.id === 'Orders' && pendingCount > 0 && <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${section === item.id ? 'bg-black text-white' : 'bg-white/10 text-white/80'}`}>{pendingCount}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">D</div>
            <p className="text-sm font-medium">Store manager</p>
            <p className="mt-1 text-xs text-white/45">Dreven online store</p>
            <Link href="/" className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/75 hover:text-white">
              Visit storefront <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-black/10 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
            <div>
              <p className="text-xs text-slate-400">Dreven / {section}</p>
              <h1 className="truncate text-lg font-semibold text-slate-800">{section}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex">View store</Link>
            <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Sign out</button>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700" title="Notifications"><Icon name="bell" className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-black" /></div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">SM</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening with your store today.</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{section === 'Overview' ? 'Welcome back, Store manager' : `Manage ${section.toLowerCase()}`}</h2>
            </div>
            {section === 'Products' && <button onClick={() => openProductForm()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"><Icon name="plus" className="h-4 w-4" /> Add product</button>}
          </div>

          {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm"><span>{notice}</span><button onClick={() => setNotice('')} className="shrink-0 text-neutral-500 hover:text-black" aria-label="Dismiss notice"><Icon name="close" className="h-4 w-4" /></button></div>}
          <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs leading-5 text-neutral-600 shadow-sm"><strong className="text-black">Live store:</strong> Products, customer orders, and order status are saved in MongoDB. New cash-on-delivery orders appear here automatically.</div>

          {section === 'Overview' && (
            <>
              <section aria-label="Store summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total orders" value={orders.length} helper={`${pendingCount} need attention`} icon="orders" />
                <StatCard label="Revenue from orders" value={formatPrice(revenue)} helper="Excludes cancelled orders" icon="arrow" featured />
                <StatCard label="Products" value={products.length} helper={`${lowStock.length} running low on stock`} icon="box" />
                <StatCard label="To fulfil" value={pendingCount} helper="Pending or processing" icon="truck" />
              </section>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.035)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div><h3 className="font-semibold text-slate-800">Recent orders</h3><p className="mt-1 text-xs text-slate-400">Latest activity in your store</p></div>
                    <button onClick={() => changeSection('Orders')} className="text-xs font-semibold text-black underline decoration-black/25 underline-offset-4 hover:decoration-black">View all</button>
                  </div>
                  <OrdersTable
                    orders={orders.slice(0, 4)}
                    onStatusChange={updateOrderStatus}
                    onViewDetails={setSelectedOrder}
                    compact
                  />
                </section>
                <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.035)] sm:p-6">
                  <div className="mb-5 flex items-start justify-between"><div><h3 className="font-semibold text-slate-800">Inventory watch</h3><p className="mt-1 text-xs text-slate-400">Products that may need restocking</p></div><span className="rounded-full border border-black/15 px-2.5 py-1 text-xs font-medium text-black">{lowStock.length} low</span></div>
                  {lowStock.length > 0 ? <div className="space-y-4">{lowStock.map((product) => <div key={product.id} className="flex items-center gap-3"><ProductThumb product={product} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{product.name}</p><p className="mt-1 text-xs text-slate-400">{product.category}</p></div><span className="whitespace-nowrap text-xs font-semibold text-black">{product.stock} left</span></div>)}</div> : <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm text-neutral-700">All products are well stocked.</div>}
                  <button onClick={() => changeSection('Products')} className="mt-5 w-full rounded-xl border border-black/15 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-black hover:text-white">Manage inventory</button>
                </section>
              </div>

              <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.035)] sm:p-6">
                <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-slate-800">Order fulfilment</h3><p className="mt-1 text-xs text-slate-400">A quick view of where orders stand</p></div><button onClick={() => changeSection('Delivery')} className="text-xs font-semibold text-black underline decoration-black/25 underline-offset-4 hover:decoration-black">Open delivery</button></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['Pending', 'Processing', 'Shipped', 'Delivered'].map((status) => <div key={status} className="rounded-xl border border-black/10 bg-white p-4 transition hover:border-black/30 hover:shadow-sm"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[status]}`}>{status}</span><span className="text-lg font-semibold text-slate-800">{orders.filter((order) => order.status === status).length}</span></div><p className="mt-3 text-xs text-slate-400">orders</p></div>)}</div>
              </section>
            </>
          )}

          {section === 'Orders' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><h3 className="font-semibold text-slate-800">All orders <span className="ml-1 text-sm font-normal text-slate-400">({visibleOrders.length})</span></h3><p className="mt-1 text-xs text-slate-400">Search orders and update fulfilment status</p></div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <SearchBox value={query} onChange={setQuery} placeholder="Search order or customer" />
                <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-black"><option>All orders</option>{Object.keys(statusStyles).map((status) => <option key={status}>{status}</option>)}</select>
                <button
                  type="button"
                  onClick={() => downloadInvoices(orders, `dreven-invoices-${new Date().toISOString().slice(0, 10)}.pdf`)}
                  disabled={!orders.length || downloadingInvoices}
                  className="whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingInvoices ? 'Preparing invoices…' : `Download all invoices (${orders.length})`}
                </button>
              </div>
            </div>
            <OrdersTable
              orders={visibleOrders}
              onStatusChange={updateOrderStatus}
              onViewDetails={setSelectedOrder}
            />
          </section>}

          {section === 'Products' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h3 className="font-semibold text-slate-800">Product catalogue <span className="ml-1 text-sm font-normal text-slate-400">({visibleProducts.length})</span></h3><p className="mt-1 text-xs text-slate-400">Add products, adjust available quantity, and manage your listings</p></div><SearchBox value={query} onChange={setQuery} placeholder="Search products" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-6 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Starting price</th><th className="px-4 py-3 font-medium">Available quantity</th><th className="px-6 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleProducts.map((product) => <tr key={product.id} className="hover:bg-neutral-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><ProductThumb product={product} /><div><p className="font-medium text-slate-700">{product.name}</p><p className="mt-1 text-xs text-slate-400">{product.id}</p></div></div></td><td className="px-4 py-4 text-slate-500">{product.category}</td><td className="px-4 py-4 font-medium text-slate-700">{formatPrice(product.category === 'Attar & Fragrance' ? getAttarPrices(product)[3] : product.price)}</td><td className="px-4 py-4"><StockEditor product={product} onSave={updateProductStock} /></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openProductForm(product)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-black" aria-label={`Edit ${product.name}`}><Icon name="edit" className="h-4 w-4" /></button><button onClick={() => deleteProduct(product)} className="rounded-lg p-2 text-slate-400 hover:bg-neutral-100 hover:text-black" aria-label={`Delete ${product.name}`}><Icon name="trash" className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{visibleProducts.length === 0 && <EmptyState message={products.length === 0 ? 'No products in the catalogue yet. Add a product to publish it.' : 'No products match your search.'} />}</div>
          </section>}

          {section === 'Customers' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h3 className="font-semibold text-slate-800">Customers <span className="ml-1 text-sm font-normal text-slate-400">({customers.length})</span></h3><p className="mt-1 text-xs text-slate-400">Customer details from your orders</p></div><SearchBox value={query} onChange={setQuery} placeholder="Search customers" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-6 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium">Total spent</th><th className="px-6 py-3 font-medium">Most recent order</th></tr></thead><tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.email || customer.phone || customer.customer}><td className="px-6 py-4"><p className="font-medium text-slate-700">{customer.customer}</p><p className="mt-1 text-xs text-slate-400">{customer.email || customer.phone}</p></td><td className="px-4 py-4 text-slate-600">{customer.ordersCount}</td><td className="px-4 py-4 font-medium text-slate-700">{formatPrice(customer.spent)}</td><td className="px-6 py-4 text-slate-500">{customer.date}</td></tr>)}</tbody></table>{customers.length === 0 && <EmptyState message="No customers match your search." />}</div>
          </section>}

          {section === 'Delivery' && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h3 className="font-semibold text-slate-800">Delivery & fulfilment</h3>
                <p className="mt-1 text-xs text-slate-400">Check order progress and update delivery status</p>
              </div>
              <div className="divide-y divide-slate-100">
                {orders.filter((order) => order.status !== 'Cancelled').map((order) => (
                  <div key={order.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-neutral-50 text-black">
                      <Icon name="truck" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-700">
                        {order.id} <span className="font-normal text-slate-400">· {order.customer}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[order.address, order.upazila, order.city].filter(Boolean).join(', ')} · {order.phone}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.deliveryZone === 'dhaka_district'
                          ? 'Dhaka district'
                          : order.deliveryZone === 'dhaka_division'
                            ? 'Outside Dhaka district · Dhaka division'
                            : order.deliveryZone === 'outside_dhaka'
                              ? 'Other district · previous rate'
                              : 'Outside Dhaka division'} · {formatPrice(order.deliveryFee)} delivery · {order.date}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                      <select
                        aria-label={`Update ${order.id} status`}
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                        className="max-w-[145px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-black"
                      >
                        {Object.keys(statusStyles).map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="mt-6 text-center text-[11px] text-slate-400">Dreven Admin · Live products and customer orders</p>
        </main>
      </div>

      {modalOpen && <ProductModal product={editingProduct} onClose={() => setModalOpen(false)} onSave={saveProduct} />}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onSaveItems={(items) => saveOrderItems(selectedOrder.id, items)}
          onDownloadInvoice={() => downloadInvoices(
            [selectedOrder],
            `invoice-${selectedOrder.id}.pdf`,
          )}
          downloadingInvoice={downloadingInvoices}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, helper, icon, featured = false }) {
  return <article className={`group relative isolate min-h-[178px] overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${featured ? 'border-black bg-black text-white shadow-lg shadow-black/10' : 'border-black/10 bg-white text-black shadow-[0_8px_32px_rgba(0,0,0,0.035)] hover:border-black/25'}`}>
    <div aria-hidden="true" className={`pointer-events-none absolute -right-8 -top-10 -z-10 h-36 w-36 rounded-full border ${featured ? 'border-white/10' : 'border-black/[.04]'}`} />
    <div aria-hidden="true" className={`pointer-events-none absolute -right-1 -top-3 -z-10 h-24 w-24 rounded-full border ${featured ? 'border-white/[.07]' : 'border-black/[.035]'}`} />
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-[.18em] ${featured ? 'text-white/55' : 'text-neutral-400'}`}>{label}</p>
        <p className={`mt-6 text-3xl font-semibold tracking-[-.04em] ${featured ? 'text-white' : 'text-neutral-950'}`}>{value}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${featured ? 'border-white/20 bg-white text-black' : 'border-black/10 bg-neutral-50 text-black'}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
    </div>
    <div className={`mt-4 flex items-center gap-2 border-t pt-3 ${featured ? 'border-white/15 text-white/55' : 'border-black/[.08] text-neutral-400'}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${featured ? 'bg-white' : 'bg-black'}`} />
      <p className="text-xs">{helper}</p>
    </div>
  </article>;
}

function SearchBox({ value, onChange, placeholder }) {
  return <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-400 focus-within:border-black sm:w-[230px]"><Icon name="search" className="h-4 w-4 shrink-0" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></label>;
}

function ProductThumb({ product }) {
  return <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100"><Image src={product.image || '/dreven_dv.png'} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" /></div>;
}

function StockEditor({ product, onSave }) {
  const [quantity, setQuantity] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const hasChanged = quantity !== String(product.stock);

  async function submit(event) {
    event.preventDefault();
    const stock = Number(quantity);
    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError('Enter a whole number of 0 or more.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(product.id, stock);
      setQuantity(String(stock));
    } catch (saveError) {
      console.error(`Could not update stock for ${product.id}.`, saveError);
      setError(saveError.message || 'Stock could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="min-w-44">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          required
          aria-label={`Available quantity for ${product.name}`}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-black"
        />
        {hasChanged && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
      <p className={`mt-1.5 text-[11px] ${product.stock === 0 ? 'font-medium text-amber-700' : 'text-slate-400'}`}>
        {product.stock === 0 ? 'Out of stock · shown on store' : 'Available to order'}
      </p>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </form>
  );
}

function OrdersTable({ orders, onStatusChange, onViewDetails, compact = false }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${compact ? 'min-w-[760px]' : 'min-w-[900px]'}`}>
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3 font-medium sm:px-6">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const itemCount = order.itemCount
              ?? (Array.isArray(order.items)
                ? order.items.reduce((sum, item) => sum + item.quantity, 0)
                : Number(order.items) || 0);
            return (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 sm:px-6">
                  <p className="font-semibold text-slate-700">{order.id}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-700">{order.customer}</p>
                  <p className="mt-1 text-xs text-slate-400">{order.email || order.phone}</p>
                  <p className="mt-1 max-w-64 truncate text-xs text-slate-400">
                    {[order.address, order.upazila, order.city].filter(Boolean).join(', ')}
                  </p>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">{order.date}</td>
                <td className="px-4 py-4 font-medium text-slate-700">
                  {formatPrice(order.total)}
                  <span className="mt-1 block text-xs font-normal text-slate-400">
                    {formatPrice(order.deliveryFee || 0)} delivery
                  </span>
                </td>
                <td className="px-4 py-4">
                  <select
                    aria-label={`Update ${order.id} status`}
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value)}
                    className={`max-w-[140px] rounded-full border-0 px-2.5 py-1.5 text-xs font-medium outline-none ${statusStyles[order.status] || statusStyles.Pending}`}
                  >
                    {Object.keys(statusStyles).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewDetails(order)}
                    className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:bg-black hover:text-white"
                    aria-label={`View details for order ${order.id}`}
                  >
                    View details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {orders.length === 0 && <EmptyState message="No customer orders yet." />}
    </div>
  );
}

function OrderDetailsModal({ order, products, onClose, onSaveItems, onDownloadInvoice, downloadingInvoice }) {
  const [invoiceError, setInvoiceError] = useState('');
  const [itemError, setItemError] = useState('');
  const [draftItems, setDraftItems] = useState(order.items || []);
  const [newProductId, setNewProductId] = useState('');
  const [newSizeMl, setNewSizeMl] = useState(3);
  const [savingItems, setSavingItems] = useState(false);
  const address = [order.address, order.upazila, order.city].filter(Boolean).join(', ');
  const selectedProductId = newProductId || products[0]?.id || '';
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedProductIsAttar = isAttarProduct(selectedProduct);
  const itemSignature = (items) => JSON.stringify(items.map((item) => ({
    id: item.id,
    sizeMl: item.sizeMl ?? null,
    quantity: item.quantity,
  })));
  const itemsChanged = itemSignature(draftItems) !== itemSignature(order.items || []);

  function changeItemQuantity(index, quantity) {
    setDraftItems((items) => items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantity } : item,
    ));
  }

  function addProductToOrder() {
    if (!selectedProduct) return;
    const sizeMl = selectedProductIsAttar ? Number(newSizeMl) : undefined;
    const key = `${selectedProduct.id}:${sizeMl ?? 'standard'}`;
    const existingIndex = draftItems.findIndex((item) =>
      `${item.id}:${item.sizeMl ?? 'standard'}` === key,
    );
    if (existingIndex >= 0) {
      if (draftItems[existingIndex].quantity >= 20) {
        setItemError('The maximum quantity per product size is 20.');
        return;
      }
      changeItemQuantity(existingIndex, draftItems[existingIndex].quantity + 1);
      setItemError('');
      return;
    }
    if (draftItems.length >= 30) {
      setItemError('This order already has the maximum of 30 different items.');
      return;
    }

    const price = selectedProductIsAttar
      ? getAttarPrices(selectedProduct)[sizeMl]
      : Number(selectedProduct.price);
    setDraftItems((items) => [
      ...items,
      {
        id: selectedProduct.id,
        name: selectedProduct.name,
        image: selectedProduct.image || '/dreven_dv.png',
        price,
        quantity: 1,
        ...(selectedProductIsAttar ? { sizeMl } : {}),
      },
    ]);
    setItemError('');
  }

  async function saveItems() {
    setSavingItems(true);
    setItemError('');
    try {
      const updatedOrder = await onSaveItems(draftItems.map(({ id, quantity, sizeMl }) => ({
        id,
        quantity,
        ...(sizeMl ? { sizeMl } : {}),
      })));
      setDraftItems(updatedOrder.items || []);
    } catch (error) {
      setItemError(error.message || 'Order items could not be saved.');
    } finally {
      setSavingItems(false);
    }
  }

  async function downloadInvoice() {
    setInvoiceError('');
    const downloaded = await onDownloadInvoice();
    if (!downloaded) setInvoiceError('The invoice could not be generated. Please try again.');
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Order details</p>
            <h2 id="order-details-title" className="mt-2 text-xl font-semibold text-slate-900">{order.id}</h2>
            <p className="mt-1 text-xs text-slate-500">{order.date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Order status</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[order.status] || statusStyles.Pending}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600">{order.paymentMethod || 'Cash on delivery'}</p>
          </div>

          <section aria-labelledby="order-customer-heading">
            <h3 id="order-customer-heading" className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
              Customer
            </h3>
            <dl className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Name</dt>
                <dd className="mt-1 font-medium text-slate-800">{order.customer || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Phone number</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {order.phone
                    ? <a href={`tel:${order.phone}`} className="underline decoration-slate-300 underline-offset-2 hover:text-black">{order.phone}</a>
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Email</dt>
                <dd className="mt-1 break-all font-medium text-slate-800">
                  {order.email
                    ? <a href={`mailto:${order.email}`} className="underline decoration-slate-300 underline-offset-2 hover:text-black">{order.email}</a>
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Delivery address</dt>
                <dd className="mt-1 font-medium text-slate-800">{address || '—'}</dd>
              </div>
              {order.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Order note</dt>
                  <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-800">{order.note}</dd>
                </div>
              )}
            </dl>
          </section>

          <section aria-labelledby="order-items-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="order-items-heading" className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
                  Items
                </h3>
                {itemsChanged && draftItems.length > 0 && (
                  <button
                    type="button"
                    onClick={saveItems}
                    disabled={savingItems}
                    className="rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50"
                  >
                    {savingItems ? 'Saving order…' : 'Save order changes'}
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row">
                <label className="sr-only" htmlFor="add-order-product">Choose a product to add</label>
                <select
                  id="add-order-product"
                  value={selectedProductId}
                  onChange={(event) => setNewProductId(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-black"
                >
                  <option value="" disabled>Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.stock} in stock
                    </option>
                  ))}
                </select>
                {selectedProductIsAttar && (
                  <>
                    <label className="sr-only" htmlFor="add-order-size">Choose bottle size</label>
                    <select
                      id="add-order-size"
                      value={newSizeMl}
                      onChange={(event) => setNewSizeMl(Number(event.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-black"
                    >
                      {[3, 5, 10].map((size) => <option key={size} value={size}>{size}ml</option>)}
                    </select>
                  </>
                )}
                <button
                  type="button"
                  onClick={addProductToOrder}
                  disabled={!selectedProduct}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add item
                </button>
              </div>
              {itemError && <p role="alert" className="mt-2 text-xs text-red-700">{itemError}</p>}
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {draftItems.map((item, index) => (
                    <div key={`${item.id}:${item.sizeMl || 'standard'}`} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">
                          {item.name}{item.sizeMl ? ` · ${item.sizeMl}ml` : ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <label className="sr-only" htmlFor={`order-item-quantity-${index}`}>
                          Quantity of {item.name}
                        </label>
                        <input
                          id={`order-item-quantity-${index}`}
                          type="number"
                          min="1"
                          max="20"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => {
                            const quantity = Number(event.target.value);
                            if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 20) {
                              changeItemQuantity(index, quantity);
                            }
                          }}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm outline-none focus:border-black"
                        />
                        <p className="w-20 text-right font-medium text-slate-800">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`Remove ${item.name} from order`}
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {draftItems.length === 0 && (
                    <p className="px-4 py-5 text-center text-sm text-slate-500">Add at least one item before saving.</p>
                  )}
                </div>
              <dl className="space-y-2 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm">
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(draftItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0))}</dd>
                </div>
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>Delivery</dt>
                  <dd>{formatPrice(order.deliveryFee || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900">
                  <dt>Total</dt>
                  <dd>{formatPrice(draftItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) + Number(order.deliveryFee || 0))}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-between sm:px-7">
          <div>
            <button
              type="button"
              onClick={downloadInvoice}
              disabled={downloadingInvoice}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-black hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
            >
              {downloadingInvoice ? 'Preparing invoice…' : 'Download invoice'}
            </button>
            {invoiceError && <p role="alert" className="mt-2 text-xs text-red-700">{invoiceError}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="px-6 py-12 text-center text-sm text-slate-400">{message}</div>;
}

function AdminLogin({ initialError, onLogin }) {
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData(event.currentTarget);
      await onLogin(String(formData.get('password') || ''));
    } catch (loginError) {
      setError(loginError.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-neutral-400">Dreven admin</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter the admin password to manage the live product catalogue.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Admin password
            <input required name="password" type="password" autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-black" />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function ProductModal({ product, onClose, onSave }) {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [category, setCategory] = useState(product?.category || 'Attar & Fragrance');
  const attarPrices = getAttarPrices(product);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await onSave(event);
      onClose();
    } catch (error) {
      setFormError(error.message || 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-7">
      <div className="mb-6 flex items-start justify-between"><div><h2 id="product-form-title" className="text-xl font-semibold text-slate-900">{product ? 'Edit product' : 'Add a product'}</h2><p className="mt-1 text-sm text-slate-500">Save this listing to publish it in the live catalogue.</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><Icon name="close" /></button></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Product name<input required name="name" defaultValue={product?.name || ''} placeholder="e.g. Premium Oud Attar" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-black" /></label>
        <label className="block text-sm font-medium text-slate-700">Category<select name="category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-black"><option>Attar & Fragrance</option><option>Jubbas & Panjabis</option><option>Keffiyehs & Caps</option><option>Islamic T-Shirts</option><option>Other</option></select></label>
        {category === 'Attar & Fragrance' ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Attar prices by bottle size (৳)</legend>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((size) => (
                <label key={size} className="block text-xs font-medium text-slate-600">
                  {size}ml
                  <input
                    required={size === 10}
                    name={`price${size}ml`}
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={product ? attarPrices[size] : ''}
                    placeholder={size === 10 ? '1250' : 'Auto'}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-2.5 py-3 text-sm font-normal outline-none focus:border-black"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs leading-5 text-slate-400">Suggested prices: 3ml is 40% and 5ml is 65% of the 10ml price, rounded to ৳10. You can change each size price.</p>
          </fieldset>
        ) : (
          <label className="block text-sm font-medium text-slate-700">Price (৳)<input required name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ''} placeholder="1250" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-black" /></label>
        )}
        <label className="block text-sm font-medium text-slate-700">Stock quantity<input required name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? ''} placeholder="10" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-black" /></label>
        <label className="block text-sm font-medium text-slate-700">Product image URL<input name="image" defaultValue={product?.image || ''} placeholder="Paste an HTTPS image URL (optional)" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-black" /></label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-black hover:bg-neutral-50"><Icon name="upload" className="h-4 w-4" />{selectedFile || 'Choose image from device'}<input type="file" name="imageFile" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name || '')} className="sr-only" /></label>
        <p className="text-xs leading-5 text-slate-400">Device images (up to 4 MB) are stored in MongoDB GridFS. Products with zero stock remain visible on the storefront, marked out of stock.</p>
        {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div>
      </form>
    </section>
  </div>;
}
