"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// মেনু লিংক ডাটা (প্রয়োজন অনুযায়ী পরিবর্তন করতে পারেন)
const mainNavLinks = [
  { path: "/", label: "Home" },
  { path: "/shop", label: "Shop" },
  { path: "/blog", label: "Blog" },
  { path: "/about", label: "About Us" },
  { path: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [isPassed, setIsPassed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState(null);

  // স্ক্রোল ইভেন্ট ট্র্যাকিং
  useEffect(() => {
    const handleScroll = () => {
      setIsPassed(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const updateCustomer = (event) => {
      if (event instanceof CustomEvent) {
        setCustomer(event.detail?.user || null);
        return;
      }

      fetch('/api/customer/session', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not check customer session.');
        if (active) setCustomer(result.user);
      })
      .catch((error) => {
        console.error('Could not check customer session in the header.', error);
      });
    };

    updateCustomer();
    window.addEventListener('dreven-customer-session-updated', updateCustomer);
    return () => {
      active = false;
      window.removeEventListener('dreven-customer-session-updated', updateCustomer);
    };
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const savedCart = window.localStorage.getItem("dreven-cart");
        const cart = savedCart ? JSON.parse(savedCart) : [];
        if (!Array.isArray(cart)) {
          throw new Error("Saved cart data is not valid.");
        }
        setCartCount(cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0));
      } catch (error) {
        console.error("Could not read the saved cart.", error);
      }
    };

    updateCartCount();
    window.addEventListener("dreven-cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("dreven-cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className={`
          sticky w-full z-50
          transition-all duration-500 ease-in-out
          ${
            isPassed
              ? "top-0 bg-[#f5f6f1] backdrop-blur-md shadow-sm"
              : "-top-25 bg-[#f5f6f1] shadow-none"
          }
        `}
      >
        {/* কন্টেইনারের পরিবর্তে Tailwind Utilities */}
        <div className="mx-auto w-full max-w-[1620px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 md:py-3">
            {/* Logo */}
            <Link href="/">
              <Image
                src="/drevenlogo.png"
                alt="Dreven logo"
                width={120} // ম্যাক্সিমাম উইডথ
                height={40} // ম্যাক্সিমাম হাইট
                priority
                className="w-auto md:h-14 object-contain h-12" // h-10 বা আপনার পছন্দমতো Height (যেমন: h-8, h-12)
              />
            </Link>

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-x-6 text-[#000000] text-sm font-semibold uppercase">
              {mainNavLinks.map((item) => (
                <li
                  key={item.path}
                  className="group"
                >
                  <Link
                    href={item.path}
                    className={`relative inline-block after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-[#000000] after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 ${
                      pathname === item.path
                        ? "text-[#000000] after:scale-x-100"
                        : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Icons Section (SVG ব্যবহার করা হয়েছে) */}
            <div className="flex items-center gap-x-3 md:gap-x-6 text-black">
              {/* Search Icon */}
              <button
                type="button"
                aria-label="Search"
                className="cursor-pointer hover:text-[#000000] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Settings Icon */}
              <button
                type="button"
                aria-label="Settings"
                className="hidden cursor-pointer md:block"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              <div className="hidden items-center gap-2 lg:flex">
                {customer ? (
                  <Link
                    href="/account"
                    className="border border-neutral-300 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition-colors hover:border-black"
                  >
                    My account
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="border border-neutral-300 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition-colors hover:border-black"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="border border-black bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white transition-colors hover:bg-[#05AE7A] hover:border-[#05AE7A]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>

              {/* Cart Icon */}
              <Link
                href="/cart"
                aria-label={`Cart, ${cartCount} items`}
                className="relative hidden cursor-pointer md:block"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div className="h-5 w-4 bg-[#05AE7A] absolute -top-2 -right-1 rounded-full flex justify-center items-center text-xs font-semibold text-white">
                  {cartCount}
                </div>
              </Link>

              {/* Mobile Hamburger / Cross Button */}
              <button
                type="button"
                className="ml-2 text-2xl focus:outline-none md:hidden"
                onClick={() => setIsOpen((open) => !open)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
              >
                {isOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div
        id="mobile-navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`
          fixed inset-y-0 left-0 z-50 w-full bg-[#f5f6f1] shadow-2xl
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <Image
                src="/drevenlogo.png"
                alt="Dreven logo"
                width={120}
                height={40}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="focus:outline-none p-1"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex-1 p-6">
            <ul className="space-y-6 text-[#303030] text-lg font-medium">
              {mainNavLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`
                      relative mx-auto block w-fit text-center text-[#000000]
                      after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full
                      after:origin-right after:scale-x-0 after:bg-[#000000]
                      after:transition-transform after:duration-300 after:ease-out
                      hover:after:origin-left hover:after:scale-x-100
                      ${pathname === item.path ? "font-bold after:scale-x-100" : ""}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid grid-cols-2 gap-3 px-6 pb-5">
            {customer ? (
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="col-span-2 flex min-h-12 items-center justify-center border border-gray-300 px-4 py-3 text-xs font-semibold uppercase tracking-[.14em] text-[#303030] transition-colors hover:border-black"
              >
                My account
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-12 items-center justify-center border border-gray-300 px-4 py-3 text-xs font-semibold uppercase tracking-[.14em] text-[#303030] transition-colors hover:border-black"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-12 items-center justify-center border border-black bg-black px-4 py-3 text-xs font-semibold uppercase tracking-[.14em] text-white transition-colors hover:border-[#05AE7A] hover:bg-[#05AE7A]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 px-6 py-5">
            <button
              type="button"
              aria-label="Settings"
              className="flex min-h-14 items-center justify-center gap-2 border border-gray-200 px-4 py-3 text-[#303030] transition-colors hover:border-[#05AE7A] hover:text-[#05AE7A]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </button>
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => setIsOpen(false)}
              className="flex min-h-14 items-center justify-center gap-2 border border-gray-200 px-4 py-3 text-[#303030] transition-colors hover:border-[#05AE7A] hover:text-[#05AE7A]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Cart</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#05AE7A] px-1 text-xs font-semibold text-white">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
