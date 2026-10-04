import { Readable } from 'node:stream';
import { getProductImageBucket, ObjectId } from '../../../../lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { imageId } = await params;
  if (!/^[a-f\d]{24}$/i.test(imageId)) {
    return Response.json({ error: 'Image not found.' }, { status: 404 });
  }

  try {
    const bucket = await getProductImageBucket();
    const [file] = await bucket.find({ _id: new ObjectId(imageId) }).limit(1).toArray();
    if (!file) return Response.json({ error: 'Image not found.' }, { status: 404 });

    const stream = bucket.openDownloadStream(file._id);
    return new Response(Readable.toWeb(stream), {
      headers: {
        'Content-Type': file.metadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Could not load product image.', error);
    return Response.json({ error: 'Image is temporarily unavailable.' }, { status: 503 });
  }
}
