import { buildShipmentsCsv, neutralizeFormula } from './csv'

describe('neutralizeFormula', () => {
  it('prefixes cells starting with a formula trigger', () => {
    expect(neutralizeFormula("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1")
    expect(neutralizeFormula('+1')).toBe("'+1")
    expect(neutralizeFormula('-1')).toBe("'-1")
    expect(neutralizeFormula('@x')).toBe("'@x")
    expect(neutralizeFormula('\tx')).toBe("'\tx")
    expect(neutralizeFormula('\rx')).toBe("'\rx")
  })

  it('leaves ordinary values untouched', () => {
    expect(neutralizeFormula('plain')).toBe('plain')
    expect(neutralizeFormula('123')).toBe('123')
    expect(neutralizeFormula('a=b')).toBe('a=b')
  })
})

describe('buildShipmentsCsv', () => {
  it('neutralizes formula-triggering cells and still RFC-quotes special chars', () => {
    const csv = buildShipmentsCsv([
      { title: '=SUM(A1:A2)', date: '2026-07-22', shipVia: 'a,b', po: 'PO"1' },
    ])
    const [, dataRow] = csv.split('\r\n')
    expect(dataRow.startsWith("'=SUM(A1:A2)")).toBe(true) // formula neutralized (no special char → unquoted)
    expect(dataRow).toContain('"a,b"') // comma still quoted
    expect(dataRow).toContain('"PO""1"') // embedded quote still escaped
  })

  it('quotes a formula cell that also contains a comma', () => {
    const csv = buildShipmentsCsv([{ title: '=1,2', date: 'd', shipVia: 's', po: 'p' }])
    const [, dataRow] = csv.split('\r\n')
    expect(dataRow.startsWith('"\'=1,2"')).toBe(true) // neutralized THEN quoted for the comma
  })

  it('leaves plain rows unquoted', () => {
    const csv = buildShipmentsCsv([
      { title: 'Widget', date: '2026-07-22', shipVia: 'Air', po: 'PO1' },
    ])
    expect(csv).toBe('Shipment Title,Date,Ship Via,PO #\r\nWidget,2026-07-22,Air,PO1')
  })
})
