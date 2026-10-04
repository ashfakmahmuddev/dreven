import CartPage from '../../components/CartPage';

export const metadata = {
  title: 'Your Cart',
  description: 'Review the items in your Dreven shopping cart.',
  alternates: {
    canonical: '/cart',
  },
};

export default function Page() {
  return <CartPage />;
}
