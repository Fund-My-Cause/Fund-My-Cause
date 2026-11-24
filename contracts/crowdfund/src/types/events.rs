// contracts/crowdfund/src/types/events/mod.rs
//
//! Structured event payload types for the crowdfund contract.
//!
//! Each event emitted by the contract carries one of these structs as its data
//! payload.  Using typed structs instead of raw tuples makes events indexable,
//! self-documenting, and forward-compatible.
//!
//! Events are grouped by family into submodules:
//! - [`campaign`]: campaign lifecycle, configuration, governance, and misc.
//! - [`contribution`]: contributions, matching, delegation, and rewards.
//! - [`refund`]: refunds and cancellations.
//! - [`withdrawal`]: withdrawals, streaming, and emergency withdrawals.
//!
//! Every event is re-exported here so existing imports resolve unchanged.
//!
//! Domain/storage types live in the sibling [`super::domain`] module.

pub mod campaign;
pub mod contribution;
pub mod refund;
pub mod withdrawal;

pub use campaign::*;
pub use contribution::*;
pub use refund::*;
pub use withdrawal::*;
