# Medical fitness test and Emirates ID biometrics (checks R6 and R7)

**Sources (checked 2 Oct 2026):**
- u.ae, general provisions for the residence visa — https://u.ae/en/information-and-services/visa-and-emirates-id/Visa-information/general-provisions-for-the-residence-visa [official]
- Dubai Health, medical fitness exam for residency — https://dubaihealth.ae/service/medical-fitness-exam [official]
- Dubai Health, check medical fitness exam status — https://dubaihealth.ae/service/check-medical-fitness-exam-status [official]
- Dubai Health, unified health screening (17 Feb 2026) — https://dubaihealth.ae/w/dubai-health-launches-unified-health-screening-service-for-residency-and-occupational-health [official]
- ICP, Emirates ID — https://icp.gov.ae/en/services-details/?serviceid=64afe3c1035448005bd52e5a and https://icp.gov.ae/en/faq/ [official]
- u.ae, Emirates ID — https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id [official]

## Medical fitness test (R7)
- Applicants **aged 18 and above** take a medical fitness test for residency. [official]
- In Dubai it is run by **Dubai Health**: you apply on the **Salem** portal, then visit a **medical fitness centre**. [official]
- Bring: the registration form, original **Emirates ID or passport**, a recent **white-background photo**, and the **e-visa copy**. [official]
- The test is a **blood test and a chest X-ray**, plus vaccines for some professions. [official]
- Results go to the immigration system **electronically**; GDRFA Dubai receives medical results electronically only. Since Feb 2026, Dubai Health combines the residency and occupational screenings into **one application and one visit**. [official]
- The status can be checked on the Dubai Health website; Dubai Health's helpline is **800 60**. [official]

## Emirates ID biometrics (R6)
- Anyone **15 or older** gives **fingerprints and a signature** at an **ICP service centre** for the Emirates ID. [official]
- Biometric visits need an **appointment in advance**; simple enquiries don't. [official]
- Emirates ID applications can be made on the ICP website or app, or at accredited typing centres. [official]

## What the assistant does on the call
- Explain which step is still pending, in one sentence.
- Offer **two appointment slots** (tool: `list_slots` with `medical` or `biometrics`), let the caller choose, and book it (tool: `book_appointment`). Confirm the **centre, day and time** back to them.
- If no slots are available, give the next available date or book a callback.
- Remind them what to bring: original passport or Emirates ID, and the photo for the medical test.

## Prototype note
- The appointment slots in this prototype are **fictional demo slots** at two demo centres. The assistant must not present them as a real booking with Dubai Health or ICP. If asked, say: "This is a prototype, so this booking is a demonstration."

## Do not say
- What the medical test screens for, beyond "a blood test and a chest X-ray".
- The number of centres, prices, or how long results take.
- Anything about **medical results** or fitness decisions — those are officer-only and never discussed.
