import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, scheduled_date } = body;

    const supabase = createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('scheduled_messages')
      .select('id, sent_count')
      .eq('id', id)
      .eq('vendor_id', session.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'mark_sent':
        updateData = {
          status: 'sent',
          sent_count: (existing.sent_count || 0) + 1,
          last_sent_at: new Date().toISOString(),
        };
        break;

      case 'mark_completed':
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
        };
        break;

      case 'reschedule':
        if (!scheduled_date) {
          return NextResponse.json({ error: 'New date is required' }, { status: 400 });
        }
        updateData = {
          scheduled_date: new Date(scheduled_date).toISOString(),
          status: 'pending',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('scheduled_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update reminder:', error);
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Reminder update error:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Soft delete - mark as deleted instead of actually deleting
    const { error } = await supabase
      .from('scheduled_messages')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('vendor_id', session.id);

    if (error) {
      console.error('Failed to delete reminder:', error);
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Reminder delete error:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
