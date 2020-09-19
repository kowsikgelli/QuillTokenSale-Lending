pragma solidity ^0.5.0;

import  "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import  "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ERC1132Modified.sol";

contract QuillToken is ERC20, ERC20Detailed,ERC1132Modified{

	using SafeMath for uint256;

	uint public lockedIndex = 0;

	constructor(string memory _name,string memory _symbol,uint8 _decimals,uint _totalSupply)
	ERC20Detailed(_name,_symbol,_decimals)
	public
	{
		_mint(msg.sender,_totalSupply);
	}

	function lock(uint256 _amount,uint256 _time)
	public returns(bool)
	{
		uint256 validUntil = now.add(_time);

		require(tokensLocked(msg.sender)==0,'ALREADY_LOCKED');
		require(_amount !=0 ,'AMOUNT_ZERO');

		_burn(msg.sender,_amount);

		locked[msg.sender] = lockToken(_amount,validUntil,false);
		lockedIndex = lockedIndex.add(1);

		emit Locked(msg.sender,_amount,validUntil);

		return true;
	}

	function tokensLocked(address _of)
	public view returns (uint256 amount)
	{
		if(!locked[_of].claimed)
		{
			amount = locked[_of].amount;
		}
	}


	function totalBalanceOf(address _of)
    public view returns (uint256 amount)
    {
    	amount = balanceOf(_of);

    	for(uint256 i=0;i<lockedIndex;i+=1)
    	{
    		amount = amount.add(tokensLocked(_of));
    	}
    }

    function extendLock(uint256 _time)
    public returns (bool)
    {
    	require(tokensLocked(msg.sender) > 0,'Not Locked');
    	locked[msg.sender].validity = locked[msg.sender].validity.add(_time);

    	emit Locked(msg.sender,locked[msg.sender].amount,locked[msg.sender].validity);

    	return true;
    }

    function increaseLockAmount(uint256 _amount)
    public returns (bool)
    {
    	require(tokensLocked(msg.sender) > 0,'Not Locked');

    	_burn(msg.sender,_amount);

    	locked[msg.sender].amount = locked[msg.sender].amount.add(_amount);

    	emit Locked(msg.sender,locked[msg.sender].amount,locked[msg.sender].validity);

    	return true;
    }

    function tokensUnlockable(address _of)
    public view returns (uint256)
    {
    	uint amount;
    	if(locked[_of].validity <= now && !locked[_of].claimed)
    	{
    		amount = locked[_of].amount;
    	}
    	return amount;
    }

    function unlock(address _of)
    public returns (uint256 unlockableTokens)
    {
    	uint lockedTokens;

    	//Here we calculate the reward that the user gets by locking these tokens and adds it to 
    	// unlockable tokens and new tokens minted for this address will be unlockableTokens + reward

    	for(uint i=0;i<lockedIndex;i+=1)
    	{
    		lockedTokens = tokensUnlockable(_of);
    		if(lockedTokens > 0)
    		{
    			unlockableTokens = unlockableTokens.add(lockedTokens);
    			locked[_of].claimed = true;
    			emit Unlocked(_of,lockedTokens);
    		}
    	}

    	if(unlockableTokens > 0)
    	{
    		_mint(_of,unlockableTokens);
    	}
    }

    function getUnlockableTokens(address _of)
    public view returns (uint256 unlockableTokens)
    {	
    	for(uint i=0;i<lockedIndex;i+=1)
    	{
    		unlockableTokens = unlockableTokens.add(tokensUnlockable(_of));
    	}
    }
	
}