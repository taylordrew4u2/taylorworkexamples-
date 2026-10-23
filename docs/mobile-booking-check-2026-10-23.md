# Mobile booking check — October 23, 2026

Tested the actual public BriefBooth booking page at a 390 × 844 viewport using the business email and a clearly labeled 4u Digital test identity. No client was contacted and no payment was made.

Verified required-name validation, name/email entry, intake progression, optional-question skips, Zoom consultation selection, available times, timezone display, submit-button loading/disabled state, and successful request submission. The resulting management page explicitly says the request is pending approval and is not a confirmed appointment. Its content fits the 390-pixel viewport and its two action buttons are 48 pixels high.

The selected Zoom consultation is thirty minutes. Removed the portfolio offer's conflicting fifteen-minute description. The homepage now says requests are reviewed before confirmation.

The owner approved the labeled test request. Verified the confirmed status and Zoom join link on the management page. The final confirmation email arrived in the business inbox, included the expected consultation/date, and contained the same Zoom meeting and management link. No Zoom call was joined. Cancelled the test through the client management page and verified its cancelled status, so no test appointment remains scheduled.

The earlier pending-request receipt was delivered to Spam, while the final confirmation arrived in the inbox. The sampled receipt and confirmation passed sender authentication. This is one observed mailbox result, not a guarantee of delivery or inbox placement for other clients; monitor the request receipts. No inbox rules, authentication settings, mail-provider plan, or paid service were changed.

Local automated checks separately verify the portfolio's outbound BriefBooth links with and without JavaScript; they stub the destination and do not create appointments.
