use crate::errors::ErrorCode;
use crate::state::{Instruction, Multisig, Transaction};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(instructions: Vec<Instruction>)]
pub struct CreateTransaction<'info> {
    #[account(mut)]
    proposer: Signer<'info>,

    #[account(mut)]
    multisig: Account<'info, Multisig>,

    #[account(
        init,
        seeds = [
            b"Transaction".as_ref(),
            &multisig.key().as_ref(),
            &multisig.nonce.to_le_bytes().as_ref()
        ],
        bump,
        payer = proposer,
        space = Transaction::space(instructions,multisig.owners.len())
    )]
    transaction: Account<'info, Transaction>,

    system_program: Program<'info, System>,
}

impl<'info> CreateTransaction<'info> {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.multisig.owners.contains(&self.proposer.key()),
            ErrorCode::InvalidOwner
        );
        Ok(())
    }

    pub fn initialize(&mut self, instructions: Vec<Instruction>) -> Result<()> {
        let tx = &mut self.transaction;

        tx.instructions = instructions;

        tx.multisig = self.multisig.key();

        tx.proposer = self.proposer.key();

        tx.approved = (0..self.multisig.owners.len()).map(|_| None).collect();

        tx.executer = None;

        tx.did_execute = false;

        let msig = &mut self.multisig;

        msig.nonce += 1;

        Ok(())
    }
}
