use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

pub use errors::*;
pub use instructions::*;
pub use states::*;

declare_id!("GbEwy5B5fr4uZGAVr6GhouFQVUuDvqiscQEBeFb94wSn");

#[program]
pub mod daily_journal {
    use super::*;

    pub fn create_entry(
        ctx: Context<CreateEntry>,
        mood: String,
        year: u16,
        month: u8,
        day: u8,
        weather: String,
        message: String,
    ) -> Result<()> {
        instructions::create_entry::create_entry_handler(
            ctx, mood, year, month, day, weather, message,
        )
    }
}
