// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { z } from 'zod';

// Validation schemas
const CreateBankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(255, 'Account name too long'),
  accountNumber: z.string().min(9, 'Account number must be at least 9 digits').max(18, 'Account number too long'),
  bankName: z.string().min(1, 'Bank name is required').max(255, 'Bank name too long'),
  ifscCode: z.string().length(11, 'IFSC code must be 11 characters').regex(/^[A-Z]{4}[0-9]{7}$/, 'Invalid IFSC code format'),
  upiId: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0)
});

const UpdateBankAccountSchema = CreateBankAccountSchema.partial();

// Types
interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  upi_id?: string;
  is_active: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/bank-accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('bank_accounts')
      .select('*', { count: 'exact' });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    query = query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: accounts, error, count } = await query;

    if (error) {
      console.error('Error fetching bank accounts:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch bank accounts'
          }
        },
        { status: 500 }
      );
    }

    // Mask account numbers for security (show only last 4 digits)
    const maskedAccounts = accounts?.map(account => ({
      ...account,
      account_number: `****${account.account_number.slice(-4)}`
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        accounts: maskedAccounts,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    });

  } catch (error) {
    console.error('Bank accounts fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/bank-accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateBankAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { accountName, accountNumber, bankName, ifscCode, upiId, displayOrder } = validationResult.data;

    const supabase = getServiceSupabase();

    // Get current user (admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Admin access required'
          }
        },
        { status: 403 }
      );
    }

    // Check if IFSC code already exists
    const { data: existingAccount } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('ifsc_code', ifscCode)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_IFSC',
            message: 'Bank account with this IFSC code already exists'
          }
        },
        { status: 409 }
      );
    }

    // Create bank account
    const { data: newAccount, error: createError } = await supabase
      .from('bank_accounts')
      .insert({
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        ifsc_code: ifscCode,
        upi_id: upiId,
        display_order: displayOrder,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating bank account:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATION_ERROR',
            message: 'Failed to create bank account'
          }
        },
        { status: 500 }
      );
    }

    // Mask account number in response
    const response = {
      ...newAccount,
      account_number: `****${newAccount.account_number.slice(-4)}`
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Bank account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Bank account creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}