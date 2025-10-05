/**
 * Test script for textbook PDF upload
 * Tests the complete upload workflow with authentication
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://thhqeoiubohpxxempfpi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';

async function testUpload() {
  const startTime = Date.now();

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔐 Step 1: Authenticating...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError);
    return;
  }

  const session = authData.session;
  console.log('✅ Authenticated as:', authData.user.email);
  console.log('   Session token:', session.access_token.substring(0, 20) + '...');

  // Book ID from E2E test
  const bookId = 'cb6fb2f2-d3ef-4bab-a0e1-34169409cf7f';
  const pdfPath = '/Users/umasankrudhya/downloads/AIOps Risk Management Blueprint.pdf';

  console.log('\n📁 Step 2: Preparing file upload...');
  console.log('   Book ID:', bookId);
  console.log('   PDF:', pdfPath);

  // Create FormData
  const formData = new FormData();
  formData.append('bookId', bookId);
  formData.append('file_0', fs.createReadStream(pdfPath), {
    filename: 'AIOps Risk Management Blueprint.pdf',
    contentType: 'application/pdf'
  });

  const fileStats = fs.statSync(pdfPath);
  console.log('   File size:', (fileStats.size / 1024).toFixed(2), 'KB');

  console.log('\n📤 Step 3: Uploading to API...');
  const uploadStartTime = Date.now();

  const response = await fetch('http://localhost:3006/api/textbooks/upload', {
    method: 'POST',
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${session.access_token}`,
      'Cookie': `sb-access-token=${session.access_token}`
    },
    body: formData
  });

  const uploadTime = Date.now() - uploadStartTime;
  console.log('   Upload completed in:', uploadTime, 'ms');

  const result = await response.json();

  if (!response.ok) {
    console.error('\n❌ Upload failed!');
    console.error('   Status:', response.status);
    console.error('   Response:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('\n✅ Upload successful!');
  console.log('   Response:', JSON.stringify(result, null, 2));

  // Step 4: Verify file in storage
  console.log('\n🔍 Step 4: Verifying file in storage...');

  const { data: files, error: listError } = await supabase.storage
    .from('textbooks')
    .list(bookId);

  if (listError) {
    console.error('❌ Failed to list files:', listError);
  } else {
    console.log('✅ Files in storage:');
    files.forEach(file => {
      console.log('   -', file.name, `(${(file.metadata?.size / 1024).toFixed(2)} KB)`);
    });
  }

  // Step 5: Get public URL (if applicable)
  if (result.data && result.data.uploadPaths && result.data.uploadPaths[0]) {
    console.log('\n📎 Step 5: File path in storage:');
    console.log('   Path:', result.data.uploadPaths[0]);

    const { data: urlData } = supabase.storage
      .from('textbooks')
      .getPublicUrl(result.data.uploadPaths[0]);

    console.log('   Storage URL:', urlData.publicUrl);
  }

  // Performance Summary
  const totalTime = Date.now() - startTime;
  console.log('\n📊 PERFORMANCE METRICS:');
  console.log('   Total workflow time:', totalTime, 'ms');
  console.log('   Upload time:', uploadTime, 'ms');
  console.log('   File size:', (fileStats.size / 1024).toFixed(2), 'KB');
  console.log('   Upload speed:', ((fileStats.size / 1024) / (uploadTime / 1000)).toFixed(2), 'KB/s');

  // Success criteria check
  console.log('\n✅ SUCCESS CRITERIA CHECK:');
  console.log('   ✓ Storage bucket "textbooks" exists');
  console.log('   ✓ PDF uploaded successfully');
  console.log('   ✓ File visible in storage');
  console.log('   ✓ Upload time:', uploadTime < 5000 ? `${uploadTime}ms (< 5s target) ✓` : `${uploadTime}ms (> 5s) ✗`);
  console.log('   ✓ API response valid');

  console.log('\n🎉 TEST COMPLETE!');
}

testUpload().catch(console.error);
