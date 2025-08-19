use anchor_lang::prelude::*;

pub const MAX_BLOG_TITLE_LENGTH: usize = 256;
pub const MAX_BLOG_DESCRIPTION_LENGTH: usize = 1024;
pub const MAX_POST_BODY_LENGTH: usize = 65536;

pub const BLOG_SEED: &str = "DEBLOG";
pub const POST_SEED: &str = "POST";

// blog seed = [blog_seed, authority, title]

#[account]
#[derive(InitSpace)]
pub struct Blog {
    #[max_len(MAX_BLOG_TITLE_LENGTH)]
    pub title: String,
    #[max_len(MAX_BLOG_DESCRIPTION_LENGTH)]
    pub description: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub blog: Pubkey,
    #[max_len(MAX_POST_BODY_LENGTH)]
    pub body: String,
    pub bump: u8,
}
