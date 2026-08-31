// src/tests/setup.ts
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

// acceptBid() uses a real MongoDB session/transaction (session.withTransaction),
// and transactions only work against a replica set — a single standalone
// in-memory MongoDB instance will reject them. MongoMemoryReplSet spins up a
// real (single-node) replica set in memory so transactional code under test
// behaves exactly like it does against Atlas in production.
let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
}, 30000);

afterEach(async () => {
  // Reset all collections between tests so one test's data never leaks into
  // another — each test should be able to run in isolation, in any order.
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});