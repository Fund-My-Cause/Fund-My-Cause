#![no_std]
#![deny(warnings)]
#![deny(clippy::pedantic)]
// The SDK deprecated `Events::publish` in favour of `#[contractevent]`; migrating
// changes event encoding on the wire and is tracked separately from lint cleanup.
#![allow(deprecated)]

mod access_control;
mod error;
pub mod events;
mod issuance;
pub mod math;
mod validation;

#[cfg(any(test, feature = "testutils"))]
pub mod test_utils;

pub use access_control::AccessControl;
pub use error::{AchievementsError, CommonError};
pub use events::EVENT_SCHEMA_VERSION;
pub use events::{topics, EventEmitter};
pub use issuance::IssuanceValidator;
pub use math::{
    apply_bps, apply_bps_saturating, proportional, ratio_bps, BASIS_POINTS_MAX, REWARD_DIVISOR,
};
pub use validation::{
    validate_amount_range, validate_deadline, validate_goal, validate_positive_amount,
};
