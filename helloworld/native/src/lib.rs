use solana_program::{
    account_info::AccountInfo, 
    entrypoint, 
    entrypoint::ProgramResult, 
    msg, 
    pubkey::Pubkey,
};


// Tells Solana that the entrypoint to this program
//  is the "process_instruction" function.
//
// Macro for the entrypoint
entrypoint!(process_instruction);


// Our entrypoint's parameters have to match the
//  anatomy of a transaction instruction (see README).
//
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {

    
    msg!("Hello, Solana!");

    msg!("Our program's Program ID: {}", &program_id);

    Ok(())
}
