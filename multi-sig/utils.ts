import * as anchor from "@project-serum/anchor";
import { Instruction, Program } from "@project-serum/anchor";
import { AccountMeta, Commitment, Transaction, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
import { Multisig } from "./target/types/multisig";

export type MultisigWallet = {
    base: anchor.web3.PublicKey;
    owners: anchor.web3.PublicKey[];
    threshold: number;
    nonce: anchor.BN;
    bump: number;
};

export class MultisigMember {
    private readonly signer: anchor.web3.Signer;
    public readonly walletAddress: anchor.web3.PublicKey;
    public wallet: MultisigWallet;
    private readonly program: Program<Multisig>;

    constructor(
        signer: anchor.web3.Signer,
        walletAddress: anchor.web3.PublicKey,
        wallet: MultisigWallet,
        program: Program<Multisig>,
    ) {
        this.signer = signer;
        this.walletAddress = walletAddress;
        this.wallet = wallet;
        this.program = program;
    }

    static async newFromAddress(
        signer: anchor.web3.Signer,
        walletAddress: anchor.web3.PublicKey,
        program: Program<Multisig>,
        commitment?: Commitment,
    ): Promise<MultisigMember> {
        const wallet = await program.account.multisigWallet.fetch(walletAddress, commitment);
        return new MultisigMember(
            signer,
            walletAddress,
            wallet,
            program,
        );
    }

    async refreshWallet(commitment?: Commitment) {
        this.wallet = await this.program.account.multisigWallet.fetch(this.walletAddress,
            commitment
        );
    }

    nextTransactionAddress() {
        return findMultisigTransactionAddress(
            this.walletAddress,
            this.wallet.nonce,
            this.program.programId,
        );
    }

    async sendTx(
        instructions: TransactionInstruction[],
        signers: anchor.web3.Signer[],
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {
        const conn = anchor.getProvider().connection;
        const tx = new Transaction({
            feePayer: this.signer.publicKey,
            ...(await conn.getLatestBlockhash(confirmOptions?.commitment)),
        });
        tx.add(...instructions);
        tx.sign(...signers);

        return await conn.sendTransaction(tx, signers, confirmOptions);
    }

    async newTransactionIx(
        instructions: TransactionInstruction[],
        commitment?: Commitment,
    ): Promise<TransactionInstruction> {

        await this.refreshWallet(commitment);
        const multisigTransaction = this.nextTransactionAddress();
        return await this.program.methods.createTransaction(
            instructions
        )
            .accounts({
                proposer: this.signer.publicKey,
                multisigWallet: this.walletAddress,
                transaction: multisigTransaction,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([this.signer])
            .instruction();
    }

    async approveIx(
        transaction: anchor.web3.PublicKey,
    ): Promise<TransactionInstruction> {
        return await this.program.methods.approve()
            .accounts({
                member: this.signer.publicKey,
                multisigWallet: this.walletAddress,
                transaction,
            })
            .signers([this.signer])
            .instruction();
    }

    async unapproveIx(
        transaction: anchor.web3.PublicKey,
    ): Promise<TransactionInstruction> {
        return await this.program.methods.unapprove()
            .accounts({
                member: this.signer.publicKey,
                multisigWallet: this.walletAddress,
                transaction,
            })
            .signers([this.signer])
            .instruction();
    }

    async executeIx(
        transaction: anchor.web3.PublicKey,
        commitment?: Commitment,
    ): Promise<TransactionInstruction> {
        const txData = await this.program.account.multisigTransaction.fetch(
            transaction, commitment,
        );
        let acts: AccountMeta[] = [];
        (txData.instructions as TransactionInstruction[]).map(
            (ix) => {
                acts.push({
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                });
                ix.keys.map((key) => {
                    if (!key.pubkey.equals(this.walletAddress)) {
                        acts = acts.concat([key]);
                    }
                });
            }
        )
        return await this.program.methods.execute()
            .accounts({
                member: this.signer.publicKey,
                multisigWallet: this.walletAddress,
                transaction,
            })
            .remainingAccounts([...acts,
            {
                pubkey: this.walletAddress,
                isSigner: false,
                isWritable: true,
            }])
            .signers([this.signer])
            .instruction();
    }

    async newTransactionRpc(
        instructions: TransactionInstruction[],
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {

        const ix = await this.newTransactionIx(instructions, confirmOptions?.commitment);
        return await this.sendTx(
            [ix],
            [this.signer],
            confirmOptions,
        );
    }

    async approveRpc(
        transaction: anchor.web3.PublicKey,
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {

        const ix = await this.approveIx(transaction);
        return await this.sendTx(
            [ix],
            [this.signer],
            confirmOptions,
        );
    }

    async unapproveRpc(
        transaction: anchor.web3.PublicKey,
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {

        const ix = await this.unapproveIx(transaction);
        return await this.sendTx(
            [ix],
            [this.signer],
            confirmOptions,
        );
    }

    async executeRpc(
        transaction: anchor.web3.PublicKey,
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {

        const ix = await this.executeIx(transaction, confirmOptions?.commitment);
        return await this.sendTx(
            [ix],
            [this.signer],
            confirmOptions,
        );
    }

    async newTransactionAndApproveRpc(
        instructions: TransactionInstruction[],
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {
        // Refresh our data, so that we're sure we're using an up-to-date nonce.
        await this.refreshWallet(confirmOptions?.commitment);
        const multisigTransaction = this.nextTransactionAddress();
        const newTransactionIx = await this.program.methods.createTransaction(
            instructions
        )
            .accounts({
                proposer: this.signer.publicKey,
                multisigWallet: this.walletAddress,
                transaction: multisigTransaction,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([this.signer])
            .instruction();
        const approveIx = await this.approveIx(multisigTransaction);
        return await this.sendTx(
            [newTransactionIx, approveIx], [this.signer], confirmOptions);
    }

    async approveAndExecuteRpc(
        transaction: anchor.web3.PublicKey,
        confirmOptions?: anchor.web3.ConfirmOptions,
    ): Promise<TransactionSignature> {
        const approveIx = await this.approveIx(transaction);
        const executeIx = await this.executeIx(transaction);
        return await this.sendTx(
            [approveIx, executeIx], [this.signer], confirmOptions);
    }
}

export async function newMultisigRpc(
    base: anchor.web3.Signer,
    payer: anchor.web3.Signer,
    threshold: number,
    owners: anchor.web3.PublicKey[],
    program: Program<Multisig>,
    confirmOptions?: anchor.web3.ConfirmOptions,
): Promise<TransactionSignature> {
    const multisigWallet = findMultisigWalletAddress(
        base.publicKey,
        program.programId,
    );
    return await program.methods.createMultisig(
        threshold,
        owners,
    )
        .accounts({
            base: base.publicKey,
            payer: payer.publicKey,
            multisigWallet,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([
            payer,
            base,
        ])
        .rpc(confirmOptions);
}

export function findMultisigWalletAddress(
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
export function findMultisigTransactionAddress(
    multisigWallet: anchor.web3.PublicKey,
    nonce: anchor.BN,
    program: anchor.web3.PublicKey,
): anchor.web3.PublicKey {
    let [addr, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("MultisigTransaction"),
            multisigWallet.toBuffer(),
            nonce.toBuffer('le', 8),
        ],
        program,
    );
    return addr;
}