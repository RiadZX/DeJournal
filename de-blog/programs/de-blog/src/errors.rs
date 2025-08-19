use anchor_lang::prelude::*;

#[error_code]
pub enum DeBlogError {
    #[msg("The provided title is too long")]
    TitleTooLong,
    #[msg("The provided description is too long")]
    DescriptionTooLong,
    #[msg("The provided body is too long")]
    BodyTooLong,
}
