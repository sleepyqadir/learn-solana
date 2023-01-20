use anchor_lang::prelude::*;

#[account]
pub struct Multisig {
    pub base: Pubkey,
    pub owners: Vec<Pubkey>,
    pub threshold: u16,
    pub nonce: u64,
    pub bump: u8,
}

impl Multisig {
    pub fn space(num_owners: usize) -> usize {
        8 + 32 + 4 + 32 * num_owners + 8 + 8 + 1
    }
}

#[macro_export]
macro_rules! gen_multisig_wallet_seeds {
    ($multisig_wallet:expr) => {
        &[
            b"Multisig".as_ref(),
            $multisig_wallet.base.as_ref(),
            &[$multisig_wallet.bump],
        ]
    };
}

#[account]
pub struct Transaction {
    pub multisig: Pubkey,

    pub instructions: Vec<Instruction>,
    
    pub approved: Vec<Option<u64>>,

    pub proposer: Pubkey,

    pub executer: Option<Pubkey>,

    pub did_execute: bool,
}

impl Transaction {
    pub fn space(instructions: Vec<Instruction>, num_members: usize) -> usize {
        8 + 4 + (instructions
            .iter()
            .map(|ix| ix.space())
            .sum::<usize>()) + // instructions: Vec<Instruction>,
        32 + 8 + (1+8) * num_members + 4 + 8 + 32 + (1+32) + (1+8)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default, PartialEq)]
pub struct Instruction {
    pub program_id: Pubkey,
    pub keys: Vec<AccountMeta>,
    pub data: Vec<u8>,
}

impl Instruction {
    pub fn space(&self) -> usize {
        32 + 4 + AccountMeta::LEN * self.keys.len() + 4 + self.data.len()
    }
}

impl Into<solana_program::instruction::Instruction> for Instruction {
    fn into(self) -> solana_program::instruction::Instruction {
        solana_program::instruction::Instruction {
            program_id: self.program_id.clone(),
            accounts: self.keys.clone().into_iter().map(Into::into).collect(),
            data: self.data.clone(),
        }
    }
}

impl Into<Instruction> for solana_program::instruction::Instruction {
    fn into(self) -> Instruction {
        Instruction {
            program_id: self.program_id.clone(),
            keys: self.accounts.clone().into_iter().map(Into::into).collect(),
            data: self.data.clone(),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, PartialEq, Copy, Clone)]
pub struct AccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl AccountMeta {
    pub const LEN: usize = 32 + 1 + 1;
}

impl Into<solana_program::instruction::AccountMeta> for AccountMeta {
    fn into(self) -> solana_program::instruction::AccountMeta {
        solana_program::instruction::AccountMeta {
            pubkey: self.pubkey.clone(),
            is_signer: self.is_signer.clone(),
            is_writable: self.is_writable.clone(),
        }
    }
}

impl Into<AccountMeta> for solana_program::instruction::AccountMeta {
    fn into(self) -> AccountMeta {
        AccountMeta {
            pubkey: self.pubkey.clone(),
            is_signer: self.is_signer.clone(),
            is_writable: self.is_writable.clone(),
        }
    }
}
