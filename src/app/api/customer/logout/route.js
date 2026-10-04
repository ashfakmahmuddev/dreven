import { clearCustomerSession } from '../../../../lib/customer-auth';

export const runtime = 'nodejs';

export async function POST() {
  await clearCustomerSession();
  return Response.json({ loggedOut: true });
}
