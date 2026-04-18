$repo = "Sayo-codes/EsusuChain"
$tempFile = "temp_issue_body.txt"

# Issue 1 - Trivial: Freighter wallet connect button UX
$body1 = @"
## Summary
The "Connect Wallet" button in the frontend does not display the connected account address after Freighter is connected. Users cannot confirm which Stellar account is active. Add a truncated address display (e.g. G3XK...F9QP) next to the button after connection, with a copy-on-click that shows a brief success toast.

## Acceptance Criteria
- [ ] After connecting Freighter, button area shows truncated public key (first 4 + last 4 chars)
- [ ] Clicking the address copies the full public key to clipboard
- [ ] A toast notification confirms copy success
- [ ] Works on Chrome and Firefox with the Freighter extension installed

## Files to Edit
- frontend/src/App.jsx (wallet connect button component)
- frontend/src/index.css (address pill styling)

## Complexity
complexity: trivial
"@
Set-Content -Path $tempFile -Value $body1 -Encoding UTF8
gh issue create --repo $repo --title "Display connected Freighter wallet address after wallet connect" --body-file $tempFile --label "help wanted,good first issue,complexity: trivial"
Start-Sleep -Seconds 2

# Issue 2 - Trivial: Add Stellar/Soroban Open Graph meta tags
$body2 = @"
## Summary
The frontend HTML head is missing Open Graph and Twitter card meta tags. When the dApp link is shared on Discord, Telegram, or Twitter, no preview image or description appears. Add proper OG tags that reflect the Stellar/Soroban branding.

## Acceptance Criteria
- [ ] og:title set to "EsusuChain - Soroban ROSCA on Stellar"
- [ ] og:description set with a clear one-line summary
- [ ] og:image pointing to a hosted preview image or SVG in /public
- [ ] twitter:card set to summary_large_image
- [ ] twitter:title and twitter:description added

## Files to Edit
- frontend/index.html
- frontend/public/ (add preview image asset)

## Complexity
complexity: trivial
"@
Set-Content -Path $tempFile -Value $body2 -Encoding UTF8
gh issue create --repo $repo --title "Add Stellar-branded Open Graph and Twitter card meta tags to frontend" --body-file $tempFile --label "help wanted,good first issue,complexity: trivial"
Start-Sleep -Seconds 2

# Issue 3 - Medium: Pool search and status filter
$body3 = @"
## Summary
The homepage shows all pools in a grid but there is no way to filter or search them. As the number of savings circles grows, users need to find specific pools quickly. Add a search bar and status filter tabs (All / Open / Active / Completed) that filter the pool grid in real time.

## Acceptance Criteria
- [ ] Text search filters pools by name (case-insensitive, no page reload)
- [ ] Status filter buttons: All, Open, Active, Completed
- [ ] Filters update the pool grid instantly using React state
- [ ] Shows a "No pools found" empty state when filters match nothing
- [ ] Filter state resets when navigating back from pool detail

## Files to Edit
- frontend/src/App.jsx
- frontend/src/index.css (filter button and search bar styles)

## Complexity
complexity: medium
"@
Set-Content -Path $tempFile -Value $body3 -Encoding UTF8
gh issue create --repo $repo --title "Add search and status filter to the pool listing page" --body-file $tempFile --label "help wanted,complexity: medium"
Start-Sleep -Seconds 2

# Issue 4 - Medium: Live round countdown timer
$body4 = @"
## Summary
Active pools display a static "Xh remaining" label that does not tick while the user has the page open. Replace it with a live countdown timer using the round_start and cycle_duration values from the Soroban contract, ticking every second via setInterval.

## Acceptance Criteria
- [ ] Countdown displayed as "Xd Xh Xm Xs" format
- [ ] Timer updates every second using setInterval
- [ ] Interval is cleaned up on component unmount (no memory leaks)
- [ ] When time hits 0, displays "Round ended - awaiting finalization"
- [ ] Timer derives deadline from on-chain round_start + cycle_duration ledger values

## Files to Edit
- frontend/src/App.jsx (PoolDetail and PoolCard components)

## Complexity
complexity: medium
"@
Set-Content -Path $tempFile -Value $body4 -Encoding UTF8
gh issue create --repo $repo --title "Implement live countdown timer for active Soroban round deadlines" --body-file $tempFile --label "help wanted,complexity: medium"
Start-Sleep -Seconds 2

# Issue 5 - Medium: Rust tests for cancel_pool and auth edge cases
$body5 = @"
## Summary
The Soroban test suite covers the happy-path join/contribute/finalize flow but is missing tests for cancel_pool and for unauthorized-caller rejection. Add comprehensive Rust unit tests using the Soroban test utilities.

## Acceptance Criteria
- [ ] Test: cancel_pool transitions status to Cancelled
- [ ] Test: calling cancel_pool twice panics with PoolAlreadyCancelled
- [ ] Test: non-admin calling finalize_round panics with Unauthorized
- [ ] Test: non-admin calling cancel_pool panics with Unauthorized
- [ ] Test: joining a Cancelled pool panics with PoolNotOpen
- [ ] All tests pass with cargo test

## Files to Edit
- contracts/soroban/esusu_pool/src/test.rs

## Complexity
complexity: medium
"@
Set-Content -Path $tempFile -Value $body5 -Encoding UTF8
gh issue create --repo $repo --title "Add Soroban Rust tests for cancel_pool and unauthorized caller scenarios" --body-file $tempFile --label "help wanted,complexity: medium"
Start-Sleep -Seconds 2

# Issue 6 - High: Freighter wallet full integration
$body6 = @"
## Summary
The frontend currently uses placeholder functions for Soroban transaction signing. Implement full Freighter wallet integration using @stellar/freighter-api so users can sign join, contribute, and finalize_round transactions directly in their browser. This is the most critical frontend feature for the dApp to be functional.

## Acceptance Criteria
- [ ] @stellar/freighter-api installed and imported
- [ ] "Connect Wallet" button requests Freighter access and retrieves the public key
- [ ] join() UI button builds a Soroban transaction, passes it to Freighter to sign, and submits to the RPC
- [ ] contribute() UI button does the same
- [ ] Pending and success/error states are handled with loading spinners and toasts
- [ ] Works on Stellar Testnet end-to-end (join, contribute, round visible)

## Files to Edit
- frontend/src/App.jsx
- frontend/package.json (add @stellar/freighter-api)
- sdk/index.js (use buildJoinTx, buildContributeTx helpers)

## Complexity
complexity: high
"@
Set-Content -Path $tempFile -Value $body6 -Encoding UTF8
gh issue create --repo $repo --title "Implement Freighter wallet signing for Soroban transactions in frontend" --body-file $tempFile --label "help wanted,complexity: high"
Start-Sleep -Seconds 2

# Issue 7 - High: Deploy to Stellar Testnet and update frontend
$body7 = @"
## Summary
The contract has never been deployed to a live public testnet. Deploy the compiled Soroban WASM to Stellar Testnet, initialize a demo pool, and update the frontend and README so anyone can try EsusuChain without running a local node.

## Acceptance Criteria
- [ ] esusu_pool.wasm compiled and optimized with stellar contract optimize
- [ ] Contract deployed and initialized on Stellar Testnet (contract ID documented)
- [ ] A deployments/testnet.json file added with contract ID, init parameters, and deployer address
- [ ] frontend/src/App.jsx updated with the live testnet Contract ID as default
- [ ] VITE_CONTRACT_ID documented in .env.example
- [ ] README updated with the live contract ID and Stellar Expert explorer link
- [ ] Frontend Vite config defaults to Testnet RPC URL

## Files to Edit / Add
- deployments/testnet.json (new)
- frontend/src/App.jsx
- .env.example
- README.md

## Complexity
complexity: high
"@
Set-Content -Path $tempFile -Value $body7 -Encoding UTF8
gh issue create --repo $repo --title "Deploy EsusuPool Soroban contract to Stellar Testnet and connect frontend" --body-file $tempFile --label "help wanted,complexity: high"
Start-Sleep -Seconds 2

Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
Write-Host "All 7 Stellar/Soroban issues created successfully!"
