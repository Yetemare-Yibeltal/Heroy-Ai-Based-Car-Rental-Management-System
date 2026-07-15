import { claude, CLAUDE_MODEL } from './claude.client';
import { compareInspections } from '../inspection/inspection.service';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/AppError';

export interface DamageAnalysisResult {
  bookingId: string;
  hasPickupPhotos: boolean;
  hasReturnPhotos: boolean;
  aiAssessment: string;
  confidenceNote: string;
}

const DAMAGE_ANALYSIS_PROMPT = `You are assisting a car rental company's staff in comparing vehicle
condition photos taken at pickup versus return. You will be shown pickup photos first, then return
photos. Describe any visible differences that suggest new damage (scratches, dents, cracks, interior
stains, etc.) that appear in the return photos but not the pickup photos. Be specific about location
on the vehicle (e.g. "rear bumper, driver's side") when possible. If you see no clear evidence of new
damage, say so plainly. Keep your response to 3-4 sentences. This is an assistive second opinion for
staff, not a final determination - make that clear is not needed in your response, it will be added
separately.`;

async function fetchImageAsBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw AppError.badRequest(`Could not fetch inspection photo: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mediaType = response.headers.get('content-type') ?? 'image/jpeg';
  return { data: base64, mediaType };
}

interface TextContentBlock {
  type: 'text';
  text: string;
}

interface ImageContentBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

type ContentBlock = TextContentBlock | ImageContentBlock;

/**
 * Uses Claude's vision capability to compare pickup and return
 * inspection photos for a booking and produce a real AI-generated
 * assessment of likely new damage. This is explicitly framed to
 * staff as an assistive second opinion, not an automated verdict -
 * final damage determination always remains a human decision.
 */
export async function analyzeDamageComparison(bookingId: string): Promise<DamageAnalysisResult> {
  const comparison = await compareInspections(bookingId);

  if (!comparison.pickup || !comparison.return) {
    return {
      bookingId,
      hasPickupPhotos: Boolean(comparison.pickup),
      hasReturnPhotos: Boolean(comparison.return),
      aiAssessment:
        'Cannot generate a comparison until both a pickup and return inspection have been recorded for this booking.',
      confidenceNote: 'No analysis performed - missing inspection records.',
    };
  }

  const pickupImages = await Promise.all(
    comparison.pickup.photos.slice(0, 4).map(fetchImageAsBase64)
  );
  const returnImages = await Promise.all(
    comparison.return.photos.slice(0, 4).map(fetchImageAsBase64)
  );

  const content: ContentBlock[] = [{ type: 'text', text: 'Pickup photos:' }];

  for (const img of pickupImages) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    });
  }

  content.push({ type: 'text', text: 'Return photos:' });

  for (const img of returnImages) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    });
  }

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    system: DAMAGE_ANALYSIS_PROMPT,
    messages: [{ role: 'user', content: content as never }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const aiAssessment =
    textBlock && 'text' in textBlock
      ? textBlock.text
      : 'Unable to generate an assessment for these photos.';

  logger.info(`AI damage comparison generated for booking ${bookingId}`);

  return {
    bookingId,
    hasPickupPhotos: true,
    hasReturnPhotos: true,
    aiAssessment,
    confidenceNote:
      'This is an AI-generated second opinion based on photo comparison. Final damage determination should always be confirmed by staff.',
  };
}
