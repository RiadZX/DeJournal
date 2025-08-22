use crate::errors::JournalError;
use crate::states::Entry;
use anchor_lang::prelude::*;

pub fn create_entry_handler(
    ctx: Context<CreateEntry>,
    mood: String,
    year: u16,
    month: u8,
    day: u8,
    weather: String,
    message: String,
) -> Result<()> {
    if month == 0 || month > 12 {
        return err!(JournalError::InvalidMonth);
    }
    if day == 0 || day > 31 {
        return err!(JournalError::InvalidDay);
    }

    let entry = &mut ctx.accounts.entry;
    entry.mood = mood;
    entry.year = year;
    entry.month = month;
    entry.day = day;
    entry.weather = weather;
    entry.message = message;
    entry.authority = ctx.accounts.user.key();
    Ok(())
}

#[derive(Accounts)]
#[instruction(mood: String, year: u16, month: u8, day: u8, weather: String, message: String)]
pub struct CreateEntry<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Entry::INIT_SPACE,
        seeds = [b"entry".as_ref(), year.to_le_bytes().as_ref(), month.to_le_bytes().as_ref(), day.to_le_bytes().as_ref(), user.key().as_ref()],
        bump
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
