use crate::errors::ErrorCode;
use crate::gen_multisig_wallet_seeds;
use crate::state::{MultisigTransaction, MultisigWallet};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Approval<'info> {
    #[account(mut)]
    member: Signer<'info>,
    #[account(mut)]
    multisig_wallet: Account<'info, MultisigWallet>,
    #[account(mut)]
    transaction: Account<'info, MultisigTransaction>,
}

impl<'info> Approval<'info> {
    pub fn validate(&self) -> Result<()> {
        let msig = &self.multisig_wallet;
        let tx = &self.transaction;
        require!(
            tx.multisig_wallet == msig.key(),
            ErrorCode::InvalidReferences
        );
        require!(
            msig.owners.contains(&self.member.key()),
            ErrorCode::InvalidOwner,
        );
        require!(tx.executed == false, ErrorCode::AlreadyExecuted);
        require!(tx.executor.is_none(), ErrorCode::AlreadyExecuted);
        Ok(())
    }

    pub fn approve(&mut self) -> Result<()> {
        let member = self.member.key();
        let member_idx = self
            .multisig_wallet
            .owners
            .binary_search(&member)
            .map_err(|_| ErrorCode::InvalidOwner)?;

        let tx = &mut self.transaction;
        require!(
            tx.approved[member_idx].is_none(),
            ErrorCode::TransactionAlreadySigned
        );
        tx.approved[member_idx] = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    pub fn unapprove(&mut self) -> Result<()> {
        let member = self.member.key();
        let member_idx = self
            .multisig_wallet
            .owners
            .binary_search(&member)
            .map_err(|_| ErrorCode::InvalidOwner)?;

        let tx = &mut self.transaction;
        require!(
            tx.approved[member_idx].is_some(),
            ErrorCode::TransactionAlreadySigned
        );
        tx.approved[member_idx] = None;
        Ok(())
    }
    pub fn execute(&mut self, remaining_accounts: &[AccountInfo]) -> Result<()> {
        let msig = &self.multisig_wallet;
        let total_approvals = self
            .transaction
            .approved
            .iter()
            .filter(|&approved| approved.is_some())
            .count();
        require!(
            total_approvals >= msig.threshold as usize,
            ErrorCode::NotEnoughSigners
        );

        let seeds = gen_multisig_wallet_seeds!(self.multisig_wallet);

        for ix in self.transaction.instructions.iter() {
            solana_program::program::invoke_signed(
                &ix.clone().into(),
                remaining_accounts,
                &[&seeds[..]],
            )?;
        }
        self.multisig_wallet.reload()?;

        let tx = &mut self.transaction;
        tx.executor = Some(self.member.key());
        tx.executed = true;
        Ok(())
    }
}
