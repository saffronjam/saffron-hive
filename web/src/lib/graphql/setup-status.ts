import { graphql } from "$lib/gql";

/**
 * Shared so the routing gate and the setup page cannot drift apart. Operation
 * names must be unique across the document set, so two copies of this query
 * would only survive codegen while byte-identical.
 */
export const SETUP_STATUS_QUERY = graphql(`
  query setupStatus {
    setupStatus {
      hasInitialUser
    }
  }
`);
