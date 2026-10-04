This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Live product catalogue

Admin product listings are stored in MongoDB, with device-uploaded product images stored in MongoDB GridFS. The home page shows live categories and featured products; the `/shop` page has dynamic category, search, availability, and sorting filters. The navigation search opens live product suggestions and tolerates small spelling mistakes; submitting a query opens the matching filtered shop results. Selecting a product opens its details page, while **Quick add** adds it directly to the cart. Product details show the matching named image from `public/attor` with clickable thumbnails and a zoom view. Zero-stock products are marked **Out of stock** and cannot be added to the cart. Customer and order details are stored in MongoDB when a customer places an order.

1. Create a MongoDB database user with read/write access to the database and allow the deployed application to connect to the cluster.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Keep these server-side values private; do not prefix them with `NEXT_PUBLIC_`.
3. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
4. Add the same environment variables to the production hosting provider, then deploy the application.
5. Visit `/admin`, sign in with `ADMIN_PASSWORD`, and add a product. New products and device-uploaded images are saved to MongoDB and shared with storefront visitors. Images must be JPG, PNG, GIF, WebP, or AVIF and no larger than 4 MB.

The first catalogue request seeds the four current featured products into an otherwise uninitialized product catalogue. Product records and uploaded images are shared across visitors; admin sessions expire after eight hours. Attar product pages offer 3ml, 5ml, and 10ml bottle sizes. New attar prices default to 40% of the 10ml price for 3ml and 65% for 5ml, rounded to ৳10; admins can edit each size price in the product form. The 3ml size is selected by default on product pages and quick-add. Cash-on-delivery orders are saved in MongoDB after the server checks current prices and stock. Checkout requires one of Bangladesh's 64 districts and an upazila belonging to that district. Delivery costs ৳80 within Dhaka district, ৳100 in other districts of Dhaka division, and ৳120 in all other divisions. The server derives the fee and validates the upazila against the selected district. The upazila list is based on [nuhil/bangladesh-geocode](https://github.com/nuhil/bangladesh-geocode), used under its MIT license (see `src/lib/bangladesh-geocode-LICENSE.txt`). Customers enter their village, street/road, house number, and other delivery directions separately. After a successful order, checkout saves delivery details in the current browser and pre-fills them for the next order; signed-in customers can also restore details from their latest account order. Customers can edit all fields before submitting. Each order reduces inventory by the exact quantity purchased, and an order cannot exceed available stock. In `/admin` → **Products**, edit the available-quantity field and save it to restock or reduce inventory; setting stock to zero keeps the product visible on the storefront with an **Out of stock** label and disables adding it to the cart. Stock reserved by an order is restored if an admin cancels it. In `/admin` → **Orders**, open **View details** to change item quantities, add products/sizes, or remove lines, then save the order; totals and inventory are updated together. Editing a cancelled order does not reserve stock until it is reopened. Admins can also update live order status and download a standard invoice PDF from an order's details, or download all orders as one combined PDF.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
