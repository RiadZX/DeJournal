use crate::states::Entry;
use anchor_lang::prelude::*;

pub fn delete_entry_handler(_ctx: Context<DeleteEntry>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        seeds = [b"entry".as_ref(), entry.year.to_le_bytes().as_ref(), entry.month.to_le_bytes().as_ref(), entry.day.to_le_bytes().as_ref(), authority.key().as_ref()],
        bump,
        has_one = authority,
        close = authority
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}
