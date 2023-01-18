import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Puppet } from "../target/types/puppet";
import { expect } from "chai"
import { PuppetMaster } from "../target/types/puppet_master";

describe("puppet", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env()

  anchor.setProvider(provider);

  const program = anchor.workspace.Puppet as Program<Puppet>;
  const master = anchor.workspace.PuppetMaster as Program<PuppetMaster>;

  const puppetKeyPair = anchor.web3.Keypair.generate()
  const authorityKeyPair = anchor.web3.Keypair.generate()

  it("Does Cpi", async () => {
    await program.methods.initialize(authorityKeyPair.publicKey).accounts(
      {
        puppet: puppetKeyPair.publicKey,
        user: provider.wallet.publicKey,
      }).signers([puppetKeyPair]).rpc()

    await master.methods.pullStrings(new anchor.BN(42)).accounts({
      puppetProgram: program.programId,
      puppet: puppetKeyPair.publicKey,
      authority: authorityKeyPair.publicKey,
    }).signers([authorityKeyPair]).rpc();

    expect((await program.account.data.fetch(puppetKeyPair.publicKey)).data.toNumber()).to.equal(42);

  })

});
