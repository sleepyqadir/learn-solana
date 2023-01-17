# Solana Basics

First thing's first, we have to understand what's in a Solana transaction.

// TODO: add link of the cookbook

For a closer look at transactions, check out the Solana Core Docs or the Solana Cookbook.

The anatomy of a transaction is as follows, but here's the keys:
- key Transactions are for the Solana runtime. They contain information that Solana uses to allow or deny a transaction (signers, blockhash, etc.) and choose whether to process instructions in parallel.
- key Instructions are for Solana programs. They tell the program what to do.
- key Our program receives one instruction at a time (program_id, accounts, instruction_data).

## Transaction
```
signatures: [ s, s ]
message:
    header: 000
    addresses: [ aaa, aaa ]
    recent_blockhash: int
    instructions: [ ix, ix ]
```
## Instruction
```
program_id: xxx
accounts: [ aaa, aaa ]
instruction_data: b[]
```

