pragma solidity ^0.5.0;



contract ERC1132Modified {
    
    struct lockToken {
        uint256 amount;
        uint256 validity;
        bool claimed;
    }

    /**
     * @dev Holds number & validity of tokens locked for a given reason for
     *      a specified address
     */
    mapping(address => lockToken) public locked;

    /**
     * @dev Records data of all the tokens Locked
     */
    event Locked(
        address indexed _of,
        uint256 _amount,
        uint256 _validity
    );

    /**
     * @dev Records data of all the tokens unlocked
     */
    event Unlocked(
        address indexed _of,
        uint256 _amount
    );
    
    /**
     * @dev Locks a specified amount of tokens against an address,
     *      for a specified reason and time
     * 
     * @param _amount Number of tokens to be locked
     * @param _time Lock time in seconds
     */
    function lock(uint256 _amount, uint256 _time)
        public returns (bool);
  
    /**
     * @dev Returns tokens locked for a specified address for a
     *      specified reason
     *
     * @param _of The address whose tokens are locked
     * 
     */
    function tokensLocked(address _of)
        public view returns (uint256 amount);
    
    /**
     * @dev Returns tokens locked for a specified address for a
     *      specified reason at a specific time
     *
     * @param _of The address whose tokens are locked
     * 
     * @param _time The timestamp to query the lock tokens for
     */
    function tokensLockedAtTime(address _of, uint256 _time)
        public view returns (uint256 amount);
    
    /**
     * @dev Returns total tokens held by an address (locked + transferable)
     * @param _of The address to query the total balance of
     */
    function totalBalanceOf(address _of)
        public view returns (uint256 amount);
    
    /**
     * @dev Extends lock for a specified reason and time
     * 
     * @param _time Lock extension time in seconds
     */
    function extendLock(uint256 _time)
        public returns (bool);
    
    /**
     * @dev Increase number of tokens locked for a specified reason
     * 
     * @param _amount Number of tokens to be increased
     */
    function increaseLockAmount(uint256 _amount)
        public returns (bool);

    /**
     * @dev Returns unlockable tokens for a specified address for a specified reason
     * @param _of The address to query the the unlockable token count of
     * 
     */
    function tokensUnlockable(address _of)
        public view returns (uint256 amount);
 
    /**
     * @dev Unlocks the unlockable tokens of a specified address
     * @param _of Address of user, claiming back unlockable tokens
     */
    function unlock(address _of)
        public returns (uint256 unlockableTokens);

    /**
     * @dev Gets the unlockable tokens of a specified address
     * @param _of The address to query the the unlockable token count of
     */
    function getUnlockableTokens(address _of)
        public view returns (uint256 unlockableTokens);

}