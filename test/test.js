const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers")

describe("Eth Escrow", async() => {
    let escrow;

    let owner;
    let addr1;
    let addr2;

    beforeEach(async() => {
        const Escrow = await ethers.getContractFactory("EthEscrow");
        escrow = await Escrow.deploy();
        await escrow.deployed();

        [owner, addr1, addr2] = await ethers.getSigners();
    })
    it("should be able to create escrow trade", async() => {
        await escrow.createEscrowTrade(owner.address, addr1.address, addr2.address, 10);
        let result = await escrow.getEscrowInfo(0);
        
        expect(result[0] == owner.address);
        expect(result[1] == addr1.address);
        expect(result[2] == addr2.address);
        expect(result[3] == 10);
    })

    it("should allow only payer to deposit", async() => {
        await escrow.createEscrowTrade(owner.address, addr1.address, addr2.address, 10);
        await expectRevert(
            escrow.connect(addr2).deposit(0, {value: 10}),
            "VM Exception while processing transaction"
            )

        await escrow.connect(addr1).deposit(0, {value: 10})
        
        let result = await escrow.getEscrowInfo(0);
        expect(result[4] == 10)
    })

    it("escrow should only be allowed to withdraw once required eth is in the contract", async() => {
        await escrow.createEscrowTrade(owner.address, addr1.address, addr2.address, 10);
        await escrow.connect(addr1).deposit(0, {value: 10})
        
        await expectRevert(
            escrow.connect(addr1).withdraw(0),
            "VM Exception while processing transaction"
            )

        escrow.connect(addr2).withdraw(0);

        let result = await escrow.getEscrowInfo(0);

        expect(result[5] == true)
    })
})