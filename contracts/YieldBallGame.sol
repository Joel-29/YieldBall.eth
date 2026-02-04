// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldBallGame
 * @notice Simple game contract for YieldBall hackathon demo
 * @dev Rewards players with YBT tokens when they win
 */

interface IYieldBallToken {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract YieldBallGame {
    address public owner;
    IYieldBallToken public yieldBallToken;
    
    // Reward amount: 10 YBT per win (with 18 decimals)
    uint256 public constant REWARD_AMOUNT = 10 * 10**18;
    
    // Track player wins
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerTotalRewards;
    
    // Events
    event GameWon(address indexed player, uint256 reward, uint256 totalWins);
    event TokenAddressUpdated(address indexed oldToken, address indexed newToken);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Game: caller is not owner");
        _;
    }
    
    constructor(address _tokenAddress) {
        owner = msg.sender;
        
        if (_tokenAddress != address(0)) {
            yieldBallToken = IYieldBallToken(_tokenAddress);
        }
    }
    
    /**
     * @notice Set or update the YieldBall Token address
     * @param _tokenAddress Address of the YBT token contract
     */
    function setTokenAddress(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Game: zero address");
        emit TokenAddressUpdated(address(yieldBallToken), _tokenAddress);
        yieldBallToken = IYieldBallToken(_tokenAddress);
    }
    
    /**
     * @notice Called when a player wins the game
     * @dev Mints reward tokens directly to the player
     * @param player Address of the winning player
     * @return success Whether the reward was sent successfully
     */
    function rewardWinner(address player) external returns (bool success) {
        require(player != address(0), "Game: zero address player");
        require(address(yieldBallToken) != address(0), "Game: token not set");
        
        // Update player stats
        playerWins[player] += 1;
        playerTotalRewards[player] += REWARD_AMOUNT;
        
        // Mint tokens to player
        yieldBallToken.mint(player, REWARD_AMOUNT);
        
        emit GameWon(player, REWARD_AMOUNT, playerWins[player]);
        
        return true;
    }
    
    /**
     * @notice Alternative: Reward from contract balance (if tokens pre-funded)
     * @param player Address of the winning player
     */
    function rewardFromBalance(address player) external returns (bool success) {
        require(player != address(0), "Game: zero address player");
        require(address(yieldBallToken) != address(0), "Game: token not set");
        
        uint256 contractBalance = yieldBallToken.balanceOf(address(this));
        require(contractBalance >= REWARD_AMOUNT, "Game: insufficient token balance");
        
        // Update player stats
        playerWins[player] += 1;
        playerTotalRewards[player] += REWARD_AMOUNT;
        
        // Transfer tokens to player
        bool transferred = yieldBallToken.transfer(player, REWARD_AMOUNT);
        require(transferred, "Game: token transfer failed");
        
        emit GameWon(player, REWARD_AMOUNT, playerWins[player]);
        
        return true;
    }
    
    /**
     * @notice Get player statistics
     * @param player Address to query
     */
    function getPlayerStats(address player) external view returns (
        uint256 wins,
        uint256 totalRewards
    ) {
        return (playerWins[player], playerTotalRewards[player]);
    }
    
    /**
     * @notice Check contract's token balance
     */
    function getTokenBalance() external view returns (uint256) {
        if (address(yieldBallToken) == address(0)) return 0;
        return yieldBallToken.balanceOf(address(this));
    }
    
    /**
     * @notice Emergency withdraw tokens (owner only)
     * @param to Address to send tokens
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Game: zero address");
        require(address(yieldBallToken) != address(0), "Game: token not set");
        
        bool success = yieldBallToken.transfer(to, amount);
        require(success, "Game: withdraw failed");
        
        emit EmergencyWithdraw(to, amount);
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Game: zero address");
        owner = newOwner;
    }
}
