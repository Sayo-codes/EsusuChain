$repo = "Sayo-codes/EsusuChain"

# Issue 1 - Trivial
$body1 = @"
## Summary
The pool contract address is displayed in the Pool Detail view, but users cannot easily copy it. Add a copy icon button next to the address that copies it to the clipboard and shows a confirmation toast.

## Acceptance Criteria
- [ ] Clicking the button copies the full address to clipboard
- [ ] A success toast or tooltip confirms the action
- [ ] Works across Chrome, Firefox, and Edge

## Files to Edit
- ``frontend/src/App.jsx`` (PoolDetail component around the address display)

## Complexity
``complexity: trivial``
"@

gh issue create --repo $repo `
  --title "Add copy-to-clipboard button for pool contract addresses" `
  --body $body1 `
  --label "help wanted,good first issue,complexity: trivial"

Start-Sleep -Seconds 1

# Issue 2 - Trivial
$body2 = @"
## Summary
The frontend HTML title and meta tags reference EsusuChain but the Open Graph image (og:image) meta tag is missing, meaning link previews on Twitter/Discord/Telegram show no image. Add a proper og:image and twitter:card meta tags.

## Acceptance Criteria
- [ ] ``og:image`` meta tag added pointing to a relevant image or SVG
- [ ] ``twitter:card`` set to ``summary_large_image``
- [ ] ``twitter:title`` and ``twitter:description`` added

## Files to Edit
- ``frontend/index.html``

## Complexity
``complexity: trivial``
"@

gh issue create --repo $repo `
  --title "Add Open Graph and Twitter card meta tags to frontend" `
  --body $body2 `
  --label "help wanted,good first issue,complexity: trivial"

Start-Sleep -Seconds 1

# Issue 3 - Medium
$body3 = @"
## Summary
The homepage shows all pools in a grid but there is no way to filter or search them. As the number of pools grows, users need to find specific circles quickly. Add a search bar and status filter tabs (All / Open / Active / Completed).

## Acceptance Criteria
- [ ] Text search filters pools by name (case-insensitive)
- [ ] Status filter buttons: All, Open, Active, Completed
- [ ] Filters update the pool grid in real time with no page reload
- [ ] Shows a "No results" empty state when filters match nothing
- [ ] Filter state resets when navigating back from pool detail

## Files to Edit
- ``frontend/src/App.jsx``
- ``frontend/src/index.css`` (for filter button styles)

## Complexity
``complexity: medium``
"@

gh issue create --repo $repo `
  --title "Add search and status filter to the pool listing page" `
  --body $body3 `
  --label "help wanted,complexity: medium"

Start-Sleep -Seconds 1

# Issue 4 - Medium
$body4 = @"
## Summary
Active pools show a time remaining ("Xh"), but it is static and doesn't update while the user has the page open. Replace this with a live countdown timer that ticks every second so users know exactly when a round deadline is.

## Acceptance Criteria
- [ ] Countdown displayed as ``Xd Xh Xm Xs`` format
- [ ] Timer updates every second using ``setInterval``
- [ ] Cleans up the interval on component unmount to avoid memory leaks
- [ ] When time hits 0, displays "Round ended – awaiting finalization"

## Files to Edit
- ``frontend/src/App.jsx`` (PoolDetail and PoolCard components)

## Complexity
``complexity: medium``
"@

gh issue create --repo $repo `
  --title "Implement live countdown timer for active round deadlines" `
  --body $body4 `
  --label "help wanted,complexity: medium"

Start-Sleep -Seconds 1

# Issue 5 - Medium
$body5 = @"
## Summary
The test suite covers the happy path well but is missing edge case tests for the ``cancelPool`` function and for the ``pause``/``unpause`` admin controls. Add tests for these scenarios.

## Acceptance Criteria
- [ ] Test: ``cancelPool`` distributes balance equally among members
- [ ] Test: ``cancelPool`` reverts when called on a Completed pool
- [ ] Test: paused pool rejects ``join()`` and ``contribute()``
- [ ] Test: ``unpause`` restores normal functionality
- [ ] All new tests pass with ``npm test``

## Files to Edit
- ``test/EsusuPool.test.js``

## Complexity
``complexity: medium``
"@

gh issue create --repo $repo `
  --title "Add missing tests for cancelPool, pause, and unpause admin functions" `
  --body $body5 `
  --label "help wanted,complexity: medium"

Start-Sleep -Seconds 1

# Issue 6 - High
$body6 = @"
## Summary
The frontend is currently hardcoded to a local Hardhat node address. Deploy the contracts to the Sepolia testnet, verify them on Etherscan, and update the frontend + README to connect to the live testnet deployment so anyone can try EsusuChain without running a local node.

## Acceptance Criteria
- [ ] ``EsusuFactory`` deployed and verified on Sepolia Etherscan
- [ ] ``frontend/src/App.jsx`` updated with the live Sepolia factory address
- [ ] A ``deployments/`` folder added containing ``sepolia.json`` with deployed addresses and block numbers
- [ ] README updated with Sepolia contract address and Etherscan link
- [ ] Frontend vite config updated to default to Sepolia network

## Files to Edit
- ``scripts/deploy.js``
- ``frontend/src/App.jsx``
- ``hardhat.config.js``
- ``README.md``
- New: ``deployments/sepolia.json``

## Complexity
``complexity: high``
"@

gh issue create --repo $repo `
  --title "Deploy contracts to Sepolia testnet and update frontend to use live deployment" `
  --body $body6 `
  --label "help wanted,complexity: high"

Start-Sleep -Seconds 1

# Issue 7 - High
$body7 = @"
## Summary
The frontend currently polls for state by re-calling ``getPoolInfo()`` after every transaction. This is inefficient and misses updates made by other users in real time. Refactor the data loading to use ethers.js event listeners (``Contributed``, ``RoundCompleted``, ``MemberJoined`` events) so the UI updates automatically when the contract state changes.

## Acceptance Criteria
- [ ] Subscribe to ``MemberJoined``, ``Contributed``, ``RoundCompleted``, ``Withdrawal`` events on the active pool
- [ ] UI updates automatically without requiring a page refresh or manual "Refresh" button click
- [ ] Event listeners are cleaned up properly on component unmount
- [ ] Falls back gracefully if the provider does not support subscriptions (e.g., HTTP provider)

## Files to Edit
- ``frontend/src/App.jsx`` (PoolDetail component)

## Complexity
``complexity: high``
"@

gh issue create --repo $repo `
  --title "Replace polling with real-time ethers.js event listeners in Pool Detail view" `
  --body $body7 `
  --label "help wanted,complexity: high"

Write-Host "All issues created successfully!"
