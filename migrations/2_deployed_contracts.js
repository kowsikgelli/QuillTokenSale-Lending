const BigNumber = require("bignumber.js");
const QuillToken = artifacts.require("QuillToken");
const QuillTokenCrowdsale = artifacts.require('QuillTokenCrowdsale');
const QuillLending = artifacts.require('QuillLending');

module.exports = async function(deployer,network,accounts) {
	const _name = "Quill Token";
	const _symbol = "QUILL";
	const _decimals = 18
	const _totalSupply = new BigNumber(10).pow(18).multipliedBy(10000000).toString(10)
	const _rate = 400000;

 	await deployer.deploy(QuillToken,_name,_symbol,_decimals,_totalSupply)
 	const token = await QuillToken.deployed()
 	await deployer.deploy(QuillTokenCrowdsale,_rate,accounts[0],token.address)
 	await deployer.deploy(QuillLending,token.address);

};
