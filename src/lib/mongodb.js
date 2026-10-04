import { GridFSBucket, MongoClient, ObjectId } from 'mongodb';

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!globalThis.drevenMongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.drevenMongoClientPromise = client.connect().catch((error) => {
      delete globalThis.drevenMongoClientPromise;
      throw error;
    });
  }

  return globalThis.drevenMongoClientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || 'dreven');
}

export async function getProductCollection() {
  const database = await getDatabase();
  return database.collection('products');
}

export async function getProductImageBucket() {
  const database = await getDatabase();
  return new GridFSBucket(database, { bucketName: 'productImages' });
}

export async function ensureDefaultProducts() {
  const database = await getDatabase();
  const settings = database.collection('settings');
  if (await settings.findOne({ _id: 'default-products-seeded' })) return;

  const collection = database.collection('products');
  await collection.createIndex({ id: 1 }, { unique: true });
  if (await collection.countDocuments() > 0) {
    await settings.updateOne(
      { _id: 'default-products-seeded' },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    return;
  }

  const defaultProducts = [
    { id: 'PR-1001', name: 'Oud Al Layl', category: 'Attar & Fragrance', price: 1250, stock: 24, image: '/attor/Oud-Al-Layl.jpeg' },
    { id: 'PR-1002', name: 'Ameer Al Oud', category: 'Attar & Fragrance', price: 1450, stock: 8, image: '/attor/Ameer-Al-Oud.jpeg' },
    { id: 'PR-1003', name: 'Hawas Fire', category: 'Attar & Fragrance', price: 1100, stock: 3, image: '/attor/Hawas-Fire.jpeg' },
    { id: 'PR-1004', name: 'Vampire Blood', category: 'Attar & Fragrance', price: 990, stock: 16, image: '/attor/Vampire-Blood.jpeg' },
  ];

  await collection.bulkWrite(
    defaultProducts.map((product) => ({
      updateOne: {
        filter: { id: product.id },
        update: {
          $setOnInsert: {
            ...product,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
  await settings.updateOne(
    { _id: 'default-products-seeded' },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
}

export function getProductImageId(imageUrl) {
  const match = /^\/api\/product-images\/([a-f\d]{24})$/i.exec(imageUrl || '');
  return match ? new ObjectId(match[1]) : null;
}

export { ObjectId };
