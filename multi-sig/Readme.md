# MultiSig

This is a Solana program that allows creating and managing a multi-signature wallet. This program uses the Anchor programming language to provide a high-level and easy-to-use interface for creating multi-signature wallets and managing transactions.

## Build

To build the program, you need to have the Anchor compiler installed. Once you have the compiler, you can build the program by running the following command:

```
anchor build
```

## Test
To test the program, you can use the Anchor test command:

```
anchor test
```

## Functionalities

### create_multisig

This function is used to create a multi-sig wallet. It takes in two arguments: threshold and owners. The threshold is the minimum number of signatures required to authorize a transaction and owners is the list of pubkeys that are authorized to sign transactions.

### create_transaction

This function is used to create a new transaction. It takes in one argument: instructions. Instructions is a list of solana instructions that will be executed when the transaction is approved and executed.

### approve

This function is used to approve a transaction. It takes in no arguments.

### unapprove
This function is used to unapprove a transaction. It takes in no arguments.

### execute
This function is used to execute a transaction. It takes in no arguments.

### Access Control

To ensure the security and integrity of the program, all functions in the program have been equipped with access control, which allows to validate the input and the state of the program before executing the functions.