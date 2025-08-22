# Project Description

**Deployed Frontend URL:** [TODO: Link to your deployed frontend]

**Solana Program ID:** GbEwy5B5fr4uZGAVr6GhouFQVUuDvqiscQEBeFb94wSn

## Project Overview

### Description
The Daily Journal dApp is a decentralized application built on the Solana blockchain that enables users to securely create, manage, and store personal journal entries. Each entry is associated with a specific date, allowing users to record their mood, weather conditions, and a detailed message for that day. The dApp ensures data ownership and integrity by tying each entry to the user's Solana wallet.

### Key Features
- **Create Entry**: Users can create a new journal entry for a specific year, month, and day, including their mood, the weather, and a message.
- **Edit Entry**: Existing journal entries can be updated, allowing users to modify their mood, weather, and message for a given date.
- **Delete Entry**: Users have the ability to permanently remove their journal entries.
- **Date Validation**: The program includes validation to ensure that entries are created for valid months (1-12) and days (1-31).
- **Ownership Control**: All operations (create, edit, delete) are secured, ensuring that only the original creator of an entry can modify or remove it.

### How to Use the dApp
1. **Connect Wallet**: Connect your Solana wallet to the dApp.
2. **Create a Journal Entry**: Select a date and input your mood, the weather, and your message for the day. Submit the transaction to create your entry.
3. **View/Access Entries**: Your entries will be stored on-chain, accessible via your wallet and the specific date.
4. **Edit an Entry**: To modify an existing entry, select the date of the entry, make your desired changes to the mood, weather, or message, and submit the update transaction.
5. **Delete an Entry**: To remove an entry, select the date of the entry and initiate the delete transaction.

## Program Architecture
The Daily Journal dApp utilizes a straightforward Solana program architecture centered around a single account type, `Entry`, and three core instructions. Program Derived Addresses (PDAs) are employed to ensure that each user has unique and deterministic journal entries for every specific date.

### PDA Usage
The program uses Program Derived Addresses (PDAs) to create unique and deterministic `Entry` accounts for each user for a given date.

**PDAs Used:**
- **Entry PDA**: Derived from the seeds `[b"entry", year.to_le_bytes(), month.to_le_bytes(), day.to_le_bytes(), user.key()]`. This ensures that each user can have only one journal entry per specific date (year, month, day), and that these entries are uniquely owned and controlled by the `user`'s public key.

### Program Instructions
**Instructions Implemented:**
- `create_entry`: This instruction is responsible for initializing a new `Entry` account on the Solana blockchain. It takes parameters for `mood`, `year`, `month`, `day`, `weather`, and `message`. It includes validation to ensure the `month` is between 1 and 12, and the `day` is between 1 and 31.
- `edit_entry`: This instruction allows the modification of an existing `Entry` account. It updates the `mood`, `weather`, and `message` fields of a specific entry. Crucially, it includes a `has_one = authority` constraint to ensure that only the original `authority` (creator) of the entry can edit it.
- `delete_entry`: This instruction facilitates the removal of an `Entry` account from the blockchain. Upon successful execution, the lamports (Solana's native token) held by the `Entry` account are returned to the `authority` (creator). Similar to `edit_entry`, it enforces `has_one = authority` to prevent unauthorized deletion.

### Account Structure
```rust
#[account]
#[derive(InitSpace)]
pub struct Entry {
    pub authority: Pubkey,     // The public key of the user who owns this journal entry
    #[max_len(25)]
    pub mood: String,          // Describes the user's mood for the day (max 25 characters)
    pub year: u16,             // The year of the journal entry
    pub month: u8,             // The month of the journal entry (1-12)
    pub day: u8,               // The day of the journal entry (1-31)
    #[max_len(25)]
    pub weather: String,       // Describes the weather for the day (max 25 characters)
    #[max_len(280)]
    pub message: String,       // The main content of the journal entry (max 280 characters)
}
```

## Testing

### Test Coverage
The dApp includes a comprehensive test suite written in TypeScript, covering both successful operations (happy path) and expected failure scenarios (unhappy path) to ensure the program's robustness and security.

**Happy Path Tests:**
- **Create Entry**: Verifies that new journal entries are successfully created with the correct data and associated with the correct authority. This includes creating multiple entries for different dates.
- **Edit Entry**: Confirms that existing entries can be updated by their respective authorities, and that the changes are correctly reflected on-chain.
- **Delete Entry**: Ensures that entries can be successfully deleted by their authorities, and that the account is closed.

**Unhappy Path Tests:**
- **Invalid Date**: Tests that `create_entry` fails when an invalid month (e.g., month 13) or day (e.g., day 0 or 32) is provided, returning the appropriate error (`InvalidMonth` or `InvalidDay`).
- **Unauthorized Edit**: Verifies that `edit_entry` fails if a user attempts to modify an entry they do not own, returning a `ConstraintSeeds` error.
- **Unauthorized Delete**: Confirms that `delete_entry` fails if a user attempts to delete an entry they do not own, returning a `ConstraintSeeds` error.

### Running Tests
```bash
# Install dependencies (if not already installed)
yarn install

# Run the tests
anchor test
```

### Additional Notes for Evaluators

This project demonstrates a practical application of Solana's Anchor framework for building secure and efficient on-chain programs. The use of PDAs for deterministic account addressing and the implementation of robust input validation and ownership checks are key aspects of its design.
