const QuillTokenCrowdsale = artifacts.require('QuillTokenCrowdsale');
const QuillToken = artifacts.require("./QuillToken.sol");
const BigNumber = require('bignumber.js');
require('chai')
	.should();

contract('QuillTokenCrowdsale',([wallet])=>{
	let TokenInstance;
	let CrowdsaleInstance;

	const _tokens = BigNumber(10).pow(18).multipliedBy(10000000);
	const _name = "Quill Token"
	const _symbol = "QUILL"
	const _decimals = 18

	const _rate = 400000;

	describe('Crowdsale',()=>{
		beforeEach(async()=>{
			TokenInstance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			CrowdsaleInstance = await QuillTokenCrowdsale.new(_rate,wallet,TokenInstance.address);
		})

		it('tracks the token',async()=>{
			const token = await CrowdsaleInstance.token();
			token.should.equal(TokenInstance.address);
		})
		it('tracks the rate',async()=>{
			const rate = await CrowdsaleInstance.rate();
			assert.equal(rate,_rate);
		})

		it('tracks the wallet',async()=>{
			const _wallet = await CrowdsaleInstance.wallet();
			_wallet.should.equal(wallet);
		})
	})
})