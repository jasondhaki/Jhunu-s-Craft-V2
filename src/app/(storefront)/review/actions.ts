'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCustomer } from '@/lib/customer-auth';
import { createReview, ReviewNotPermittedError } from '@/lib/reviews';

/**
 * Review submission — plan §6.3.14, §13.3.
 *
 * The security question here is: who is allowed to review order X?
 *
 * Someone who can prove they hold that order — either a signed-in customer
 * who owns it, or anyone holding its unguessable `publicToken` (which only
 * reaches the buyer, in the confirmation email). Both are checked HERE, in
 * the action, not merely by whether the form was rendered (§13.3).
 *
 * `createReview` then independently re-verifies that the order contains the
 * product and has been delivered, so the "verified purchase" badge cannot be
 * obtained by any route.
 */

export type ReviewResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  orderId: z.string().trim().min(1).max(64),
  productId: z.string().trim().min(1).max(64),
  rating: z.coerce.number().int().min(1, 'Please choose a rating.').max(5),
  authorName: z.string().trim().min(1, 'Please add your name.').max(120),
  title: z.string().trim().max(120).optional().or(z.literal('')),
  body: z
    .string()
    .trim()
    .min(10, 'Please write a little more — a sentence or two is plenty.')
    .max(3000),
  /** Present only on the guest path. */
  token: z.string().trim().max(200).optional().or(z.literal('')),
});

export async function submitReviewAction(
  formData: FormData,
): Promise<ReviewResult> {
  const parsed = schema.safeParse({
    orderId: formData.get('orderId'),
    productId: formData.get('productId'),
    rating: formData.get('rating'),
    authorName: formData.get('authorName'),
    title: formData.get('title') ?? '',
    body: formData.get('body'),
    token: formData.get('token') ?? '',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  // --- Prove the requester actually holds this order ----------------------
  const customer = await getCustomer();

  const order = await db.order.findFirst({
    where: {
      id: data.orderId,
      // Either they own it, or they hold the token from their confirmation.
      // Both conditions live in the WHERE clause, so a mismatch returns
      // nothing rather than relying on a follow-up `if` that could be missed.
      OR: [
        ...(customer ? [{ customerId: customer.id }] : []),
        ...(data.token ? [{ publicToken: data.token }] : []),
      ],
    },
    select: { id: true },
  });

  if (!order) {
    return {
      ok: false,
      error: 'We could not confirm that order. Please use the link from your confirmation email.',
    };
  }

  try {
    await createReview({
      orderId: order.id,
      productId: data.productId,
      rating: data.rating,
      title: data.title || null,
      body: data.body,
      authorName: data.authorName,
    });
  } catch (error) {
    if (error instanceof ReviewNotPermittedError) {
      return { ok: false, error: error.message };
    }
    console.error('Review creation failed', error);
    return {
      ok: false,
      error: 'Something broke on our end and your review was not saved. Please try again.',
    };
  }

  // The review is PENDING, so nothing public changes yet — but the admin
  // dashboard's action queue should show it immediately.
  revalidatePath('/admin');
  revalidatePath('/admin/reviews');

  return { ok: true };
}
