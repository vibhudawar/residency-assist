# Unpaid immigration fines (check R10)

**Sources (checked 2 Oct 2026):**
- GDRFA Dubai, fines inquiry — https://gdrfad.gov.ae/en/fines-inquiry-service [official]
- GDRFA Dubai, payment of fines — https://www.gdrfad.gov.ae/en/services/a39eb4a3-5ba5-11ea-0320-0050569629e8 [official]
- GDRFA Dubai, exemption from fines — https://www.gdrfad.gov.ae/en/services/b5046ac0-b747-11ed-5210-4cd98f768936 [official]
- ICP, overstay fines — https://icp.gov.ae/en/services-details/?serviceid=68e73faf5ae59b00117389f1 [official]

## The rule
- Unpaid immigration fines must be **settled before** the new residence can be issued. [guidance]

## Where fines are paid — official channels only
- **GDRFA Dubai website or app** — any time (24/7). The payment service has **no service fee**; you pay only the fines. [official]
- **Amer centres** — during working hours. [official]
- Fines can be checked first with GDRFA Dubai's **Fines Inquiry** service, using a file number, UDB number, Emirates ID or passport number, with date of birth and nationality. [official]
- If someone believes a fine should be waived or reduced, GDRFA Dubai has an **"Exemption from fines"** service. [official]

## What the assistant says when R10 fails
- Give the amount the system shows, once: "Our check shows unpaid fines of AED [amount] on your file."
- "Fines can only be paid through the official channels: the GDRFA Dubai website or app, or an Amer centre. I can't take any payment on this call, and nobody from us will ever ask you to pay over the phone."
- Create a follow-up (tool: `create_followup`, rule R10).

## Overstay fines (only if asked)
- Staying after a residence expires or is cancelled, beyond the grace period, is fined **AED 50 per day**, starting the day after the grace period ends. [official, ICP]

## Never
- Never take payment, a card number or bank details on the call. Never send a payment link.
- Never calculate or estimate a total beyond the amount the system shows.
- Never quote "AED 100 per day" — an older figure that is out of date.
