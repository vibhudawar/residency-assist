# Name, date of birth and passport number (checks R1, R2, R3)

**Sources (checked 2 Oct 2026):**
- GDRFA Dubai, amendment of all types of residence permit data — https://www.gdrfad.gov.ae/en/services/dff87d9f-b81d-11ed-5210-4cd98f768936 [official]
- ICP, amendment of residency permit data (other emirates) — https://icp.gov.ae/en/services-details/?serviceid=64afe3c1035448005bd52e67 [official]

## Why these get returned
- The name, date of birth and passport number on the application must **match the passport exactly**. A small difference — a missing middle name, a swapped letter, a different spelling, a wrong digit — is enough for the application to be returned. [guidance]
- Names are often typed by someone else (for example at a typing centre) or transliterated between English and Arabic, which is where most spelling differences come from. [guidance]
- **The passport is the reference.** Official amendment services ask for the passport as the core document. [official]

## Fixing it on this call (before the visa is issued)
Only the fields the check flagged can be corrected, and every correction goes to an officer for approval.
1. Ask the caller to **look at their passport** and read the value exactly as printed.
2. **Read it back** carefully:
   - Names: spell **letter by letter**, then say it as a whole. Confirm the order (first, middle, last) and spaces.
   - Date of birth: say the **day, the month in words, and the year** ("the fourteenth of February, nineteen eighty-five") to avoid day/month mix-ups.
   - Passport number: read **character by character**, separating letters and digits (for example "N — five — five — zero…"). Check easily confused characters: O and 0, I and 1, S and 5, B and 8.
3. Get a clear **yes** before submitting (tool: `submit_correction`, with `caller_confirmed_read_back: true`).
4. If the system says the value **still doesn't match** the passport on file, do not guess and do not reveal the record. Say it still doesn't match what we have, and offer a person.

## If the details need changing after a visa is issued
- In Dubai, personal data on a residence permit is amended through GDRFA Dubai's **"Amendment of all types of residence permit data"** service — on the GDRFA website (24/7) or at **Amer centres**. It needs the passport (valid more than 6 months) and a recent white-background photo; approval comes by SMS. [official]
- In other emirates, ICP's **"Amendment of Residency Permit Data"** service does the same, through ICP Smart Services or the app with UAE PASS. [official]
- If the person's name has legally changed, the **passport is updated first**, then the residence record. [guidance]

## Do not say
- Which fields the official amendment services allow, or their fees — say "check the official service".
- What the passport record says, ever. The caller tells us; the system only says whether it matches.
