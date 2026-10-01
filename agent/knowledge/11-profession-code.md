# Profession code doesn't match the labour contract (check R11)

**Sources (checked 2 Oct 2026):**
- MOHRE, modification of work permits / employment contracts — https://mohre.gov.ae/en/services/modification-of-work-permits-employment-contracts-2022 [official, from search summary]
- GDRFA Dubai, amendment of residence data (labour contract required for private-sector sponsors) — https://www.gdrfad.gov.ae/en/services/dff87d9f-b81d-11ed-5210-4cd98f768936 [official]

## Why it gets returned
- For a work residence, the **profession (job) code** on the application must match the one on the **labour contract** approved by MOHRE. If they differ, the application is returned. [guidance]

## Who fixes it
- Changing a work permit or employment contract is a **MOHRE service for the employer (the establishment)**. A new profession has to fit the company's licensed activity, and a contract signed by both sides is needed. [official]
- So the **employer** corrects it, not the applicant. Private-sector sponsors also submit the labour contract when residence data is amended. [official]

## What the assistant says when R11 fails
- "The job code on your application doesn't match the one on your labour contract. Your employer needs to correct that — usually their HR team or PRO handles it."
- "Once your employer has fixed it, the application can continue."
- Create a follow-up (tool: `create_followup`, rule R11).

## Do not say
- Which job code is correct. The assistant doesn't decide that, and never changes the profession on the call.
- Anything about the employer's licence or quota.
