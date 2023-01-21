use crate::errors::ErrorCode;
use crate::state::{Instruction, MultisigTransaction, MultisigWallet};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(instructions: Vec<Instruction>)]
pub struct CreateTransaction<'info> {
    #[account(mut)]
    proposer: Signer<'info>,
    #[account(mut)]
    multisig_wallet: Account<'info, MultisigWallet>,
    #[account(
        init,
        seeds = [
            b"MultisigTransaction".as_ref(),
            &multisig_wallet.key().as_ref(),
            &multisig_wallet.nonce.to_le_bytes().as_ref(),
        ],
        bump,
        payer = proposer,
        space = MultisigTransaction::space(instructions, multisig_wallet.owners.len()),
    )]

    transaction: Account<'info, MultisigTransaction>,
    system_program: Program<'info, System>,
}

impl<'info> CreateTransaction<'info> {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.multisig_wallet.owners.contains(&self.proposer.key()),
            ErrorCode::InvalidOwner
        );
        Ok(())
    }

    pub fn initialize(&mut self, instructions: Vec<Instruction>) -> Result<()> {
        let tx = &mut self.transaction;

        tx.instructions = instructions;
        tx.multisig_wallet = self.multisig_wallet.key();
        
        tx.approved = (0..self.multisig_wallet.owners.len())
            .map(|_| None)
            .collect();
        
        tx.proposer = self.proposer.key();
        
        tx.executed = false;
        
        tx.executor = None;

        let msig = &mut self.multisig_wallet;
        
        msig.nonce += 1;
        Ok(())
    }
}
