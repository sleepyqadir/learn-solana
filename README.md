# learn-solana
this repo contains the practice source code and notes of solana learning

# Introduction

In Solana, data is stored on the blockchain in the form of accounts. Each account is a specific size data storage unit on the blockchain, which is mapped to an on-chain location and has a unique address. Only the designated owner of the account can modify the data stored in it. Each account can hold up to less than 10MB of data, and it can be any type of data such as strings, objects, or numbers.

Additionally, accounts can also hold executable code, known as programs or smart contracts. These programs can be executed with a transaction, which contains a list of signatures and messages. The messages contain a list of instructions, which include the program ID, accounts, and instruction data. The program then processes the instruction data and performs the appropriate actions.

For example, a program instruction to transfer Solana tokens would be directed to the Solana token account program. The program can be made the owner of the account, allowing anyone to perform the transaction by providing the instruction data. This way, the program can modify the account and the data stored in it.

In Solana, there are also Programmed Driver Addresses (PDA), which are special accounts that are designed to control access and execution of other smart contracts. These PDA accounts are programmed to perform specific functions and can be used to manage user permissions, handle payments, and enforce certain rules or conditions. They act as a gatekeeper for the smart contract, controlling who can interact with it and under what conditions. This allows for more secure and customizable interactions with smart contracts.

## Accounts:

In summary, Solana uses accounts to store state, which are an essential building block for developing on the platform. There are three types of accounts: data accounts, program accounts, and native accounts. Data accounts have a maximum size of 10MB and can be used to store data, while program accounts store executable programs and do not store state. Native accounts indicate native programs on Solana such as the System, Stake, and Vote programs. Each account has a unique address and an owner, and the data storage in accounts is paid with rent. Rent is used to maintain the account and must be paid at regular intervals to prevent the account from being deleted. A percentage of rent collected is destroyed, while the rest is distributed to vote accounts at the end of every slot.

## Programs

Programs on Solana, also known as smart contracts, serve as the foundation for on-chain activity and can be written and deployed by any developer. Programs process instructions from both end users and other programs and are stateless, meaning that any data they interact with is stored in separate accounts that are passed in via instructions. Programs themselves are stored in accounts marked as executable and are owned by the BPF Loader, executed by the Solana Runtime. Developers most commonly write programs in Rust or C++, but can choose any language that targets the LLVM's BPF backend. Solana has a number of built-in programs, called Native Programs and Solana Program Library (SPL) programs, that serve as core building blocks for on-chain interactions. Programs can be deployed via the CLI and live in accounts that are marked as executable and assigned to the BPF Loader, with their address referred to as the program_id.

### BFT

BFT stands for Byzantine Fault Tolerance. It is a property of a distributed system that is able to function correctly even when some of its components fail or behave incorrectly. In a BFT system, a consensus is reached among a group of nodes, even if some of the nodes are faulty or behaving maliciously. This is achieved by using a consensus protocol that ensures that all correct nodes will reach the same decision, despite the presence of faulty nodes. BFT algorithms are typically used in distributed systems such as blockchain networks to ensure that the network can continue to function even in the presence of failures or malicious behavior.

## Generating Paper Wallet:

```
solana-keygen new --no-outfile
```

```
pubkey: DDBsNbkhUTwoNiy6GVScyvsNft48pT4ZXVzKMFEYB6T

```

## Deployment:

Solana has three main clusters: mainnet-beta, devnet, and testnet. For developers, devnet and mainnet-beta are the most interesting. devnet is where you test your application in a more realistic environment than localnet. testnet is mostly for validators.

We are going to deploy on devnet.

Here is your deployment checklist 🚀

Run `anchor build`. Your program keypair is now in target/deploy. Keep this keypair secret. You can reuse it on all clusters.
Run `anchor keys list` to display the keypair's public key and copy it into your declare_id! macro at the top of lib.rs.
Run `anchor build` again. This step is necessary to include the new program id in the binary.
Change the provider.cluster variable in Anchor.toml to devnet.
Run `anchor deploy`
Run `anchor test`
There is more to deployments than this e.g. understanding how the BPFLoader works, how to manage keys, how to upgrade your programs and more. Keep reading to learn more!



<!-- TODO: Add Essentials of Anchor Book -->
<!-- TODO: Add TODO App Anchor Code -->
<!-- TODO: Testing of TODO App -->
<!-- TODO: Testing of Blog App -->
<!-- TODO: MultiSig Wallet App -->
<!-- TODO: Intermediate of Anchor Book -->
<!-- TODO: Vault Program in Anchor -->
<!-- TODO: Vault Program using nft in Anchor -->
<!-- TODO: COmbine Vault Program with multisig in Anchor -->
<!-- TODO: Understand the architecture of the light protocol -->

<!-- TODO: How to get the program id > what it is? -->







