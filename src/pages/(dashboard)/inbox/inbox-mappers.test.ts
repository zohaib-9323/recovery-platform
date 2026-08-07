import { mapRecoveryDocumentToInboxEmail } from './inbox-mappers'
import type { RecoveryCombinedDocument } from '@/types/recovery-inbox-api'

function baseRecord(
  unprocessable: RecoveryCombinedDocument['unprocessable'],
): RecoveryCombinedDocument {
  return {
    _id: 'doc-1',
    messageId: 'MSG-1',
    unprocessable,
  }
}

describe('mapRecoveryDocumentToInboxEmail — unprocessed status labels', () => {
  it('shows a specific label for UNSUPPORTED_BINARY_FORMAT instead of the generic "Failed"', () => {
    const email = mapRecoveryDocumentToInboxEmail(
      baseRecord([
        {
          filename: 'report.xlsm',
          type: 'UNKNOWN',
          failureReasonCode: 'UNSUPPORTED_BINARY_FORMAT',
          extractedData: { summary: 'This file could not be read locally.' },
        },
      ]),
    )

    expect(email.unprocessedShipments).toHaveLength(1)
    expect(email.unprocessedShipments[0].status).toBe('Unsupported format')
    expect(email.unprocessedShipments[0].statusDetail).toBe('This file could not be read locally.')
  })

  it('falls back to the generic "Failed" label for documents predating failureReasonCode', () => {
    const email = mapRecoveryDocumentToInboxEmail(
      baseRecord([{ filename: 'old-doc.pdf', type: 'UNKNOWN' }]),
    )

    expect(email.unprocessedShipments[0].status).toBe('Failed')
    expect(email.unprocessedShipments[0].statusDetail).toBeUndefined()
  })

  it('falls back to the generic "Failed" label for an unrecognized reason code, using the raw code as the tooltip', () => {
    const email = mapRecoveryDocumentToInboxEmail(
      baseRecord([
        { filename: 'mystery.bin', type: 'UNKNOWN', failureReasonCode: 'SOME_NEW_CODE' },
      ]),
    )

    expect(email.unprocessedShipments[0].status).toBe('Failed')
    expect(email.unprocessedShipments[0].statusDetail).toBe('SOME_NEW_CODE')
  })

  it('maps GEMINI_ERROR and PARSING_FAILURE to their own labels', () => {
    const email = mapRecoveryDocumentToInboxEmail(
      baseRecord([
        { filename: 'a.pdf', type: 'UNKNOWN', failureReasonCode: 'GEMINI_ERROR' },
        { filename: 'b.pdf', type: 'UNKNOWN', failureReasonCode: 'PARSING_FAILURE' },
      ]),
    )

    expect(email.unprocessedShipments[0].status).toBe('AI processing error')
    expect(email.unprocessedShipments[1].status).toBe('Parsing failed')
  })

  it('returns an empty list when there is nothing unprocessable', () => {
    const email = mapRecoveryDocumentToInboxEmail(baseRecord(undefined))
    expect(email.unprocessedShipments).toEqual([])
  })
})
