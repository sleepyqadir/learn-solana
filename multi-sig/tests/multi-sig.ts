import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MultiSig } from "../target/types/multi_sig";
import { assert } from "chai";

async function newMultisigRpc(
  base: anchor.web3.Signer,
  payer: anchor.web3.Signer,
  threshold: number,
  members: anchor.web3.PublicKey[],
  program: Program<MultiSig>,
  confirmOptions?: anchor.web3.ConfirmOptions,
): Promise<any> {
  const multisigWallet = findMultisigWalletAddress(
    base.publicKey,
    program.programId,
  );
  return await program.methods.createMultisig(
    threshold,
    members,
  )
    .accounts({
      base: base.publicKey,
      payer: payer.publicKey,
      multisig: multisigWallet,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([
      payer,
      base,
    ])
    .rpc(confirmOptions);
}


function findMultisigWalletAddress(
  base: anchor.web3.PublicKey,
  program: anchor.web3.PublicKey,
): anchor.web3.PublicKey {
  let [addr, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MultisigWallet"),
      base.toBuffer(),
    ],
    program,
  );
  return addr;
}

function findMultisigTransactionAddress(
  multisigWallet: anchor.web3.PublicKey,
  txNonce: anchor.BN,
  program: anchor.web3.PublicKey,
): anchor.web3.PublicKey {
  let [addr, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MultisigTransaction"),
      multisigWallet.toBuffer(),
      txNonce.toBuffer('le', 8),
    ],
    program,
  );
  return addr;
}


describe("multi-sig", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.MultiSig as Program<MultiSig>;

  /// 1 SOL starting balance
  const STARTING_BALANCE = 1_000_000_000;

  // Some initialization variables to create the test multisig.
  let baseKeypair = anchor.web3.Keypair.generate();
  let firstOwner = anchor.web3.Keypair.generate();
  let secondOwner = anchor.web3.Keypair.generate();
  let thirdOwner = anchor.web3.Keypair.generate();
  let actor = anchor.web3.Keypair.generate();

  let threshold = 2;
  let owners = [
    firstOwner.publicKey,
    secondOwner.publicKey,
    thirdOwner.publicKey
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

  it("Cannot initialize multisig with invalid thresholds", async () => {
    // Threshold of zero
    let err = null;
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        actor,
        0,
        owners,
        program,
        { commitment: "processed" }
      )
    } catch (e) {
      err = e;
    }
    assert.isNotNull(err);
    // Threshold too high
    err = null;
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        actor,
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

  it("Initialize 2 of 3 multisig of members [User1, User2, User3])", async () => {
    try {
      const signature = await newMultisigRpc(
        baseKeypair,
        actor,
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
});
