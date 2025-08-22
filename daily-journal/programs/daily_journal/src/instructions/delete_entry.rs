use crate::states::Entry;
use anchor_lang::prelude::*;

pub fn delete_entry_handler(_ctx: Context<DeleteEntry>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
#[instruction(year: u16, month: u8, day: u8)]
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        seeds = [b"entry".as_ref(), year.to_le_bytes().as_ref(), month.to_le_bytes().as_ref(), day.to_le_bytes().as_ref(), authority.key().as_ref()],
        bump,
        has_one = authority,
        close = authority
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}