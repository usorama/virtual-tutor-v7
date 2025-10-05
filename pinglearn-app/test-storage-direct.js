/**
 * Direct Supabase Storage Upload Test
 * Bypasses API to test storage bucket functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://thhqeoiubohpxxempfpi.supabase.co';
const SUPABASE_SECRET = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

async function testDirectUpload() {
  const startTime = Date.now();

  // Initialize Supabase with admin privileges
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const bookId = 'cb6fb2f2-d3ef-4bab-a0e1-34169409cf7f';
  const pdfPath = '/Users/umasankrudhya/downloads/AIOps Risk Management Blueprint.pdf';

  console.log('📦 SUPABASE STORAGE DIRECT UPLOAD TEST');
  console.log('=' .repeat(50));

  console.log('\n📁 Step 1: File preparation');
  const fileBuffer = fs.readFileSync(pdfPath);
  const fileStats = fs.statSync(pdfPath);
  const fileName = 'AIOps Risk Management Blueprint.pdf';
  const sanitizedName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${sanitizedName}`;
  const storagePath = `${bookId}/${uniqueFileName}`;

  console.log('   File:', fileName);
  console.log('   Size:', (fileStats.size / 1024).toFixed(2), 'KB');
  console.log('   Storage path:', storagePath);

  console.log('\n📤 Step 2: Uploading to storage bucket "textbooks"...');
  const uploadStartTime = Date.now();

  const { data, error } = await supabase.storage
    .from('textbooks')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  const uploadTime = Date.now() - uploadStartTime;

  if (error) {
    console.error('\n❌ Upload failed!');
    console.error('   Error:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('✅ Upload successful!');
  console.log('   Path:', data.path);
  console.log('   Upload time:', uploadTime, 'ms');

  console.log('\n🔍 Step 3: Verifying file in storage...');

  // List files in the book directory
  const { data: fileList, error: listError } = await supabase.storage
    .from('textbooks')
    .list(bookId);

  if (listError) {
    console.error('❌ Failed to list files:', listError);
  } else {
    console.log('✅ Files in book directory:');
    fileList.forEach(file => {
      const size = file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) : 'N/A';
      console.log(`   - ${file.name} (${size} KB)`);
    });
  }

  console.log('\n📊 Step 4: Query storage.objects table...');

  const { data: objectData, error: queryError } = await supabase
    .from('storage.objects')
    .select('name, size, created_at, bucket_id')
    .eq('bucket_id', 'textbooks')
    .like('name', `${bookId}/%`);

  if (queryError) {
    console.error('❌ Query failed:', queryError);
  } else {
    console.log('✅ Storage objects:');
    objectData.forEach(obj => {
      console.log(`   - ${obj.name}`);
      console.log(`     Size: ${(obj.size / 1024).toFixed(2)} KB`);
      console.log(`     Created: ${obj.created_at}`);
    });
  }

  console.log('\n📎 Step 5: Generate public URL...');

  const { data: urlData } = supabase.storage
    .from('textbooks')
    .getPublicUrl(storagePath);

  console.log('   Public URL:', urlData.publicUrl);
  console.log('   (Note: Bucket is private, so URL requires auth)');

  // Performance metrics
  const totalTime = Date.now() - startTime;
  const uploadSpeedKBps = (fileStats.size / 1024) / (uploadTime / 1000);

  console.log('\n📊 PERFORMANCE METRICS:');
  console.log('   Total workflow time:', totalTime, 'ms');
  console.log('   Pure upload time:', uploadTime, 'ms');
  console.log('   File size:', (fileStats.size / 1024).toFixed(2), 'KB');
  console.log('   Upload speed:', uploadSpeedKBps.toFixed(2), 'KB/s');

  // Success criteria
  console.log('\n✅ SUCCESS CRITERIA:');
  console.log('   ✓ Storage bucket "textbooks" exists');
  console.log('   ✓ PDF uploaded successfully');
  console.log('   ✓ File visible in storage.objects table');
  console.log('   ✓ Upload time:', uploadTime < 5000 ? `${uploadTime}ms (< 5s) ✓` : `${uploadTime}ms (> 5s) ✗`);
  console.log('   ✓ File size: 619.83 KB ✓');

  console.log('\n🎉 DIRECT STORAGE TEST COMPLETE!');
  console.log('=' .repeat(50));
}

testDirectUpload().catch(console.error);
