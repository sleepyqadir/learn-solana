import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as acts from "./accounts";
import { assert } from "chai";
import { createMemoInstruction } from "@solana/spl-memo";
import { newMultisigRpc, findMultisigTransactionAddress, findMultisigWalletAddress, MultisigMember } from "../utils";
import { Multisig } from "../target/types/multisig";

describe("multisig", () => {
  anchor.setProvider(anchor.AnchorProvider.local());

  const program = anchor.workspace.Multisig as Program<Multisig>;

  const STARTING_BALANCE = 1_000_000_000;

  let baseKeypair = anchor.web3.Keypair.generate();
  let threshold = 2;
  let owners = [
    acts.testUser1,
    acts.testUser2,
    acts.testUser3,
  ];

  let multisigWallet = findMultisigWalletAddress(
    baseKeypair.publicKey,
    program.programId,
  );

  let multisigTransaction = findMultisigTransactionAddress(
    multisigWallet,
    new anchor.BN(0),
    program.programId
  );

  it("State is properly saturated by the Test.toml", async () => {
    let conn = anchor.getProvider().connection;

    let balance = await conn.getBalance(acts.testUser1);
    assert(balance === STARTING_BALANCE);
    assert(acts.testUser1.equals(acts.testUser1Keypair.publicKey));

    balance = await conn.getBalance(acts.testUser2);
    assert(balance === STARTING_BALANCE);
    assert(acts.testUser2.equals(acts.testUser2Keypair.publicKey));

    balance = await conn.getBalance(acts.testUser3);
    assert(balance === STARTING_BALANCE);
    assert(acts.testUser3.equals(acts.testUser3Keypair.publicKey));

    balance = await conn.getBalance(acts.testUser4);
    assert(balance === STARTING_BALANCE);
    assert(acts.testUser4.equals(acts.testUser4Keypair.publicKey));
  });

  it("Cannot initialize multisig with invalid thresholds", async () => {
    // Threshold of zero
    let err = null;
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        acts.testUser1Keypair,
        0,
        owners,
        program,
        { commitment: "processed" }
      )
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
    err = null;
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        acts.testUser1Keypair,
        4,
        owners,
        program,
        { commitment: "processed" }
      )
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
  });

  it("Initialize 2 of 3 multisig of Owners [User1, User2, User3])", async () => {
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        acts.testUser1Keypair,
        threshold,
        owners,
        program,
        { commitment: "processed" }
      )
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("User1 creates and approves a transaction on the new multisig wallet", async () => {

    const ix = createMemoInstruction("hello world", [multisigWallet]);
    const ix2 = createMemoInstruction("hi mom, I'm on the blockchain", [multisigWallet]);
    const msigMember = await MultisigMember.newFromAddress(
      acts.testUser1Keypair, multisigWallet, program);
    try {
      const signature = await msigMember.newTransactionAndApproveRpc([ix, ix2],
        { commitment: "processed" });
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("User4 cannot create a transaction on the new multisig wallet", async () => {

    const ix = createMemoInstruction("hello world", [multisigWallet]);
    const msigMember = await MultisigMember.newFromAddress(
      acts.testUser4Keypair, multisigWallet, program);
    let err = null;
    try {
      await msigMember.newTransactionRpc([ix],
        { commitment: "processed" });
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
  });

  it("User3 cannot yet execute the transaction", async () => {
    // Sleep one second, let the validator catch up.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const msigMember = await MultisigMember.newFromAddress(
      acts.testUser3Keypair, multisigWallet, program);
    let err = null;
    try {
      const signature = await msigMember.executeRpc(multisigTransaction,
        { commitment: "processed" });
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
  });

  it("User2 approves (then unapproves, then re-approves) the transaction", async () => {

    const msigMember = await MultisigMember.newFromAddress(
      acts.testUser2Keypair, multisigWallet, program);
    let err = null;
    try {
      const signature = await msigMember.approveRpc(multisigTransaction,
        { commitment: "processed" });
    } catch (e) {
      console.log(e);
      err = e;
      throw e;
    }
    assert.isNull(err);
    await new Promise((resolve) => setTimeout(resolve, 500));
    let tx = await program.account.multisigTransaction.fetch(multisigTransaction, "processed");
    assert(tx.approved[0]);
    assert(tx.approved[1]);
    assert(!tx.approved[2]);
    try {
      const signature = await msigMember.unapproveRpc(multisigTransaction,
        { commitment: "processed" });
    } catch (e) {
      console.log(e);
      err = e;
      throw e;
    }
    assert.isNull(err);
    await new Promise((resolve) => setTimeout(resolve, 500));
    tx = await program.account.multisigTransaction.fetch(multisigTransaction, "processed");
    assert(tx.approved[0]);
    assert(!tx.approved[1]);
    assert(!tx.approved[2]);
    try {
      let ix = await msigMember.approveIx(multisigTransaction);
      let ix2 = createMemoInstruction("to avoid transaction already processed error");
      const signature = await msigMember.sendTx(
        [ix, ix2],
        [acts.testUser2Keypair],
        { commitment: "processed" });
    } catch (e) {
      console.log(e);
      err = e;
      throw e;
    }
    assert.isNull(err);
    await new Promise((resolve) => setTimeout(resolve, 500));
    tx = await program.account.multisigTransaction.fetch(multisigTransaction, "processed");
    assert(tx.approved[0]);
    assert(tx.approved[1]);
    assert(!tx.approved[2]);
  });

  it("User4 cannot approve the transaction, they are not a member", async () => {
    // User 4 Approval
    const msigMember = await MultisigMember.newFromAddress(
      acts.testUser4Keypair, multisigWallet, program);
    let err = null;
    try {
      const signature = await msigMember.approveRpc(multisigTransaction,
        { commitment: "processed" });
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
  });

  it("User3 executes the transaction", async () => {
    // Sleep one second, let the validator catch up.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // User 3 Execution
    try {
      const msigMember = await MultisigMember.newFromAddress(
        acts.testUser3Keypair, multisigWallet, program);
      const signature = await msigMember.executeRpc(multisigTransaction,
        { commitment: "processed" });
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
