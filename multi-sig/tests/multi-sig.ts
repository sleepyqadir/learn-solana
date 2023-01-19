import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MultiSig } from "../target/types/multi_sig";
import { assert } from "chai";

describe("multi-sig", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.MultiSig as Program<MultiSig>;

  it("should creata a multisig", async () => {
    // Add your test here.

    const firstOwner = anchor.web3.Keypair.generate()
    const secondOwner = anchor.web3.Keypair.generate()
    const thirdOwner = anchor.web3.Keypair.generate()
    const fourthOwner = anchor.web3.Keypair.generate()

    const multisig = anchor.web3.Keypair.generate()

    const threshold = new anchor.BN(2)

    const [multisigSigner, nonce] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [multisig.publicKey.toBuffer()],
        program.programId
      );


    const owners = [firstOwner.publicKey, secondOwner.publicKey, thirdOwner.publicKey, fourthOwner.publicKey]

    await program.methods.creatMultisig(owners, threshold, nonce).accounts(
      {
        multisig: multisig.publicKey,
      }
    ).signers(
      [multisig]
    ).rpc()

    let multisigAccount = await program.account.multisig.fetch(
      multisig.publicKey
    );

    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.isTrue(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepEqual(multisigAccount.owners, owners);
  });

  it("should initialize a transaction", async () => {
    // Add your test here.

    const firstOwner = anchor.web3.Keypair.generate()
    const secondOwner = anchor.web3.Keypair.generate()
    const thirdOwner = anchor.web3.Keypair.generate()
    const fourthOwner = anchor.web3.Keypair.generate()

    const multisig = anchor.web3.Keypair.generate()

    const threshold = new anchor.BN(2)

    const [multisigSigner, nonce] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [multisig.publicKey.toBuffer()],
        program.programId
      );


    const owners = [firstOwner.publicKey, secondOwner.publicKey, thirdOwner.publicKey, fourthOwner.publicKey]

    await program.methods.creatMultisig(owners, threshold, nonce).accounts(
      {
        multisig: multisig.publicKey,
      }
    ).signers(
      [multisig]
    ).rpc()

    let multisigAccount = await program.account.multisig.fetch(
      multisig.publicKey
    );

    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.isTrue(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepEqual(multisigAccount.owners, owners);

    const transaction = anchor.web3.Keypair.generate()

    const newOwners = [firstOwner.publicKey, secondOwner.publicKey]

    const data = program.coder.instruction.encode("set_owners", { owners: newOwners })

    console.log(data);

    const _accounts = [
      {
        pubKey: multisig.publicKey,
        isWritable: true,
        isSigner: false,
      },
      {
        pubKey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];


    await program.methods.createTransaction(program.programId, _accounts, data).accounts({
      multisig: multisig.publicKey,
      transaction: transaction.publicKey,
      proposer: firstOwner.publicKey
    }).signers(
      [transaction, firstOwner]
    ).rpc()


  });




});
