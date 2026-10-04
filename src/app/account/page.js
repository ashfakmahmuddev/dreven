import CustomerAccount from '../../components/CustomerAccount';

export const metadata = {
  title: 'My Account',
  description: 'View your Dreven customer account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <CustomerAccount />;
}
