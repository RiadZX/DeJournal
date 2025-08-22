use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Entry {
    pub authority: Pubkey,
    #[max_len(25)]
    pub mood: String,
    pub year: u16,
    pub month: u8,
    pub day: u8,
    #[max_len(25)]
    pub weather: String,
    #[max_len(280)]
    pub message: String,
}
