const QuillToken = artifacts.require("./QuillToken.sol");
const BigNumber = require('bignumber.js');

require('@openzeppelin/test-helpers/configure')({
  provider: 'http://localhost:7545',
});

require('@openzeppelin/test-helpers/configure')({
  provider: web3.currentProvider,
  singletons: {
    abstraction: 'truffle',
  },
});

const time = require('@openzeppelin/test-helpers/src/time.js')


const { assertRevert } = require('./utils/assertRevert');

require('chai')
	.should();
	
contract("QuillToken",([owner,account1]) => {
	let instance;
	const _tokens = BigNumber(10).pow(18).multipliedBy(10000000);
	const _name = "Quill Token"
	const _symbol = "QUILL"
	const _decimals = 18

	// let lockPeriod = 1000
	let lockedAmount = BigNumber(10).pow(18).multipliedBy(100);	

	const nullAddress = '0x0000000000000000000000000000000000000000';
	before(async()=>{
		instance = await QuillToken.deployed();
	})
	describe("Token Details",()=>{
		beforeEach(async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
		})

		it('has correct name',async()=>{
			const name = await instance.name();
			name.should.equal(_name);
		})

		it('has correct symbol',async()=>{
			const symbol = await instance.symbol();
			symbol.should.equal(_symbol);
		})
		it('has correct decimals',async()=>{
			const decimals = await instance.decimals();
			assert.equal(decimals,_decimals,'invalid decimlas')
		})

		it('has correct supply',async()=>{
			const totalSupply = await instance.totalSupply();
			assert.equal(totalSupply,_tokens.toString(10),"supply is not valid");
		})

		it('balance of owner',async()=>{
			const balance = await instance.balanceOf(owner);
			assert.equal(balance,_tokens.toString(10));
		})
	})

	describe('Token locking',()=>{
		beforeEach(async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
		})

		it('has right balance for owner before and after transfering tokens',async ()=>{
			let balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			const totalSupply = await instance.totalSupply();

			assert.equal(balance,_tokens.toString(10),'owner balance is not right');
			assert.equal(totalBalance,_tokens.toString(10));
			assert.equal(totalSupply,_tokens.toString(10));

			// 1 million tokens transfered to account 1
			instance.transfer(account1,BigNumber(10).pow(18).multipliedBy(1000000),{from:owner});
			
			// owner should have 9 million tokens 
			balance = await instance.balanceOf(owner);
			assert.equal(balance.toString(),BigNumber(10).pow(18).multipliedBy(9000000).toString(10));

		})

		it('reduces locked tokens from transferable balance', async()=>{
			const originalBalance = await instance.balanceOf(owner);
			let lockPeriod = 1
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);

			assert.equal(balance,originalBalance - lockedAmount);
			assert.equal(totalBalance.toString(),originalBalance.toString());

			let actualLockedAmount = await instance.tokensLocked(owner);
			assert.equal(actualLockedAmount.toString(),lockedAmount.toString());

			const transferAmount = BigNumber(10).pow(18).multipliedBy(1000);
			const {logs} = await instance.transfer(account1,transferAmount,{from:owner})

			const newSenderBalance = await instance.balanceOf(owner);
			const newReceiverBalance = await instance.balanceOf(account1);

			assert.equal(newReceiverBalance.toString(),transferAmount.toString(10));

			assert.equal(newSenderBalance.toString(),balance-transferAmount)
			assert.equal(logs.length,1)
			assert.equal(logs[0].event,'Transfer');
			assert.equal(logs[0].args.from, owner);
      		assert.equal(logs[0].args.to, account1);
      		assert.equal(logs[0].args.value.toString(),transferAmount.toString(10));
		})	

		it('reverts locing more tokens via lock function',async()=>{
			const originalBalance = await instance.balanceOf(owner);
			let lockPeriod = 3;
			await instance.lock(lockedAmount,lockPeriod);
			let balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);

			const transferAmount = BigNumber(10).pow(18).multipliedBy(1000);
			const {logs} = await instance.transfer(account1,transferAmount,{from:owner})

			const newSenderBalance = await instance.balanceOf(owner);
			const newReceiverBalance = await instance.balanceOf(account1);

			balance = await instance.balanceOf(owner);

			await assertRevert(instance.lock(balance,lockPeriod));

		})

		it('cannot transfer tokens to null address', async function() {
      		await assertRevert(
        		instance.transfer(nullAddress, 100, {
          		from: owner
        		})
      		);
    	});

    	it('cannot transfer tokens from an address to null address', async () => {
      		await assertRevert(
        		instance.transferFrom(owner, nullAddress, 100, { from: owner })
      		);
    	});

    	it('should not allow 0 lock amount',async()=>{
    		lockPeriod = 1
    		await assertRevert(instance.lock(0, lockPeriod));
    	})

    })

	describe('tokens unlocking',()=>{

		it('can unlock tokens ',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			// setting lockperiod for 1 month
			lockPeriod = 1
			lockedAmount = BigNumber(10).pow(18).multipliedBy(2000000);
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())

			assert.equal(totalBalance.toString(),originalBalance.toString());

			// this line increases the time in ganache by one month so we can unlock the tokens
			await time.increase(2700000);
			
			await instance.unlock(owner);

			const balanceAfterUnlocking = await instance.balanceOf(owner);
			console.log('balanceAfterUnlocking ',balanceAfterUnlocking.toString())

			const reward = await instance.getStakerReward(owner);

			assert.equal(balanceAfterUnlocking.toString(),BigNumber(originalBalance).plus(reward).toString(10))
			
    	})
    	it('can unlock tokens ',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			// setting lockperiod for 1 month
			lockPeriod = 3
			lockedAmount = BigNumber(10).pow(18).multipliedBy(2750000);
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())

			assert.equal(totalBalance.toString(),originalBalance.toString());

			await time.increase(2700000*3);
			
			await instance.unlock(owner);

			const balanceAfterUnlocking = await instance.balanceOf(owner);
			console.log('balanceAfterUnlocking ',balanceAfterUnlocking.toString())

			const reward = await instance.getStakerReward(owner);

			assert.equal(balanceAfterUnlocking.toString(),BigNumber(originalBalance).plus(reward).toString(10))
			
    	})
    	it('can unlock tokens ',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			// setting lockperiod for 1 month
			lockPeriod = 1
			lockedAmount = BigNumber(10).pow(18).multipliedBy(1000000);
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())

			assert.equal(totalBalance.toString(),originalBalance.toString());

			await time.increase(2700000);
			
			await instance.unlock(owner);

			const balanceAfterUnlocking = await instance.balanceOf(owner);
			console.log('balanceAfterUnlocking ',balanceAfterUnlocking.toString())

			const reward = await instance.getStakerReward(owner);

			assert.equal(balanceAfterUnlocking.toString(),BigNumber(originalBalance).plus(reward).toString(10))
			
    	})
    	it('can unlock tokens ',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			// setting lockperiod for 1 month
			lockPeriod = 3
			lockedAmount = BigNumber(10).pow(18).multipliedBy(1000000);
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())

			assert.equal(totalBalance.toString(),originalBalance.toString());

			await time.increase(2700000 * 3);
			
			await instance.unlock(owner);

			const balanceAfterUnlocking = await instance.balanceOf(owner);
			console.log('balanceAfterUnlocking ',balanceAfterUnlocking.toString())

			const reward = await instance.getStakerReward(owner);

			assert.equal(balanceAfterUnlocking.toString(),BigNumber(originalBalance).plus(reward).toString(10))
			
    	})

		it('Querying user stake rewards for 1 month >= $2000 to display',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			lockPeriod = 1
			lockedAmount = BigNumber(10).pow(18).multipliedBy(2000000)
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())
			assert.equal(totalBalance.toString(),originalBalance.toString());

			//one month 2000$ staked so 16% apy for year 320000 for one month  26666 tokens

			const reward = await instance.getStakerReward(owner);
			console.log('Staker reward',reward.toString());
		})

		it('Querying user stake rewards for 3 month >= $2000 to display',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			lockPeriod = 3
			lockedAmount = BigNumber(10).pow(18).multipliedBy(2000000)
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())
			assert.equal(totalBalance.toString(),originalBalance.toString());

			//one month 2000$ staked so 16% apy for year 320000 for one month  26666 tokens

			const reward = await instance.getStakerReward(owner);
			console.log('Staker reward',reward.toString());
		})

		it('Querying user stake rewards for 1 month < $2000 to display',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			lockPeriod = 1
			lockedAmount = BigNumber(10).pow(18).multipliedBy(1000000)
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())
			assert.equal(totalBalance.toString(),originalBalance.toString());

			//one month 2000$ staked so 16% apy for year 320000 for one month  26666 tokens

			const reward = await instance.getStakerReward(owner);
			console.log('Staker reward',reward.toString());
		})

		it('Querying user stake rewards for 3 month < $2000 to display',async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			const originalBalance = await instance.balanceOf(owner);
			lockPeriod = 3
			lockedAmount = BigNumber(10).pow(18).multipliedBy(1000000)
			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			console.log('balanceAFterLocking',balance.toString())
			assert.equal(totalBalance.toString(),originalBalance.toString());

			//one month 2000$ staked so 16% apy for year 320000 for one month  26666 tokens

			const reward = await instance.getStakerReward(owner);
			console.log('Staker reward',reward.toString());
		})

	})
})
