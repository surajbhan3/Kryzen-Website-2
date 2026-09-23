# Kryzen Farm Materials
First bilingual interactive review version. Static frontend served from dist. Backend contract in api/contract.json.

Implemented: responsive configuration, six purchase views, individual-material reference catalogue, 15 explicitly sample construction profiles and filters, account entry, WhatsApp lead form, progress preview, local configuration persistence, English/Hindi language toggle.

No real OTP, customer records, payments, invoice generation, freight estimates, BOM scaling or live prices. Personal details are neither stored nor transmitted. Only non-sensitive selections and language use device storage. Reference BOM rows are explicitly labelled and must be replaced by backend calculations. All sample team profiles must be replaced before customer launch. Branding uses text names, not unverified third-party logos.

Dimension maxima interpreted from owner's correction: span 144m, bay 276m. Validate engineering rules for each structure. Construction fee payment timing, deposit basis and price-lock duration remain commercial decisions.

Production integration: implement the API contract, attach authentication/provider credentials server-side, replace reference views with authenticated data, configure rates and tax, then enable checkout. Never enable checkout based only on client-calculated totals.

Revision 2: fixed language handler scoping and storage failures; relative paths support opening the downloaded HTML. Added PNG photos from Kryzen product pages, original BOM images and representative component photos (sources in assets/sources.json). Material categories respond to structure/cover/fogging/drip selections; non-reference quantities remain pending rather than scaled without engineering rules. Previous-step gates, pincode/crop validation, own-team skip and upstream-selection invalidation are active. Desktop layout is more compact. Browser visual QA was unavailable for this static preview; script-level handler and flow checks passed.

### Transport calculator

The Add-ons preview resolves origin pincode 412803 and the entered delivery pincode through https://api.zippopotam.us, then requests driving distance from the public OSRM demo at https://router.project-osrm.org. It rounds distance to 0.1 km and estimates cost at INR 15/km. Distances are between representative postal locations, not exact factory/delivery entrances; the same pincode returns 0 km. Invalid/unknown pincodes, failed routes and network errors show an error rather than a fabricated price. Changing the pincode clears the previous estimate.

The public routing endpoint is a preview dependency. Before commercial deployment, replace it with an authorized production routing service or a hosted OSRM instance. Documentation: https://project-osrm.org/docs/v5.5.1/api/ and https://zippopotam.us/.

### Configure login gate

Configure → Continue opens signup (name, mobile) or existing-account login (mobile only), then a four-digit WhatsApp OTP form. The frontend calls the request/verify endpoints in `api/contract.json`. Successful verification must return `verified: true`, `progressSaved: true`, and the account email after persisting the profile/configuration and setting the session cookie; only then does the dialog close and navigate to Materials. Temporary UI testing is enabled via `CONFIGURE_OTP_TEST_MODE = true` in app.js: no WhatsApp message or API request is sent, and any four numeric digits advance to Materials. Set this flag to false to restore server verification before deployment. The API and WhatsApp provider are not implemented in this static workspace, so sending and verifying an actual OTP requires that backend integration. Backend endpoints must independently enforce authentication and ownership; the client navigation gate is only UI.

### Account workspace

My Account has horizontally scrollable My orders, Track orders and Account settings tabs. Local records are grouped into quotations, in-process (verified booking payment), and completed (verified full payment); full payment does not imply delivery. Profile name/email/company/GST/PAN settings are device-local. Each saved quotation snapshots its item rows for an HTML download. Invoice/insurance/fitness download buttons remain unavailable until issued document URLs are supplied. Construction-team information is rendered only for dispatched or delivered records.

For production, replace local records/profile storage with authenticated account endpoints. Payment status must come from verified server reconciliation. Withhold team details in API responses until dispatch (frontend hiding alone is not access control), and authorize every document request against the signed-in account. The current payment/OTP preview does not establish those production guarantees.
