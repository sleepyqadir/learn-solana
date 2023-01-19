use anchor_lang::solana_program;
use anchor_lang::{prelude::*, solana_program::instruction::Instruction};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multi_sig {
    use super::*;

    pub fn creat_multisig(
        ctx: Context<CreateMultisig>,
        owners: Vec<Pubkey>,
        threshold: u64,
        nonce: u8,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.nonce = nonce;
        Ok(())
    }

    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        p_id: Pubkey,
        _accounts: Vec<TransactionAccount>,
        data: Vec<u8>,
    ) -> Result<()> {
        let owner_index = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|a| a == ctx.accounts.proposer.key)
            .ok_or(error!(ErrorCode::InvalidOwner))?;

        let tx = &mut ctx.accounts.transaction;
        let mut signers = Vec::new();

        msg!("hello");

        signers.resize(ctx.accounts.multisig.owners.len(), false);

        signers[owner_index] = true;

        tx.program_id = p_id;
        tx.accounts = _accounts;
        tx.data = data;
        tx.did_execute = false;
        tx.signers = signers;
        tx.multisig = *ctx.accounts.multisig.to_account_info().key;
        Ok(())
    }

    pub fn approve(ctx: Context<Approve>) -> Result<()> {
        let owner_index = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|a| a == ctx.accounts.owner.key)
            .ok_or(error!(ErrorCode::InvalidOwner))?;

        ctx.accounts.transaction.signers[owner_index] = true;

        Ok(())
    }

    pub fn set_owners(ctx: Context<Auth>, owners: Vec<Pubkey>) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        if (owners.len() as u64) < multisig.threshold {
            multisig.threshold = owners.len() as u64;
        }

        multisig.owners = owners;

        Ok(())
    }

    pub fn change_threshold(ctx: Context<Auth>, threshold: u64) -> Result<()> {
        if threshold > ctx.accounts.multisig.owners.len() as u64 {
            return err!(ErrorCode::InvalidThreshold);
        }

        let multisig = &mut ctx.accounts.multisig;

        multisig.threshold = threshold;

        Ok(())
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
        if ctx.accounts.transaction.did_execute {
            return err!(ErrorCode::AlreadyExecuted);
        }

        let sig_count = ctx
            .accounts
            .transaction
            .signers
            .iter()
            .filter_map(|s| match s {
                false => None,
                true => Some(true),
            })
            .collect::<Vec<_>>()
            .len() as u64;

        if sig_count < ctx.accounts.multisig.threshold {
            return err!(ErrorCode::NotEnoughSigners);
        }

        let mut ix: Instruction = (&*ctx.accounts.transaction).into();

        ix.accounts = ix
            .accounts
            .iter()
            .map(|account| {
                if &account.pubkey == ctx.accounts.multisig_signer.key {
                    AccountMeta::new_readonly(account.pubkey, true)
                } else {
                    account.clone()
                }
            })
            .collect();

        let seeds = &[
            ctx.accounts.multisig.to_account_info().key.as_ref(),
            &[ctx.accounts.multisig.nonce],
        ];

        let signer = &[&seeds[..]];

        let accounts = ctx.remaining_accounts;

        solana_program::program::invoke_signed(&ix, &accounts, signer)?;

        ctx.accounts.transaction.did_execute = true;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(init, payer = payer, space = 200)]
    pub multisig: Account<'info, Multisig>, // hold the program account of smart contract
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTransaction<'info> {
    pub multisig: Account<'info, Multisig>,
    #[account(init, payer=proposer, space = 1000)]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Auth<'info> {
    #[account(mut)]
    multisig: Account<'info, Multisig>,

    #[account(
        signer,
        seeds = [multisig.to_account_info().key.as_ref()],
        bump = multisig.nonce
    )]
    /// CHECK: this is used to validate the signature
    multisig_signer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Approve<'info> {
    multisig: Account<'info, Multisig>,
    #[account(mut, has_one = multisig)]
    transaction: Account<'info, Transaction>,
    owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    multisig: Account<'info, Multisig>,
    #[account(
        seeds = [multisig.to_account_info().key.as_ref()],
        bump = multisig.nonce
    )]
    /// CHECK: this is used for validation of signature
    multisig_signer: AccountInfo<'info>,
    #[account(mut, has_one = multisig)]
    transaction: Account<'info, Transaction>,
}

#[account]
pub struct Multisig {
    owners: Vec<Pubkey>,
    threshold: u64,
    nonce: u8,
}

#[account]
pub struct Transaction {
    // to which multisig this transaction get initiated or belongs to
    multisig: Pubkey, // 32
    // target program
    program_id: Pubkey, // 32
    // all the required accounts that are needed to execute this transaction
    accounts: Vec<TransactionAccount>, // 32 * 5
    // data that is needed to execute this transaction , instruction data
    data: Vec<u8>, // 1 * 5
    // signature of the transaction
    signers: Vec<bool>, // 1 * 4
    // transaction already executed or not executed
    did_execute: bool, // 1
}

impl From<&Transaction> for Instruction {
    fn from(tx: &Transaction) -> Instruction {
        Instruction {
            program_id: tx.program_id,
            accounts: tx.accounts.clone().into_iter().map(Into::into).collect(),
            data: tx.data.clone(),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionAccount {
    pubKey: Pubkey,    // 32
    is_signer: bool,   // 1
    is_writable: bool, //1
}

impl From<TransactionAccount> for AccountMeta {
    fn from(account: TransactionAccount) -> AccountMeta {
        match account.is_writable {
            false => AccountMeta::new_readonly(account.pubKey, account.is_signer),
            true => AccountMeta::new(account.pubKey, account.is_signer),
        }
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The given owner is not part of this multisig.")]
    InvalidOwner,
    #[msg("Not enough owners signed this transaction.")]
    NotEnoughSigners,
    #[msg("Cannot delete a transaction that has been signed by an owner.")]
    TransactionAlreadySigned,
    #[msg("Overflow when adding.")]
    Overflow,
    #[msg("Cannot delete a transaction the owner did not create.")]
    UnableToDelete,
    #[msg("The given transaction has already been executed.")]
    AlreadyExecuted,
    #[msg("Threshold must be less than or equal to the number of owners.")]
    InvalidThreshold,
}
