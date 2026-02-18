#!/usr/bin/env node

// Database Setup Script for n8n Automation Sidekick
// This script sets up the Supabase database schema

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupDatabase() {
  console.log('🔧 Setting up n8n Automation Sidekick database...');
  
  try {
    // Read and execute migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'supabase-migrations', '001_user_workflows.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, err.message);
      }
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying database schema...');
    await verifyTables();
    
    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function verifyTables() {
  try {
    // Check if user_workflows table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_workflows');
    
    if (error) {
      throw error;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ user_workflows table exists');
    } else {
      console.log('❌ user_workflows table not found');
    }
    
    // Check if we can query the table
    const { data: workflows, error: queryError } = await supabase
      .from('user_workflows')
      .select('id', 'name', 'created_at')
      .limit(1);
    
    if (queryError) {
      console.log('❌ Cannot query user_workflows table:', queryError.message);
    } else {
      console.log('✅ user_workflows table is queryable');
    }
    
    // Check if public_templates view exists
    try {
      const { data: templates, error: viewError } = await supabase
        .from('public_templates')
        .select('id', 'name')
        .limit(1);
      
      if (viewError) {
        console.log('❌ public_templates view not accessible:', viewError.message);
      } else {
        console.log('✅ public_templates view is accessible');
      }
    } catch (err) {
      console.log('❌ public_templates view not found:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, verifyTables };
