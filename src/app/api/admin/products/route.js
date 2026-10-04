import { randomUUID } from 'node:crypto';
import {
  ensureDefaultProducts,
  getProductCollection,
  getProductImageBucket,
  getProductImageId,
  ObjectId,
} from '../../../../lib/mongodb';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const categories = new Set([
  'Attar & Fragrance',
  'Jubbas & Panjabis',
  'Keffiyehs & Caps',
  'Islamic T-Shirts',
  'Other',
]);
const maxImageSize = 4 * 1024 * 1024;
const allowedImageTypes = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function errorResponse(error, status = 500) {
  return Response.json({ error }, { status });
}

async function adminAccessError() {
  try {
    return await isAdminAuthenticated() ? null : errorResponse('Admin sign-in required.', 401);
  } catch (error) {
    console.error('Could not verify admin access.', error);
    return errorResponse('Admin authentication is not configured correctly.', 503);
  }
}

function isAllowedImageUrl(value) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

async function saveProduct(request, isUpdate) {
  const authError = await adminAccessError();
  if (authError) return authError;

  let uploadedImageId;
  try {
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const category = String(formData.get('category') || '');
    const price = Number(formData.get('price'));
    const stock = Number(formData.get('stock'));
    const requestedId = String(formData.get('id') || '');
    const fileValue = formData.get('imageFile');

    if (!name || name.length > 120) {
      return errorResponse('Enter a product name up to 120 characters.', 400);
    }
    if (!categories.has(category)) return errorResponse('Choose a valid product category.', 400);
    if (!Number.isFinite(price) || price < 0) return errorResponse('Enter a valid price.', 400);
    if (!Number.isInteger(stock) || stock < 0) return errorResponse('Enter a valid stock quantity.', 400);
    if (isUpdate && !requestedId) return errorResponse('Product ID is required.', 400);
    if (requestedId && !/^[a-zA-Z0-9_-]{1,100}$/.test(requestedId)) {
      return errorResponse('Product ID is not valid.', 400);
    }

    const collection = await getProductCollection();
    const currentProduct = isUpdate ? await collection.findOne({ id: requestedId }) : null;
    if (isUpdate && !currentProduct) return errorResponse('Product not found.', 404);
    if (!isUpdate && requestedId && await collection.findOne({ id: requestedId })) {
      return errorResponse('A product with this ID already exists.', 409);
    }

    let image = String(formData.get('image') || '').trim();
    if (fileValue && typeof fileValue !== 'string' && fileValue.size > 0) {
      if (fileValue.size > maxImageSize) {
        return errorResponse('Product images must be 5 MB or smaller.', 400);
      }
      if (!allowedImageTypes.has(fileValue.type)) {
        return errorResponse('Use a JPG, PNG, GIF, WebP, or AVIF image.', 400);
      }

      const imageId = new ObjectId();
      const bucket = await getProductImageBucket();
      const stream = bucket.openUploadStreamWithId(imageId, fileValue.name, {
        metadata: { contentType: fileValue.type },
      });
      uploadedImageId = imageId;
      const imageBuffer = Buffer.from(await fileValue.arrayBuffer());
      await new Promise((resolve, reject) => {
        stream.once('error', reject);
        stream.once('finish', resolve);
        stream.end(imageBuffer);
      });
      image = `/api/product-images/${imageId.toHexString()}`;
    } else if (!image && currentProduct) {
      image = currentProduct.image;
    } else if (!image) {
      image = '/dreven_dv.png';
    }

    if (!isAllowedImageUrl(image)) {
      if (uploadedImageId) await (await getProductImageBucket()).delete(uploadedImageId);
      return errorResponse('Use a site image path or a secure HTTPS image URL.', 400);
    }

    const now = new Date();
    const product = {
      id: isUpdate ? requestedId : requestedId || `PR-${randomUUID()}`,
      name,
      category,
      price,
      stock,
      image,
      updatedAt: now,
    };

    if (isUpdate) {
      product.createdAt = currentProduct.createdAt || now;
      await collection.updateOne({ id: requestedId }, { $set: product });
    } else {
      product.createdAt = now;
      await collection.insertOne(product);
    }

    let warning;
    if (currentProduct && currentProduct.image !== image) {
      const previousImageId = getProductImageId(currentProduct.image);
      if (previousImageId) {
        try {
          await (await getProductImageBucket()).delete(previousImageId);
        } catch (error) {
          console.error('Could not remove the replaced product image.', error);
          warning = 'Product saved, but the old image could not be removed.';
        }
      }
    }

    return Response.json({ product, warning }, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    if (uploadedImageId) {
      try {
        await (await getProductImageBucket()).delete(uploadedImageId);
      } catch (cleanupError) {
        console.error('Could not clean up an unused product image.', cleanupError);
      }
    }
    console.error('Could not save the product.', error);
    return errorResponse('The product could not be saved. Check the database connection and try again.');
  }
}

export async function GET() {
  const authError = await adminAccessError();
  if (authError) return authError;

  try {
    await ensureDefaultProducts();
    const collection = await getProductCollection();
    const products = await collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
    return Response.json({ products });
  } catch (error) {
    console.error('Could not load admin products.', error);
    return errorResponse('Products could not be loaded. Check the database connection.');
  }
}

export async function POST(request) {
  return saveProduct(request, false);
}

export async function PATCH(request) {
  return saveProduct(request, true);
}

export async function DELETE(request) {
  const authError = await adminAccessError();
  if (authError) return authError;

  try {
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) return errorResponse('Product ID is required.', 400);

    const collection = await getProductCollection();
    const product = await collection.findOne({ id });
    if (!product) return errorResponse('Product not found.', 404);
    await collection.deleteOne({ id });

    const imageId = getProductImageId(product.image);
    let warning;
    if (imageId) {
      try {
        await (await getProductImageBucket()).delete(imageId);
      } catch (error) {
        console.error('Product was deleted but its image could not be removed.', error);
        warning = 'Product deleted, but its image could not be removed.';
      }
    }

    return Response.json({ deleted: true, warning });
  } catch (error) {
    console.error('Could not delete the product.', error);
    return errorResponse('The product could not be deleted. Check the database connection.');
  }
}
