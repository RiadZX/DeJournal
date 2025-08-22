use anchor_lang::prelude::*;

#[error_code]
pub enum JournalError {
    #[msg("Default error.")]
    DefaultError,
    #[msg("Invalid month.")]
    InvalidMonth,
    #[msg("Invalid day.")]
    InvalidDay,
    #[msg("Unauthorized user.")]
    Unauthorized,
}
