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

Admin product listings are stored in MongoDB, with device-uploaded product images stored in MongoDB GridFS. Products with stock above zero appear in **Popular Collections** on the home page. Customer and order details are stored in MongoDB when a customer places an order.

1. Create a MongoDB database user with read/write access to the database and allow the deployed application to connect to the cluster.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Keep these server-side values private; do not prefix them with `NEXT_PUBLIC_`.
3. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
4. Add the same environment variables to the production hosting provider, then deploy the application.
5. Visit `/admin`, sign in with `ADMIN_PASSWORD`, and add a product. New products and device-uploaded images are saved to MongoDB and shared with storefront visitors. Images must be JPG, PNG, GIF, WebP, or AVIF and no larger than 4 MB.

The first catalogue request seeds the four current featured products into an otherwise uninitialized product catalogue. Product records and uploaded images are shared across visitors; admin sessions expire after eight hours. Cash-on-delivery orders are saved in MongoDB after the server checks current prices and stock. Delivery is ৳80 inside Dhaka and ৳120 outside Dhaka. Stock is reserved when an order is placed and restored if an admin cancels it. Admins can view and update live order status from the dashboard.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
