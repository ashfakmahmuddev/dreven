import CheckoutPage from '../../components/CheckoutPage';

export const metadata = {
  title: 'Checkout',
  description: 'Review your order and enter delivery details.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CheckoutPage />;
}
