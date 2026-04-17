// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EsusuPool
 * @author EsusuChain
 * @notice A decentralized Rotating Savings & Credit Association (ROSCA).
 *         Members contribute a fixed amount each cycle; one member collects
 *         the full pot per round in a fair, on-chain rotation.
 * @dev Built with ReentrancyGuard and Pausable for security.
 */
contract EsusuPool is ReentrancyGuard, Pausable {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum PoolStatus { Open, Active, Completed, Cancelled }

    // ─── State ────────────────────────────────────────────────────────────────

    string  public name;
    uint256 public contributionAmount; // in wei
    uint256 public cycleDuration;      // in seconds
    uint256 public maxMembers;
    address public admin;
    PoolStatus public status;

    address[] public members;
    uint256 public currentRound;
    uint256 public roundStartTime;

    mapping(address => bool)                         public isMember;
    mapping(uint256 => address)                      public roundWinner;
    mapping(uint256 => mapping(address => bool))     public hasContributed;
    mapping(uint256 => uint256)                      public roundContributions;
    mapping(address => bool)                         public hasWon;
    mapping(address => uint256)                      public pendingWithdrawals;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PoolCreated(string name, uint256 contributionAmount, uint256 maxMembers);
    event MemberJoined(address indexed member, uint256 totalMembers);
    event PoolStarted(uint256 startTime, uint256 cycleDuration);
    event Contributed(address indexed member, uint256 round, uint256 amount);
    event RoundCompleted(uint256 round, address indexed winner, uint256 amount);
    event Withdrawal(address indexed member, uint256 amount);
    event PoolCompleted(uint256 totalRounds);
    event PoolCancelled(string reason);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "EsusuPool: caller is not admin");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "EsusuPool: caller is not a member");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _name               Human-readable name for the pool
     * @param _contributionAmount Amount each member must contribute per round (in wei)
     * @param _cycleDuration      Duration of each round in seconds (min 1 day)
     * @param _maxMembers         Maximum number of members (min 2)
     * @param _admin              Address of the pool administrator
     */
    constructor(
        string memory _name,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers,
        address _admin
    ) {
        require(_maxMembers >= 2,           "EsusuPool: minimum 2 members");
        require(_contributionAmount > 0,    "EsusuPool: amount must be positive");
        require(_cycleDuration >= 1 days,   "EsusuPool: cycle must be at least 1 day");
        require(_admin != address(0),       "EsusuPool: invalid admin address");

        name               = _name;
        contributionAmount = _contributionAmount;
        cycleDuration      = _cycleDuration;
        maxMembers         = _maxMembers;
        admin              = _admin;
        status             = PoolStatus.Open;

        emit PoolCreated(_name, _contributionAmount, _maxMembers);
    }

    // ─── Member Actions ───────────────────────────────────────────────────────

    /**
     * @notice Join the savings pool. Pool activates automatically when full.
     */
    function join() external whenNotPaused {
        require(status == PoolStatus.Open,   "EsusuPool: pool not open for joining");
        require(!isMember[msg.sender],       "EsusuPool: already a member");
        require(members.length < maxMembers, "EsusuPool: pool is full");

        isMember[msg.sender] = true;
        members.push(msg.sender);

        emit MemberJoined(msg.sender, members.length);

        if (members.length == maxMembers) {
            _startPool();
        }
    }

    /**
     * @notice Contribute your share for the current round.
     * @dev    Exact contribution amount must be sent as msg.value.
     */
    function contribute() external payable onlyMember whenNotPaused nonReentrant {
        require(status == PoolStatus.Active,                     "EsusuPool: pool not active");
        require(msg.value == contributionAmount,                 "EsusuPool: incorrect contribution amount");
        require(!hasContributed[currentRound][msg.sender],       "EsusuPool: already contributed this round");

        hasContributed[currentRound][msg.sender] = true;
        roundContributions[currentRound]++;

        emit Contributed(msg.sender, currentRound, msg.value);

        if (roundContributions[currentRound] == members.length) {
            _completeRound();
        }
    }

    /**
     * @notice Withdraw your pending winnings.
     */
    function withdraw() external onlyMember nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "EsusuPool: nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "EsusuPool: transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    // ─── Admin Actions ────────────────────────────────────────────────────────

    /**
     * @notice Force-close a round after the cycle deadline has passed.
     * @dev    Used when not all members contributed before the deadline.
     */
    function finalizeRound() external onlyAdmin {
        require(status == PoolStatus.Active, "EsusuPool: pool not active");
        require(
            block.timestamp > roundStartTime + cycleDuration,
            "EsusuPool: round cycle not yet over"
        );
        _completeRound();
    }

    /**
     * @notice Cancel the pool and refund contributions. Emergency use only.
     */
    function cancelPool(string calldata reason) external onlyAdmin {
        require(status != PoolStatus.Completed, "EsusuPool: pool already completed");
        status = PoolStatus.Cancelled;

        // Refund any pending pool balance equally
        uint256 balance = address(this).balance;
        if (balance > 0 && members.length > 0) {
            uint256 share = balance / members.length;
            for (uint256 i = 0; i < members.length; i++) {
                pendingWithdrawals[members[i]] += share;
            }
        }

        emit PoolCancelled(reason);
    }

    function pause()   external onlyAdmin { _pause(); }
    function unpause() external onlyAdmin { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _startPool() internal {
        status         = PoolStatus.Active;
        currentRound   = 1;
        roundStartTime = block.timestamp;
        emit PoolStarted(block.timestamp, cycleDuration);
    }

    function _completeRound() internal {
        address winner    = _selectWinner();
        uint256 potAmount = roundContributions[currentRound] * contributionAmount;

        roundWinner[currentRound] = winner;
        hasWon[winner]            = true;
        pendingWithdrawals[winner] += potAmount;

        emit RoundCompleted(currentRound, winner, potAmount);

        if (currentRound == members.length) {
            status = PoolStatus.Completed;
            emit PoolCompleted(currentRound);
        } else {
            currentRound++;
            roundStartTime = block.timestamp;
        }
    }

    function _selectWinner() internal view returns (address) {
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasWon[members[i]]) {
                return members[i];
            }
        }
        revert("EsusuPool: no eligible winner found");
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getMembersCount() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getMemberStatus(address member) external view returns (
        bool _isMember,
        bool _hasContributedThisRound,
        bool _hasWon,
        uint256 _pendingWithdrawal
    ) {
        return (
            isMember[member],
            hasContributed[currentRound][member],
            hasWon[member],
            pendingWithdrawals[member]
        );
    }

    function getRoundInfo() external view returns (
        uint256 _currentRound,
        uint256 _contributions,
        uint256 _roundStartTime,
        uint256 _timeLeftSeconds,
        address _winner
    ) {
        uint256 endTime  = roundStartTime + cycleDuration;
        uint256 timeLeft = block.timestamp < endTime ? endTime - block.timestamp : 0;
        return (
            currentRound,
            roundContributions[currentRound],
            roundStartTime,
            timeLeft,
            roundWinner[currentRound]
        );
    }

    function getPoolInfo() external view returns (
        string memory  _name,
        uint256        _contributionAmount,
        uint256        _cycleDuration,
        uint256        _maxMembers,
        uint256        _currentMembers,
        PoolStatus     _status,
        uint256        _currentRound,
        uint256        _contractBalance
    ) {
        return (
            name,
            contributionAmount,
            cycleDuration,
            maxMembers,
            members.length,
            status,
            currentRound,
            address(this).balance
        );
    }

    receive() external payable {}
}
