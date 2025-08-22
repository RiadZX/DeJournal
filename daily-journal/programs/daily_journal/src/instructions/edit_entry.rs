use crate::states::Entry;
use anchor_lang::prelude::*;

pub fn edit_entry_handler(
    ctx: Context<EditEntry>,
    mood: String,
    weather: String,
    message: String,
) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.mood = mood;
    entry.weather = weather;
    entry.message = message;
    Ok(())
}

#[derive(Accounts)]
#[instruction(mood: String, weather: String, message: String)]
pub struct EditEntry<'info> {
    #[account(
        mut,
        seeds = [b"entry".as_ref(), entry.year.to_le_bytes().as_ref(), entry.month.to_le_bytes().as_ref(), entry.day.to_le_bytes().as_ref(), authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}