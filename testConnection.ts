// testConnection.ts
import mongoose from 'mongoose';
import 'dotenv/config'; // Cài đặt thư viện `dotenv` để đọc file .env

// --- START: Phần này bạn có thể copy từ file dbConnect.ts của mình ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}
// --- END ---

// Định nghĩa một schema test đơn giản
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
});

// Tạo model, nếu đã có thì dùng lại
const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);

async function runTest() {
  let testDocId: mongoose.Types.ObjectId | null = null;

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connection successful!');

    // --- Bắt đầu kiểm tra quyền ---

    // 1. Kiểm tra quyền GHI (CREATE)
    console.log('\n--- 1. Testing WRITE permission (CREATE)...');
    const newDoc = new TestModel({ name: 'Permission Test' });
    await newDoc.save();
    testDocId = newDoc._id;
    console.log(`✅ WRITE successful. Created document with ID: ${testDocId}`);

    // 2. Kiểm tra quyền ĐỌC (READ)
    console.log('\n--- 2. Testing READ permission (FIND)...');
    const foundDoc = await TestModel.findById(testDocId);
    if (!foundDoc) throw new Error('Failed to read the document that was just created.');
    console.log(`✅ READ successful. Found document: ${foundDoc.name}`);

    // 3. Kiểm tra quyền GHI (UPDATE)
    console.log('\n--- 3. Testing WRITE permission (UPDATE)...');
    await TestModel.updateOne({ _id: testDocId }, { name: 'Permission Test Updated' });
    console.log('✅ UPDATE successful.');

    // 4. Kiểm tra quyền GHI (DELETE)
    console.log('\n--- 4. Testing WRITE permission (DELETE)...');
    await TestModel.deleteOne({ _id: testDocId });
    console.log('✅ DELETE successful.');

    console.log('\n\n🎉 SUCCESS! Your user has full READ and WRITE permissions on the database.');

  } catch (error) {
    console.error('\n\n❌ TEST FAILED!');
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
        console.error('Reason: Could not connect to the server. Check your connection string, IP Access List, and network.');
    } else if (error instanceof Error && error.message.includes('command find requires authentication')) {
        console.error('Reason: Authentication failed. Check your username and password.');
    } else if (error instanceof Error && error.message.includes('not authorized')) {
        console.error('Reason: Authorization failed. The user does NOT have the required permissions (e.g., readWrite) on the database. Please check user roles in MongoDB Atlas.');
    } else {
        console.error('An unexpected error occurred:', error);
    }
  } finally {
    // Đóng kết nối để script kết thúc
    await mongoose.connection.close();
    console.log('\nConnection closed.');
  }
}

runTest();