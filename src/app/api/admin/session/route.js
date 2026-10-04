import { isAdminAuthenticated } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ authenticated: await isAdminAuthenticated() });
  } catch (error) {
    console.error('Admin session check failed.', error);
    return Response.json(
      { error: 'Admin authentication is not configured correctly.' },
      { status: 503 },
    );
  }
}
