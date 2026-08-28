//! # Internal Helper Functions
//!
//! This module is a compatibility shim.
//!
//! `require_auth_creator` was previously re-exported here for callers that
//! reached it via `crate::helpers::require_auth_creator`.  All callers have
//! since been updated to use `crate::access::require_auth_creator` directly,
//! so the re-export has been removed (issue #1162 / unused-imports).
